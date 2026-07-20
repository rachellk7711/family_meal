import { supabase } from './supabase';
import { Menu, Tag, TagType, CreateMenuInput } from './types';

/**
 * 모든 태그 목록을 조회합니다.
 */
export async function getTags(type?: TagType): Promise<Tag[]> {
  let query = supabase.from('tags').select('*').order('name', { ascending: true });
  
  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Failed to fetch tags:', error.message);
    throw new Error('태그 조회 실패');
  }

  return data as Tag[];
}

/**
 * 메뉴 목록을 필터링 및 페이징하여 조회합니다. (Masonry 갤러리 대응)
 */
export async function getMenus(options?: {
  tagId?: string;
  searchQuery?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: Menu[]; count: number }> {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('menus')
    .select(
      `
      *,
      menu_images(*),
      menu_tags(
        tags(*)
      )
    `,
      { count: 'exact' }
    );

  // 1. 태그 필터링 적용
  if (options?.tagId) {
    const { data: menuTags, error: tagFilterError } = await supabase
      .from('menu_tags')
      .select('menu_id')
      .eq('tag_id', options.tagId);

    if (tagFilterError) {
      console.error('Tag filtering query error:', tagFilterError.message);
      return { data: [], count: 0 };
    }

    const menuIds = menuTags?.map((mt) => mt.menu_id) || [];
    if (menuIds.length === 0) {
      return { data: [], count: 0 };
    }
    query = query.in('id', menuIds);
  }

  // 2. 검색어 필터링 적용 (제목 또는 메모 내 검색)
  if (options?.searchQuery) {
    query = query.or(
      `title.ilike.%${options.searchQuery}%,memo.ilike.%${options.searchQuery}%`
    );
  }

  // 3. 정렬 및 페이징
  query = query
    .order('created_at', { ascending: false })
    .range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Failed to fetch menus:', error.message);
    throw new Error('메뉴 목록 조회 실패');
  }

  // 데이터 포맷팅 (nested tags 구조를 단순화)
  const formattedMenus: Menu[] = (data || []).map((item: any) => {
    const tags = (item.menu_tags || [])
      .map((mt: any) => mt.tags)
      .filter(Boolean) as Tag[];

    // 이미지의 경우 display_order 기준 정렬
    const menu_images = (item.menu_images || []).sort(
      (a: any, b: any) => a.display_order - b.display_order
    );

    return {
      id: item.id,
      title: item.title,
      recipe_markdown: item.recipe_markdown,
      link: item.link,
      memo: item.memo,
      created_at: item.created_at,
      menu_images,
      tags,
    };
  });

  return {
    data: formattedMenus,
    count: count || 0,
  };
}

/**
 * 특정 메뉴의 상세 정보(이미지, 태그 포함)를 조회합니다.
 */
export async function getMenuById(id: string): Promise<Menu | null> {
  const { data, error } = await supabase
    .from('menus')
    .select(`
      *,
      menu_images(*),
      menu_tags(
        tags(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Failed to fetch menu detail:', error.message);
    return null;
  }

  const tags = (data.menu_tags || [])
    .map((mt: any) => mt.tags)
    .filter(Boolean) as Tag[];

  const menu_images = (data.menu_images || []).sort(
    (a: any, b: any) => a.display_order - b.display_order
  );

  return {
    id: data.id,
    title: data.title,
    recipe_markdown: data.recipe_markdown,
    link: data.link,
    memo: data.memo,
    created_at: data.created_at,
    menu_images,
    tags,
  };
}

/**
 * 신규 메뉴를 등록합니다. (태그 upsert 및 이미지 연동 트랜잭션 처리)
 */
export async function createMenu(input: CreateMenuInput): Promise<Menu> {
  // 1. 메뉴 기본정보 추가
  const { data: menuData, error: menuError } = await supabase
    .from('menus')
    .insert({
      title: input.title,
      recipe_markdown: input.recipe_markdown || null,
      link: input.link || null,
      memo: input.memo || null,
    })
    .select()
    .single();

  if (menuError || !menuData) {
    console.error('Failed to create menu:', menuError?.message);
    throw new Error(`메뉴 등록 실패: ${menuError?.message}`);
  }

  const menuId = menuData.id;

  // 2. 태그 처리 (태그가 존재한다면 upsert 후 ID 목록 획득)
  if (input.tags && input.tags.length > 0) {
    // 중복 제거
    const uniqueTags = Array.from(new Set(input.tags.map(t => t.name)))
      .map(name => input.tags.find(t => t.name === name)!);

    const { data: tagData, error: tagError } = await supabase
      .from('tags')
      .upsert(
        uniqueTags.map((t) => ({ name: t.name, type: t.type })),
        { onConflict: 'name' }
      )
      .select();

    if (tagError) {
      console.error('Failed to upsert tags:', tagError.message);
      // 부차적인 에러이므로 메뉴 생성 자체를 롤백하진 않지만 기록
    } else if (tagData && tagData.length > 0) {
      // 3. menu_tags 연결 테이블 데이터 추가
      const menuTagsToInsert = tagData.map((tag) => ({
        menu_id: menuId,
        tag_id: tag.id,
      }));

      const { error: linkError } = await supabase
        .from('menu_tags')
        .insert(menuTagsToInsert);

      if (linkError) {
        console.error('Failed to link menu and tags:', linkError.message);
      }
    }
  }

  // 4. 이미지 정보 추가
  if (input.image_urls && input.image_urls.length > 0) {
    const imagesToInsert = input.image_urls.map((url, index) => ({
      menu_id: menuId,
      image_url: url,
      display_order: index,
    }));

    const { error: imageError } = await supabase
      .from('menu_images')
      .insert(imagesToInsert);

    if (imageError) {
      console.error('Failed to insert menu images:', imageError.message);
    }
  }

  return getMenuById(menuId) as Promise<Menu>;
}

/**
 * 메뉴를 수정합니다.
 */
export async function updateMenu(
  id: string,
  input: Partial<CreateMenuInput>
): Promise<Menu> {
  // 1. 메뉴 기본정보 수정
  const updateData: any = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.recipe_markdown !== undefined) updateData.recipe_markdown = input.recipe_markdown || null;
  if (input.link !== undefined) updateData.link = input.link || null;
  if (input.memo !== undefined) updateData.memo = input.memo || null;

  if (Object.keys(updateData).length > 0) {
    const { error: menuUpdateError } = await supabase
      .from('menus')
      .update(updateData)
      .eq('id', id);

    if (menuUpdateError) {
      console.error('Failed to update menu text fields:', menuUpdateError.message);
      throw new Error('메뉴 정보 수정 실패');
    }
  }

  // 2. 태그 업데이트 (전체 삭제 후 다시 매핑)
  if (input.tags !== undefined) {
    const tagsToUpdate = input.tags;
    // 기존 매핑 삭제
    const { error: deleteTagsError } = await supabase
      .from('menu_tags')
      .delete()
      .eq('menu_id', id);

    if (deleteTagsError) {
      console.error('Failed to clear old tags mapping:', deleteTagsError.message);
    }

    if (tagsToUpdate.length > 0) {
      const uniqueTags = Array.from(new Set(tagsToUpdate.map(t => t.name)))
        .map(name => tagsToUpdate.find(t => t.name === name)!);

      const { data: tagData, error: tagUpsertError } = await supabase
        .from('tags')
        .upsert(
          uniqueTags.map((t) => ({ name: t.name, type: t.type })),
          { onConflict: 'name' }
        )
        .select();

      if (tagUpsertError) {
        console.error('Failed to upsert tags during update:', tagUpsertError.message);
      } else if (tagData && tagData.length > 0) {
        const menuTagsToInsert = tagData.map((tag) => ({
          menu_id: id,
          tag_id: tag.id,
        }));

        const { error: linkError } = await supabase
          .from('menu_tags')
          .insert(menuTagsToInsert);

        if (linkError) {
          console.error('Failed to re-link menu and tags:', linkError.message);
        }
      }
    }
  }

  // 3. 이미지 업데이트 (전체 삭제 후 다시 매핑)
  if (input.image_urls !== undefined) {
    // 기존 이미지 레코드 삭제 (Storage 파일은 삭제 안 함 - 별도 최적화 가능)
    const { error: deleteImagesError } = await supabase
      .from('menu_images')
      .delete()
      .eq('menu_id', id);

    if (deleteImagesError) {
      console.error('Failed to clear old images:', deleteImagesError.message);
    }

    if (input.image_urls.length > 0) {
      const imagesToInsert = input.image_urls.map((url, index) => ({
        menu_id: id,
        image_url: url,
        display_order: index,
      }));

      const { error: imageInsertError } = await supabase
        .from('menu_images')
        .insert(imagesToInsert);

      if (imageInsertError) {
        console.error('Failed to insert updated menu images:', imageInsertError.message);
      }
    }
  }

  return getMenuById(id) as Promise<Menu>;
}

/**
 * 메뉴를 삭제합니다. (Storage 내의 실제 이미지 파일들도 포함하여 함께 제거합니다)
 */
export async function deleteMenu(id: string): Promise<void> {
  // 1. Storage 이미지 파일들을 지우기 위해 먼저 이미지 URL 목록 조회
  const { data: images } = await supabase
    .from('menu_images')
    .select('image_url')
    .eq('menu_id', id);

  if (images && images.length > 0) {
    const filePaths = images.map((img) => {
      // Public URL에서 Storage 파일명 경로 추출
      // 예: http://localhost:54321/storage/v1/object/public/meal-images/meals/12345.jpg -> meals/12345.jpg
      const parts = img.image_url.split('/meal-images/');
      return parts.length > 1 ? parts[1] : null;
    }).filter(Boolean) as string[];

    if (filePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('meal-images')
        .remove(filePaths);

      if (storageError) {
        console.error('Failed to delete images from storage:', storageError.message);
      }
    }
  }

  // 2. DB에서 메뉴 삭제 (CASCADE 규칙에 의해 menu_images, menu_tags 자동 연쇄 삭제)
  const { error } = await supabase.from('menus').delete().eq('id', id);
  if (error) {
    console.error('Failed to delete menu from DB:', error.message);
    throw new Error('메뉴 삭제 실패');
  }
}

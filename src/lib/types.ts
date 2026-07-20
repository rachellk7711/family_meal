export interface Menu {
  id: string;
  title: string;
  recipe_markdown: string | null;
  link: string | null;
  memo: string | null;
  created_at: string;
  menu_images?: MenuImage[];
  tags?: Tag[];
}

export interface MenuImage {
  id: string;
  menu_id: string;
  image_url: string;
  display_order: number;
  created_at: string;
}

export type TagType = 'situation' | 'ingredient';

export interface Tag {
  id: string;
  name: string;
  type: TagType;
  created_at: string;
}

export interface MenuTag {
  menu_id: string;
  tag_id: string;
}

// 메뉴 등록 및 수정을 위한 입력 타입
export interface CreateMenuInput {
  title: string;
  recipe_markdown: string;
  link: string;
  memo: string;
  image_urls: string[]; // 업로드 완료된 이미지 URL 배열
  tags: { name: string; type: TagType }[]; // 연결될 태그 목록
}

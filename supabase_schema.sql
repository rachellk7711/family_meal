-- 1. menus (메뉴 테이블)
CREATE TABLE IF NOT EXISTS public.menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    recipe_markdown TEXT,
    link VARCHAR(1024),
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. tags (태그 테이블)
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('situation', 'ingredient')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. menu_tags (메뉴-태그 다대다 매핑 테이블)
CREATE TABLE IF NOT EXISTS public.menu_tags (
    menu_id UUID REFERENCES public.menus(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (menu_id, tag_id)
);

-- 4. menu_images (메뉴 이미지 테이블)
CREATE TABLE IF NOT EXISTS public.menu_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_id UUID REFERENCES public.menus(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Row Level Security (RLS) 설정
-- 로컬/개인 가족용 아카이브이므로 Anon(비로그인) 접근에 대해 읽기/쓰기를 모두 허용하도록 설정합니다.
-- 실제 배포 환경에서 보안 강화를 하려면 인증된 사용자만 쓰도록 변경해야 합니다.

ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_images ENABLE ROW LEVEL SECURITY;

-- menus 정책
CREATE POLICY "Allow public read for menus" ON public.menus FOR SELECT USING (true);
CREATE POLICY "Allow public insert for menus" ON public.menus FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for menus" ON public.menus FOR UPDATE USING (true);
CREATE POLICY "Allow public delete for menus" ON public.menus FOR DELETE USING (true);

-- tags 정책
CREATE POLICY "Allow public read for tags" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Allow public insert for tags" ON public.tags FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete for tags" ON public.tags FOR DELETE USING (true);

-- menu_tags 정책
CREATE POLICY "Allow public read for menu_tags" ON public.menu_tags FOR SELECT USING (true);
CREATE POLICY "Allow public insert for menu_tags" ON public.menu_tags FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete for menu_tags" ON public.menu_tags FOR DELETE USING (true);

-- menu_images 정책
CREATE POLICY "Allow public read for menu_images" ON public.menu_images FOR SELECT USING (true);
CREATE POLICY "Allow public insert for menu_images" ON public.menu_images FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete for menu_images" ON public.menu_images FOR DELETE USING (true);


/*
------------------------------------------------------------------
[Supabase Storage 설정 가이드]
------------------------------------------------------------------
1. Supabase Dashboard -> Storage 페이지로 이동합니다.
2. 'New bucket' 버튼을 클릭합니다.
3. 버킷 이름: `meal-images`로 설정합니다.
4. 'Public bucket' 옵션을 활성화(체크)합니다. (이미지 조회를 전체 공개로 설정하기 위함)
5. 'Save'를 눌러 저장합니다.
6. 생성된 `meal-images` 버킷의 Policies 탭으로 이동합니다.
7. 아래 2가지 Policy를 설정합니다:
   - SELECT(조회): Target Roles에 'anon' 및 'authenticated' 지정 / Using expression에 true 입력 (기본값)
   - INSERT/UPDATE/DELETE(생성/수정/삭제): Target Roles에 'anon' 및 'authenticated' 지정 / Allowed operations 체크
*/

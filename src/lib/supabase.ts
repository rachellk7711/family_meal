import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isPlaceholder = 
  !rawUrl || 
  rawUrl === 'your-supabase-project-url' || 
  !rawKey || 
  rawKey === 'your-supabase-anon-key';

if (isPlaceholder) {
  console.warn(
    'Warning: Supabase URL or Anon Key is not properly set. Please check your .env.local file.'
  );
}

// 빌드 타임에 Next.js가 모듈을 로드하며 발생하는 URL 유효성 검사 에러를 방지하기 위해 더미 URL을 사용합니다.
const supabaseUrl = isPlaceholder ? 'https://placeholder-project.supabase.co' : rawUrl;
const supabaseAnonKey = isPlaceholder ? 'placeholder-anon-key' : rawKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

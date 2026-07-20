import imageCompression from 'browser-image-compression';
import { supabase } from './supabase';

/**
 * browser-image-compression 라이브러리를 이용하여 이미지를 압축합니다.
 * @param file 압축할 원본 이미지 파일
 * @returns 압축된 이미지 파일 (실패 시 원본 파일 반환)
 */
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1,             // 최대 용량 1MB
    maxWidthOrHeight: 1920,   // 최대 해상도 1920px (가로/세로 중 큰 쪽 기준)
    useWebWorker: true,       // 성능 향상을 위해 Web Worker 사용
  };

  try {
    // browser-image-compression은 브라우저 환경에서만 동작합니다.
    if (typeof window === 'undefined') {
      return file;
    }
    const compressedBlob = await imageCompression(file, options);
    // Blob을 File 객체로 재변환 (기존 파일 이름 및 타입 유지)
    return new File([compressedBlob], file.name, {
      type: file.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Image compression failed, fallback to original:', error);
    return file;
  }
}

/**
 * 이미지를 압축한 후 Supabase Storage의 'meal-images' 버킷에 업로드합니다.
 * @param file 업로드할 원본 이미지 파일
 * @returns 업로드 완료된 이미지의 Public URL
 */
export async function uploadMealImage(file: File): Promise<string> {
  // 1. 이미지 압축 실행
  const compressedFile = await compressImage(file);

  // 2. 파일 이름 고유화 (타임스탬프 및 난수 조합)
  const fileExt = file.name.split('.').pop() || 'jpg';
  const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `meals/${uniqueName}`;

  // 3. Supabase Storage 업로드 실행
  const { error } = await supabase.storage
    .from('meal-images')
    .upload(filePath, compressedFile, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Failed to upload image to Supabase Storage:', error.message);
    throw new Error(`이미지 업로드 실패: ${error.message}`);
  }

  // 4. Public URL 가져오기
  const { data } = supabase.storage
    .from('meal-images')
    .getPublicUrl(filePath);

  if (!data?.publicUrl) {
    throw new Error('업로드된 이미지의 Public URL을 가져오는 데 실패했습니다.');
  }

  return data.publicUrl;
}

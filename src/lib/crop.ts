import { PixelCrop } from 'react-image-crop';

/**
 * 브라우저 HTML Image 객체와 지정된 크롭 픽셀 좌표를 바탕으로 
 * Canvas를 이용해 잘라낸 이미지 파일(File)을 생성해냅니다.
 * 
 * @param image HTML Image 요소
 * @param crop 자르기 픽셀 정보 (x, y, width, height)
 * @param fileName 저장할 파일명
 */
export async function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
  fileName: string
): Promise<File> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D Context를 생성할 수 없습니다.');
  }

  // 최상 품질의 안티앨리어싱 품질 설정
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Canvas 위에 원본 이미지의 크롭 지정 영역만 드로잉
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas 이미지를 파일 데이터(Blob)로 변환하는 데 실패했습니다.'));
          return;
        }

        // 기존 파일 확장자를 유지하여 File 객체 재구성
        const fileExt = fileName.split('.').pop() || 'jpg';
        const fileType = fileExt === 'png' ? 'image/png' : fileExt === 'webp' ? 'image/webp' : 'image/jpeg';
        
        const croppedFile = new File([blob], fileName, {
          type: fileType,
          lastModified: Date.now(),
        });
        
        resolve(croppedFile);
      },
      'image/jpeg',
      0.92 // 압축률 92% (고화질 유지)
    );
  });
}

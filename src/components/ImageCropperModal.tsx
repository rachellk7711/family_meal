'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Check, Loader2, Maximize, RotateCcw } from 'lucide-react';
import { getCroppedImg } from '@/lib/crop';

interface ImageCropperModalProps {
  file: File;
  onCropComplete: (croppedFile: File) => void;
  onCancel: () => void;
}

export default function ImageCropperModal({
  file,
  onCropComplete,
  onCancel,
}: ImageCropperModalProps) {
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(1); // 기본 1:1 정사각형
  const [isProcessing, setIsProcessing] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);

  // 로컬 파일 읽어서 이미지 소스 생성
  useEffect(() => {
    const reader = new FileReader();
    reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
    reader.readAsDataURL(file);
  }, [file]);

  // 이미지 로드 시 기본 크롭 영역 설정
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    
    if (aspect) {
      const initialCrop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 80,
          },
          aspect,
          width,
          height
        ),
        width,
        height
      );
      setCrop(initialCrop);
    } else {
      setCrop({
        unit: '%',
        width: 80,
        height: 80,
        x: 10,
        y: 10,
      });
    }
  }

  // 종횡비 전환
  const handleAspectToggle = (newAspect: number | undefined) => {
    setAspect(newAspect);
    if (!imgRef.current) return;

    const { width, height } = imgRef.current;
    if (newAspect) {
      const newCrop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 80,
          },
          newAspect,
          width,
          height
        ),
        width,
        height
      );
      setCrop(newCrop);
    } else {
      setCrop({
        unit: '%',
        width: 80,
        height: 80,
        x: 10,
        y: 10,
      });
    }
  };

  // 크롭 이미지 추출 및 완료 전달
  const handleCropSave = async () => {
    if (!imgRef.current || !completedCrop) {
      alert('크롭 영역을 선택해 주세요.');
      return;
    }

    try {
      setIsProcessing(true);
      const croppedFile = await getCroppedImg(
        imgRef.current,
        completedCrop,
        file.name
      );
      onCropComplete(croppedFile);
    } catch (error) {
      console.error('Failed to crop image:', error);
      alert('이미지를 편집하는 데 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-md">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg overflow-hidden border border-zinc-200/50 dark:border-zinc-800/40 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* 모달 상단 */}
        <div className="px-6 py-4.5 border-b border-zinc-200/50 dark:border-zinc-800/40 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/60">
          <div>
            <h3 className="font-extrabold text-zinc-900 dark:text-zinc-50 text-base">요리 사진 자르기</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">원하는 구도로 사진을 조절하세요.</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="p-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 모달 본문 (크롭 작업 영역) */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950/40 min-h-[250px]">
          {imgSrc ? (
            <div className="max-w-full max-h-[50vh] overflow-hidden rounded-xl bg-zinc-200/50 dark:bg-zinc-950 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                circularCrop={false}
                keepSelection={true}
                className="max-h-full"
              >
                <img
                  ref={imgRef}
                  src={imgSrc}
                  alt="Crop Source"
                  onLoad={onImageLoad}
                  className="max-w-full max-h-[50vh] object-contain"
                />
              </ReactCrop>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-zinc-400">
              <Loader2 className="animate-spin" size={24} />
              <span className="text-xs">이미지 불러오는 중...</span>
            </div>
          )}
        </div>

        {/* 모달 하단 컨트롤러 & 액션 */}
        <div className="p-6 border-t border-zinc-200/50 dark:border-zinc-800/40 bg-zinc-50 dark:bg-zinc-900/40 space-y-4">
          
          {/* 종횡비 비율 컨트롤 버튼 */}
          <div className="flex justify-center gap-2.5">
            <button
              type="button"
              onClick={() => handleAspectToggle(1)}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border transition-all flex items-center gap-1.5 cursor-pointer ${
                aspect === 1
                  ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                  : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-850 hover:bg-zinc-100'
              }`}
            >
              <span className="w-3.5 h-3.5 border-2 border-current rounded-xs"></span>
              <span>1:1 정사각형</span>
            </button>
            
            <button
              type="button"
              onClick={() => handleAspectToggle(1.6)} // 16:10 유사 가로형
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border transition-all flex items-center gap-1.5 cursor-pointer ${
                aspect === 1.6
                  ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                  : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-850 hover:bg-zinc-100'
              }`}
            >
              <span className="w-5 h-3.5 border-2 border-current rounded-xs"></span>
              <span>16:10 가로형</span>
            </button>

            <button
              type="button"
              onClick={() => handleAspectToggle(undefined)}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border transition-all flex items-center gap-1.5 cursor-pointer ${
                aspect === undefined
                  ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                  : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-850 hover:bg-zinc-100'
              }`}
            >
              <Maximize size={12} />
              <span>자유 자르기</span>
            </button>
          </div>

          {/* 액션 실행 버튼 */}
          <div className="flex gap-2.5 justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="px-4.5 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleCropSave}
              disabled={isProcessing || !completedCrop}
              className="px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:from-zinc-400 disabled:to-zinc-500 text-white text-xs font-extrabold transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span>편집 중...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>자르기 적용</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

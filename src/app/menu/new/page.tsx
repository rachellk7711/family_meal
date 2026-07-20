'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Image as ImageIcon, Loader2, X, PlusCircle, Link as LinkIcon, FileText, Camera } from 'lucide-react';
import Link from 'next/link';
import { uploadMealImage } from '@/lib/image';
import { createMenu } from '@/lib/api';
import { TagType } from '@/lib/types';
import TagInput from '@/components/TagInput';

export default function NewMenuPage() {
  const router = useRouter();

  // 폼 입력 상태
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [memo, setMemo] = useState('');
  const [recipeMarkdown, setRecipeMarkdown] = useState('');
  const [tags, setTags] = useState<{ name: string; type: TagType }[]>([]);

  // 이미지 파일 관리
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  // 로딩 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // 이미지 선택 처리
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);

      // 미리보기 생성
      const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newPreviews]);
    }
  };

  // 이미지 제거 처리
  const removeSelectedImage = (indexToRemove: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    
    // 메모리 누수 방지를 위해 object URL 해제
    URL.revokeObjectURL(previewUrls[indexToRemove]);
    setPreviewUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
      );
      setSelectedFiles((prev) => [...prev, ...filesArray]);

      const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newPreviews]);
    }
  };

  // 데이터 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('메뉴 이름을 입력해 주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      const imageUrls: string[] = [];

      // 1. 이미지 순차 압축 및 업로드
      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          setUploadProgress(`이미지 업로드 중 (${i + 1}/${selectedFiles.length})...`);
          const url = await uploadMealImage(selectedFiles[i]);
          imageUrls.push(url);
        }
      }

      setUploadProgress('메뉴 데이터 저장 중...');

      // 2. DB 메뉴 레코드 생성
      const newMenu = await createMenu({
        title: title.trim(),
        link: link.trim(),
        memo: memo.trim(),
        recipe_markdown: recipeMarkdown.trim(),
        tags,
        image_urls: imageUrls,
      });

      // 3. 완료 시 상세 페이지로 이동
      router.push(`/menu/${newMenu.id}`);
      router.refresh();
    } catch (error: any) {
      console.error(error);
      alert(`메뉴 등록에 실패했습니다: ${error.message}`);
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 pb-20">
      {/* 상단 네비게이션 헤더 */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200/60 dark:border-zinc-800/40">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition-colors"
          >
            <ArrowLeft size={18} />
            <span>식탁 목록</span>
          </Link>
          <h1 className="text-base font-extrabold tracking-tight">새 식탁 등록하기</h1>
          <div className="w-16"></div> {/* 균형을 위한 빈 공간 */}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 카드 1: 이미지 업로드 */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200/50 dark:border-zinc-800/40 shadow-xs">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ImageIcon size={16} /> 요리 사진 등록
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 앨범 선택 및 드래그 */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 rounded-xl p-6 text-center transition-colors relative cursor-pointer group flex flex-col items-center justify-center min-h-[140px]"
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
                  <ImageIcon size={18} />
                </div>
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">앨범에서 요리 사진 선택</span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">또는 사진 드래그 앤 드롭</span>
              </div>

              {/* 모바일 카메라 촬영 */}
              <div
                className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-orange-500/50 dark:hover:border-orange-500/50 rounded-xl p-6 text-center transition-colors relative cursor-pointer group flex flex-col items-center justify-center min-h-[140px]"
              >
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
                  <Camera size={18} />
                </div>
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">카메라로 요리 즉시 촬영</span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">모바일 카메라 다이렉트 호출</span>
              </div>
            </div>

            {/* 선택된 이미지 미리보기 리스트 */}
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                {previewUrls.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group bg-zinc-100 dark:bg-zinc-950 border border-zinc-200/40 dark:border-zinc-800/40">
                    <img
                      src={url}
                      alt={`미리보기 ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeSelectedImage(idx)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 hover:bg-red-600 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 카드 2: 메뉴 기본 정보 */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200/50 dark:border-zinc-800/40 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <PlusCircle size={16} /> 식탁 정보
            </h2>
            
            {/* 메뉴 이름 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">메뉴 이름 (필수)</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 얼큰 칼칼 돼지고기 두부조림"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm transition-all"
              />
            </div>

            {/* 외부 레시피 링크 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <LinkIcon size={12} /> 레시피 출처 링크 (선택)
              </label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="예: 유튜브 주소 또는 블로그 URL"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm transition-all"
              />
            </div>

            {/* 한줄 요리 팁 / 메모 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">한줄 메모 / 요리 팁 (선택)</label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="예: 국물이 약간 자작해야 밥 비벼 먹기 좋아요!"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm transition-all"
              />
            </div>
          </div>

          {/* 카드 3: 태그 관리 */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200/50 dark:border-zinc-800/40 shadow-xs">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              # 태그 관리
            </h2>
            <TagInput tags={tags} onChange={setTags} />
          </div>

          {/* 카드 4: 마크다운 레시피 복사/붙여넣기 */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200/50 dark:border-zinc-800/40 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <FileText size={16} /> AI 레시피 마크다운 (선택)
            </h2>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                제미나이 AI 등에서 복사한 레시피 텍스트를 붙여넣으세요.
              </label>
              <textarea
                value={recipeMarkdown}
                onChange={(e) => setRecipeMarkdown(e.target.value)}
                placeholder={`### 재료 정보\n- 돼지고기 300g\n- 두부 1모\n- 양파 1/2개\n\n### 조리 순서\n1. 냄비에 기름을 두르고...`}
                rows={8}
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-mono transition-all resize-y"
              />
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3 justify-end">
            <Link
              href="/"
              className="px-6 py-3 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-sm font-bold transition-all active:scale-95 text-center"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:from-zinc-400 disabled:to-zinc-500 text-white text-sm font-extrabold transition-all shadow-md shadow-orange-500/10 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{uploadProgress || '저장 중...'}</span>
                </>
              ) : (
                <span>등록 완료</span>
              )}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}

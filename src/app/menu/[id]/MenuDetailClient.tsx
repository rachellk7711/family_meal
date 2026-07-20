'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Trash2, Calendar, Link as LinkIcon, FileText, Check, X, ImageIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Menu, TagType } from '@/lib/types';
import { deleteMenu, updateMenu } from '@/lib/api';
import { uploadMealImage } from '@/lib/image';
import ImageSlider from '@/components/ImageSlider';
import MarkdownViewer from '@/components/MarkdownViewer';
import TagInput from '@/components/TagInput';

interface MenuDetailClientProps {
  initialMenu: Menu;
}

export default function MenuDetailClient({ initialMenu }: MenuDetailClientProps) {
  const router = useRouter();
  const [menu, setMenu] = useState<Menu>(initialMenu);

  // 모드 상태
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 수정용 폼 상태
  const [editTitle, setEditTitle] = useState(menu.title);
  const [editLink, setEditLink] = useState(menu.link || '');
  const [editMemo, setEditMemo] = useState(menu.memo || '');
  const [editMarkdown, setEditMarkdown] = useState(menu.recipe_markdown || '');
  const [editTags, setEditTags] = useState<{ name: string; type: TagType }[]>(
    menu.tags?.map((t) => ({ name: t.name, type: t.type })) || []
  );

  // 수정 모드 이미지 관리
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [tempPreviewUrls, setTempPreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(
    menu.menu_images?.map((img) => img.image_url) || []
  );

  const [uploadProgress, setUploadProgress] = useState('');

  // 삭제 핸들러
  const handleDelete = async () => {
    if (!window.confirm('정말로 이 메뉴를 아카이브에서 삭제하시겠습니까? 관련 사진도 모두 삭제됩니다.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteMenu(menu.id);
      router.push('/');
      router.refresh();
    } catch (err: any) {
      alert(`삭제 중 에러가 발생했습니다: ${err.message}`);
      setIsDeleting(false);
    }
  };

  // 수정용 새 이미지 선택
  const handleNewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setNewImageFiles((prev) => [...prev, ...filesArray]);

      const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
      setTempPreviewUrls((prev) => [...prev, ...newPreviews]);
    }
  };

  // 임시 선택 이미지 제거
  const removeTempImage = (idxToRemove: number) => {
    setNewImageFiles((prev) => prev.filter((_, idx) => idx !== idxToRemove));
    URL.revokeObjectURL(tempPreviewUrls[idxToRemove]);
    setTempPreviewUrls((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  // 기존 이미지 제거 (수정 시)
  const removeExistingImage = (urlToRemove: string) => {
    setExistingImages((prev) => prev.filter((url) => url !== urlToRemove));
  };

  // 수정 정보 저장
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editTitle.trim()) {
      alert('메뉴 이름을 입력해 주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      const imageUrls = [...existingImages];

      // 새 이미지들이 있으면 압축하여 업로드
      if (newImageFiles.length > 0) {
        for (let i = 0; i < newImageFiles.length; i++) {
          setUploadProgress(`새 이미지 업로드 중 (${i + 1}/${newImageFiles.length})...`);
          const url = await uploadMealImage(newImageFiles[i]);
          imageUrls.push(url);
        }
      }

      setUploadProgress('저장 중...');

      const updated = await updateMenu(menu.id, {
        title: editTitle.trim(),
        link: editLink.trim(),
        memo: editMemo.trim(),
        recipe_markdown: editMarkdown.trim(),
        tags: editTags,
        image_urls: imageUrls,
      });

      setMenu(updated);
      setIsEditing(false);
      
      // 임시 파일 클리어
      setNewImageFiles([]);
      tempPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      setTempPreviewUrls([]);
      setExistingImages(updated.menu_images?.map((img) => img.image_url) || []);
      
      router.refresh();
    } catch (err: any) {
      alert(`수정에 실패했습니다: ${err.message}`);
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  // 수정 취소
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle(menu.title);
    setEditLink(menu.link || '');
    setEditMemo(menu.memo || '');
    setEditMarkdown(menu.recipe_markdown || '');
    setEditTags(menu.tags?.map((t) => ({ name: t.name, type: t.type })) || []);
    setNewImageFiles([]);
    tempPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    setTempPreviewUrls([]);
    setExistingImages(menu.menu_images?.map((img) => img.image_url) || []);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 pb-24">
      {/* 상세 페이지 헤더 */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200/60 dark:border-zinc-800/40">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition-colors"
          >
            <ArrowLeft size={18} />
            <span>식탁 목록</span>
          </Link>
          
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 rounded-xl text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                  title="수정하기"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-2 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer disabled:opacity-50"
                  title="삭제하기"
                >
                  <Trash2 size={18} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                  className="p-2 rounded-xl text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                  title="수정 취소"
                >
                  <X size={18} />
                </button>
                <button
                  onClick={handleUpdateSubmit}
                  disabled={isSubmitting}
                  className="p-2 rounded-xl text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all cursor-pointer"
                  title="수정 완료"
                >
                  <Check size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-8">
        {isEditing ? (
          /* ==================== 수정 모드 폼 ==================== */
          <form onSubmit={handleUpdateSubmit} className="space-y-6">
            
            {/* 제목 수정 */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200/50 dark:border-zinc-800/40 shadow-xs space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">메뉴 이름</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm transition-all"
                />
              </div>

              {/* 외부 링크 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">레시피 출처 링크</label>
                <input
                  type="url"
                  value={editLink}
                  onChange={(e) => setEditLink(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm transition-all"
                />
              </div>

              {/* 요리 팁 / 메모 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">한줄 요리 팁 / 메모</label>
                <input
                  type="text"
                  value={editMemo}
                  onChange={(e) => setEditMemo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm transition-all"
                />
              </div>
            </div>

            {/* 이미지 수정 관리 */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200/50 dark:border-zinc-800/40 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <ImageIcon size={16} /> 요리 사진 편집
              </h3>

              {/* 기존 업로드 이미지 */}
              {existingImages.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">유지할 기존 요리 사진:</span>
                  <div className="grid grid-cols-4 gap-2">
                    {existingImages.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 border border-zinc-200/50">
                        <img src={url} alt="기존 이미지" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(url)}
                          className="absolute top-1 right-1 w-5.5 h-5.5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 새 이미지 드래그앤드롭/파일선택 */}
              <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 rounded-xl p-6 text-center transition-colors relative cursor-pointer group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleNewImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-1.5">
                  <div className="text-amber-500">
                    <ImageIcon size={18} />
                  </div>
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">새로운 요리 사진 추가</span>
                </div>
              </div>

              {/* 새로 추가된 임시 이미지 미리보기 */}
              {tempPreviewUrls.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">새로 추가된 사진 (저장 후 업로드됨):</span>
                  <div className="grid grid-cols-4 gap-2">
                    {tempPreviewUrls.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 border border-zinc-200/50">
                        <img src={url} alt="새 임시 이미지" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeTempImage(idx)}
                          className="absolute top-1 right-1 w-5.5 h-5.5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 태그 편집 */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200/50 dark:border-zinc-800/40 shadow-xs">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">태그 수정</h3>
              <TagInput tags={editTags} onChange={setEditTags} />
            </div>

            {/* AI 레시피 텍스트 편집 */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200/50 dark:border-zinc-800/40 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <FileText size={16} /> AI 레시피 마크다운 수정
              </h3>
              <textarea
                value={editMarkdown}
                onChange={(e) => setEditMarkdown(e.target.value)}
                rows={10}
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-mono transition-all resize-y"
              />
            </div>

            {/* 저장/취소 하단 바 */}
            <div className="flex justify-end gap-3.5">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-300 transition-all cursor-pointer"
              >
                수정 취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-extrabold shadow-sm hover:shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    <span>{uploadProgress || '저장 중...'}</span>
                  </>
                ) : (
                  <span>수정 완료</span>
                )}
              </button>
            </div>

          </form>
        ) : (
          /* ==================== 일반 상세 뷰 모드 ==================== */
          <div className="space-y-6.5">
            {/* 제목 영역 */}
            <div className="space-y-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
                {menu.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1">
                  <Calendar size={13} />
                  <span>{new Date(menu.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}</span>
                </span>
                {menu.link && (
                  <a
                    href={menu.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-bold transition-colors"
                  >
                    <LinkIcon size={13} />
                    <span>레시피 참고 사이트</span>
                  </a>
                )}
              </div>
            </div>

            {/* 태그 리스트 */}
            {menu.tags && menu.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {menu.tags.map((tag) => {
                  const isSituation = tag.type === 'situation';
                  return (
                    <span
                      key={tag.id}
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold border tracking-wider ${
                        isSituation
                          ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-900/20'
                          : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-900/20'
                      }`}
                    >
                      #{tag.name}
                    </span>
                  );
                })}
              </div>
            )}

            {/* 요리 팁 / 메모 카드 */}
            {menu.memo && (
              <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/25 rounded-2xl p-5">
                <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1">
                  💡 요리 메모 / 팁
                </span>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
                  {menu.memo}
                </p>
              </div>
            )}

            {/* 이미지 슬라이더 */}
            <ImageSlider images={menu.menu_images || []} />

            {/* AI 마크다운 레시피 */}
            {menu.recipe_markdown ? (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200/50 dark:border-zinc-800/40 shadow-xs space-y-4">
                <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50 border-b pb-3.5 border-zinc-200/50 dark:border-zinc-800/50 flex items-center gap-2">
                  <FileText size={18} className="text-amber-500" /> 맛있는 레시피 가이드
                </h2>
                <MarkdownViewer content={menu.recipe_markdown} />
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200/50 dark:border-zinc-800/40 shadow-xs text-center">
                <p className="text-sm text-zinc-400 italic">등록된 상세 레시피 마크다운이 없습니다.</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-3.5 text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline"
                >
                  레시피 추가하러 가기 →
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

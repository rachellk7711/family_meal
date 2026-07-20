'use client';

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { TagType } from '@/lib/types';

interface TagInputProps {
  tags: { name: string; type: TagType }[];
  onChange: (tags: { name: string; type: TagType }[]) => void;
}

export default function TagInput({ tags, onChange }: TagInputProps) {
  const [inputVal, setInputVal] = useState('');
  const [tagType, setTagType] = useState<TagType>('situation');

  const addTag = () => {
    const trimmed = inputVal.trim().replace(/^#/, ''); // # 기호 제거
    if (!trimmed) return;

    // 중복 검사
    if (tags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
      setInputVal('');
      return;
    }

    const newTags = [...tags, { name: trimmed, type: tagType }];
    onChange(newTags);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // 폼 제출 방지
      addTag();
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-3.5">
      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* 태그 타입 셀렉터 */}
        <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-900 p-1 border border-zinc-200/50 dark:border-zinc-800/50 self-start">
          <button
            type="button"
            onClick={() => setTagType('situation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tagType === 'situation'
                ? 'bg-white dark:bg-zinc-800 text-amber-700 dark:text-amber-300 shadow-xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            상황/반응 (#15분컷)
          </button>
          <button
            type="button"
            onClick={() => setTagType('ingredient')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tagType === 'ingredient'
                ? 'bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            메인 식재료 (#돼지고기)
          </button>
        </div>

        {/* 태그 입력 상자 */}
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-semibold select-none">#</span>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                tagType === 'situation'
                  ? '상황 태그 입력 (예: 남편최애, 15분컷)'
                  : '메인 식재료 입력 (예: 돼지고기, 두부)'
              }
              className="w-full pl-6.5 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm transition-all"
            />
          </div>
          <button
            type="button"
            onClick={addTag}
            className="px-3.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* 추가된 태그 배지 목록 */}
      <div className="flex flex-wrap gap-1.5">
        {tags.length === 0 ? (
          <span className="text-zinc-400 dark:text-zinc-600 text-xs italic">추가된 태그가 없습니다.</span>
        ) : (
          tags.map((tag, index) => {
            const isSituation = tag.type === 'situation';
            return (
              <span
                key={index}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  isSituation
                    ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-900/30'
                    : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-900/30'
                }`}
              >
                #{tag.name}
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className={`p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${
                    isSituation
                      ? 'text-amber-500 dark:text-amber-400 hover:text-amber-700'
                      : 'text-emerald-500 dark:text-emerald-400 hover:text-emerald-700'
                  }`}
                  aria-label={`Remove tag ${tag.name}`}
                >
                  <X size={12} />
                </button>
              </span>
            );
          })
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, RefreshCw, UtensilsCrossed, Hash } from 'lucide-react';
import { Menu, Tag } from '@/lib/types';
import { getMenus, getTags } from '@/lib/api';
import MasonryGrid from '@/components/MasonryGrid';

export default function Home() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // 필터 및 검색 상태
  const [selectedTagId, setSelectedTagId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [debounceSearch, setDebounceSearch] = useState('');

  // 검색어 입력에 300ms 디바운스 적용
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebounceSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // 태그 목록 조회
  useEffect(() => {
    async function loadTags() {
      try {
        const fetchedTags = await getTags();
        setTags(fetchedTags);
      } catch (err) {
        console.error('태그 조회 실패:', err);
      }
    }
    loadTags();
  }, []);

  // 메뉴 리스트 조회 (태그 및 검색어 조건 변경 시 실행)
  useEffect(() => {
    async function loadMenus() {
      try {
        setLoading(true);
        const { data } = await getMenus({
          tagId: selectedTagId,
          searchQuery: debounceSearch.trim() ? debounceSearch.trim() : undefined,
        });
        setMenus(data);
      } catch (err) {
        console.error('메뉴 목록 조회 실패:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMenus();
  }, [selectedTagId, debounceSearch]);

  // 태그 종류별로 분류
  const situationTags = tags.filter((t) => t.type === 'situation');
  const ingredientTags = tags.filter((t) => t.type === 'ingredient');

  const handleResetFilters = () => {
    setSelectedTagId(undefined);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 pb-20">
      
      {/* 프리미엄 히어로 배너 */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200/60 dark:border-zinc-800/40 sticky top-0 z-30 backdrop-blur-md bg-white/90 dark:bg-zinc-900/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-500/10">
              <UtensilsCrossed size={20} />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent">
                가족 식탁 아카이브
              </span>
              <span className="text-[10px] block font-bold text-amber-600 dark:text-amber-500 -mt-1 tracking-wider uppercase">
                Family Meal Archive
              </span>
            </div>
          </div>

          <Link
            href="/menu/new"
            className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-extrabold shadow-md shadow-orange-500/10 hover:shadow-lg transition-all transform active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>새 식탁 추가</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* 검색 및 필터 패널 */}
        <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200/50 dark:border-zinc-800/40 shadow-xs space-y-5">
          
          {/* 실시간 통합 검색바 */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="오늘 먹고 싶은 메뉴 이름 또는 메모 요소를 검색해 보세요..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm transition-all"
            />
          </div>

          {/* 분류별 태그 리스트 */}
          <div className="space-y-4">
            
            {/* 1. 상황/반응 태그 필터 */}
            {situationTags.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider min-w-[70px]">
                  상황/반응:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {situationTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => setSelectedTagId(selectedTagId === tag.id ? undefined : tag.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                        selectedTagId === tag.id
                          ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                          : 'bg-zinc-50 dark:bg-zinc-950 text-amber-700 dark:text-amber-400 border-zinc-200 dark:border-zinc-800 hover:bg-amber-50/50 dark:hover:bg-amber-950/10'
                      }`}
                    >
                      #{tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. 냉파 전용 메인 식재료 태그 필터 */}
            {ingredientTags.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider min-w-[70px]">
                  주재료(냉파):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ingredientTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => setSelectedTagId(selectedTagId === tag.id ? undefined : tag.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                        selectedTagId === tag.id
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                          : 'bg-zinc-50 dark:bg-zinc-950 text-emerald-700 dark:text-emerald-400 border-zinc-200 dark:border-zinc-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10'
                      }`}
                    >
                      #{tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 필터 활성화 상태 시 리셋 버튼 */}
            {(selectedTagId || searchQuery) && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400 transition-colors"
                >
                  <RefreshCw size={12} />
                  <span>필터 초기화</span>
                </button>
              </div>
            )}

          </div>
        </section>

        {/* 핀터레스트 스타일 Masonry Grid 갤러리 */}
        <section>
          {loading ? (
            <div className="w-full py-32 flex flex-col items-center justify-center gap-3">
              <RefreshCw size={28} className="animate-spin text-amber-500" />
              <span className="text-sm font-bold text-zinc-500">맛있는 식탁 아카이브 불러오는 중...</span>
            </div>
          ) : (
            <MasonryGrid menus={menus} />
          )}
        </section>

      </main>
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { Menu } from '@/lib/types';

interface MenuCardProps {
  menu: Menu;
}

export default function MenuCard({ menu }: MenuCardProps) {
  // 첫 번째 이미지를 썸네일로 사용
  const mainImage = menu.menu_images?.[0]?.image_url || null;

  return (
    <Link href={`/menu/${menu.id}`} className="block">
      <div className="group break-inside-avoid mb-6 flex flex-col bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200/50 dark:border-zinc-800/40 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
        
        {/* 썸네일 영역 */}
        <div className="relative w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950">
          {mainImage ? (
            <img
              src={mainImage}
              alt={menu.title}
              loading="lazy"
              className="w-full h-auto object-cover max-h-[360px] min-h-[160px] transition-transform duration-500 ease-out group-hover:scale-104"
            />
          ) : (
            <div className="w-full aspect-[4/3] flex items-center justify-center text-zinc-400 dark:text-zinc-600 text-xs italic">
              사진 없음
            </div>
          )}

          {/* 오버레이 효과 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
            <span className="text-white text-xs font-bold tracking-tight">상세 정보 보기 →</span>
          </div>
        </div>

        {/* 텍스트 내용 기술 */}
        <div className="p-4.5 space-y-2.5">
          <h3 className="font-extrabold text-zinc-900 dark:text-zinc-50 text-base leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
            {menu.title}
          </h3>

          {menu.memo && (
            <p className="text-zinc-500 dark:text-zinc-400 text-xs line-clamp-2 leading-relaxed">
              {menu.memo}
            </p>
          )}

          {/* 태그 목록 노출 */}
          {menu.tags && menu.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {menu.tags.map((tag) => {
                const isSituation = tag.type === 'situation';
                return (
                  <span
                    key={tag.id}
                    className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold border tracking-wider ${
                      isSituation
                        ? 'bg-amber-50/50 dark:bg-amber-950/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/20'
                        : 'bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/20'
                    }`}
                  >
                    #{tag.name}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

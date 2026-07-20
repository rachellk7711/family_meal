'use client';

import React from 'react';
import { Menu } from '@/lib/types';
import MenuCard from './MenuCard';

interface MasonryGridProps {
  menus: Menu[];
}

export default function MasonryGrid({ menus }: MasonryGridProps) {
  if (!menus || menus.length === 0) {
    return (
      <div className="w-full py-24 flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-4 text-zinc-400 dark:text-zinc-600">
          🍽️
        </div>
        <h4 className="text-zinc-800 dark:text-zinc-200 font-extrabold text-lg">기록된 식탁이 비어있습니다.</h4>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1 max-w-[280px] leading-relaxed">
          오늘 먹은 메뉴나 소개하고 싶은 레시피를 첫 번째 핀으로 추가해 보세요!
        </p>
      </div>
    );
  }

  return (
    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 w-full [column-fill:_balance]">
      {menus.map((menu) => (
        <MenuCard key={menu.id} menu={menu} />
      ))}
    </div>
  );
}

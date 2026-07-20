import React from 'react';
import { getMenuById } from '@/lib/api';
import { notFound } from 'next/navigation';
import MenuDetailClient from './MenuDetailClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MenuDetailPage({ params }: PageProps) {
  // Next.js App Router v15+ 대응을 위해 params를 비동기로 언랩합니다.
  const { id } = await params;
  const menu = await getMenuById(id);

  if (!menu) {
    notFound();
  }

  return <MenuDetailClient initialMenu={menu} />;
}

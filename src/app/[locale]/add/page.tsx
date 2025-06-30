'use client';

import { useTranslations } from 'next-intl';

export default function AddRecordPage() {
  const t = useTranslations('navigation');
  
  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold">{t('add')}</h1>
      <p className="text-gray-600 mt-2">功能开发中...</p>
    </main>
  );
}

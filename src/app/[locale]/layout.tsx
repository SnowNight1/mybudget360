import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Providers } from '@/components/providers';
import type { ReactNode } from 'react';
import Navbar from '@/components/navbar';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/config';

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: Props) {
  const { locale } = await params;
  
  // 验证语言参数
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // 获取当前语言的消息
  const messages = await getMessages({ locale });

  console.log('🌐 LocaleLayout rendering with locale:', locale, 'messages keys:', Object.keys(messages || {}));

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Providers>
        <Navbar />
        <main className='p-6'>{children}</main>
      </Providers>
    </NextIntlClientProvider>
  );
}

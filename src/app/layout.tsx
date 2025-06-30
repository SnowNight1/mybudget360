import './globals.css';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MyBudget360',
  description: 'Personal budget management application',
};

// 根布局，提供基本的 HTML 结构
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body className='min-h-screen bg-gray-50 text-gray-900' suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
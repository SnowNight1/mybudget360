import './globals.css';
import { Providers } from '@/components/providers';
import type { ReactNode } from 'react';
import Navbar from '@/components/navbar';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className='min-h-screen bg-gray-50 text-gray-900'>
        <Providers>
          <Navbar />
          <main className='p-6'>{children}</main>
          </Providers>
      </body>
    </html>
  );
}
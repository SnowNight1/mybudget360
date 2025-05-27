'use client';

import { useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 把跳转逻辑放到 useEffect，避免在 render 阶段更新 Router
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  // 登录状态还在加载时，不渲染任何东西（或者可以渲染一个加载动画）
  if (status === 'loading') {
    return null;
  }

  // 已登录后，UI 留空（redirect 会自动进行）
  if (session) {
    return null;
  }

  // 未登录时显示登录按钮
  return (
    <main className="flex min-h-screen items-center justify-center">
      <Button size="lg" onClick={() => signIn('google')}>
        Google でログイン
      </Button>
    </main>
  );
}

//src/app/auth/login/page.tsx
'use client';

import { useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const {  data : session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (status === 'authenticated' && session) {
      const callbackUrl = searchParams.get('callbackUrl');
      if (callbackUrl) {
        if (new URL(callbackUrl, window.location.origin).pathname === '/auth/login'){
          router.replace(callbackUrl);
          return;
        }
    }
    const preferredRedirect = session.user?.defaultRedirectPath || '/add';
    router.replace(preferredRedirect);
      }
  }, [status, router,session, searchParams]);

  if (status === 'loading' || status === 'authenticated') {
    // 如果正在加载或已认证，直接返回 null 或者可以显示一个加载状态
    return <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-500">正在加载...</p>
    </div>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 py-8">
      <div className='p-8 bg-white shadow-lg rounded-lg text-center'>
        <h1 className='text-2xl font-semibold mb-6 text-gray-700'>欢迎回来</h1>
        <Button
        size="lg"
        onClick={ () => {
          const callbackUrl = searchParams.get('callbackUrl');
          signIn('google', {
            callbackUrl: callbackUrl || undefined,
          })
        }}
        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
        >
          使用 Google 登录
        </Button>
        <p className='mt-4 text-gray-500'>
          通过 Google 登录以访问您的消费记录和设置。
        </p>
        <p className='mt-2 text-sm text-gray-400'>
          如果您没有 Google 账号，可以 <a href="https://accounts.google.com/signup" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">注册一个</a>。
        </p>
      </div>
    </main>
  );
}

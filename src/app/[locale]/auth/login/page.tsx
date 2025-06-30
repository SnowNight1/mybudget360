//src/app/[locale]/auth/login/page.tsx
'use client';

import { useEffect, Suspense } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuthTranslations, useCommonTranslations } from '@/hooks/useTranslations';
import { useLocale } from 'next-intl';

function LoginPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useAuthTranslations();
  const tCommon = useCommonTranslations();

  useEffect(() => {
    if (status === 'authenticated' && session) {
      const callbackUrl = searchParams.get('callbackUrl');
      if (callbackUrl) {
        // 如果有回调URL，直接使用它
        router.replace(callbackUrl);
        return;
      }
      
      // 获取用户偏好的重定向路径，如果没有则默认到 dashboard
      const preferredPath = session.user?.defaultRedirectPath || '/dashboard';
      
      // 确保路径包含语言前缀
      const redirectPath = preferredPath.startsWith('/') 
        ? `/${locale}${preferredPath}` 
        : `/${locale}/${preferredPath}`;
      
      router.replace(redirectPath);
    }
  }, [status, router, session, searchParams, locale]);

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">{tCommon('loading')}</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 py-8">
      <div className='p-8 bg-white shadow-lg rounded-lg text-center'>
        <h1 className='text-2xl font-semibold mb-6 text-gray-700'>{t('welcomeBack')}</h1>
        <Button
          size="lg"
          onClick={() => {
            const callbackUrl = searchParams.get('callbackUrl');
            signIn('google', {
              callbackUrl: callbackUrl || undefined,
            })
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
        >
          {t('loginWithGoogle')}
        </Button>
        <p className='mt-4 text-gray-500'>
          {t('loginDescription')}
        </p>
        <p className='mt-2 text-sm text-gray-400'>
          {t('noAccountText')}{' '}
          <a 
            href="https://accounts.google.com/signup" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-500 hover:underline"
          >
            {t('signUpLink')}
          </a>
          。
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}

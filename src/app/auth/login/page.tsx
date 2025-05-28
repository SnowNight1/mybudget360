'use client';

import { useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <Button size="lg" onClick={() => signIn('google')}>
        Google でログイン
      </Button>
    </main>
  );
}

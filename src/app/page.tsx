'use client';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  if (session) {
    router.replace('/dashboard');
    return null;
  }
  return (
    <main className="flex min-h-screen items-center justify-center">
      <Button size="lg" onClick={() => signIn('google')}>Google でログイン</Button>
    </main>
  );
}
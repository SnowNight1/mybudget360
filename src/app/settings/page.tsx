// src/app/settings/page.tsx
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SettingsClientPage from './SettingsClientPage';
import { prisma } from '@/lib/prisma';

async function getUserSettings(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { defaultRedirectPath: true },
  });
  return user;
}

export default async function SettingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    redirect('/login?callbackUrl=/settings');
  }

  const userSettings = await getUserSettings(session.user.id);

  return (
    <main className='min-h-screen bg-gray-50 py-8'>
      <SettingsClientPage currentDefaultRedirectPath={
        userSettings?.defaultRedirectPath || null
      }/>
    </main>
  )
}
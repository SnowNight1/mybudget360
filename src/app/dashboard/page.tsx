// app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // ❌ 错误写法会跳回自己，导致循环：
  // if (session) redirect('/dashboard');

  // ✅ 正确写法：若**未**登录，就跳回根路径 (登录页)
  if (!session) {
    redirect('/auth/login');
  }

  return (
    <main>
      {/* 这里渲染你的仪表盘内容 */}
      <h1>Welcome, {session.user?.name}</h1>
    </main>
  );
}

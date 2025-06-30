// src/app/subscriptions/page.tsx
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SubscriptionsClientPage from './SubscriptionsClientPage';

export default async function SubscriptionsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  // 获取用户的所有订阅
  const subscriptions = await prisma.subscription.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      category: true,
    },
    orderBy: [
      { isActive: 'desc' }, // 激活的订阅在前
      { createdAt: 'desc' }, // 按创建时间倒序
    ],
  });

  // 获取分类列表（用于创建新订阅）
  const categories = await prisma.category.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      color: true,
      parentId: true,
    },
    orderBy: { name: 'asc' },
  });

  return (
    <SubscriptionsClientPage
      initialSubscriptions={subscriptions}
      categories={categories}
    />
  );
}

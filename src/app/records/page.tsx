// src/app/records/page.tsx
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import RecordsClientPage from './RecordsClientPage';
import { ExpenseWithCategory } from '../dashboard/page'; // 确保此类型包含 category.name 和 category.color

async function getUserExpenses(userId: string): Promise<ExpenseWithCategory[]> {
  const expenses = await prisma.expense.findMany({
    where: { userId: userId },
    orderBy: {
      date: 'asc', // 从旧到新
    },
    include: {
      category: { // 包含关联的分类信息
        select: {
          name: true,
          color: true,
        },
      },
    },
  });
  // Prisma 返回的 category 可能为 null，如果 expense 没有关联 category
  // ExpenseWithCategory 类型应能处理 category?: { name: string; color: string | null }
  return expenses.map(exp => ({
    ...exp,
    // 如果 expense.category 为 null，确保它在 ExpenseWithCategory 中是可选的
    category: exp.category ? { id: exp.categoryId!, name: exp.category.name, color: exp.category.color || null, parentId: null } : undefined, // parentId 可能不需要在这里
  })) as ExpenseWithCategory[]; // 注意: 此处类型断言需要确保数据结构与 ExpenseWithCategory 匹配
}


export default async function RecordsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/records');
  }

  const expenses = await getUserExpenses(session.user.id);
  const userCurrency = session.user.currency || 'CNY'; // 从会话获取或默认

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <RecordsClientPage expenses={expenses} userCurrency={userCurrency} />
    </main>
  );
}
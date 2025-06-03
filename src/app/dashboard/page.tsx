// app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma'; // 确保你有正确的 Prisma Client 实例
import { CategoryBasic } from '@/types';
import DashboardClientPage from './DashboardClientPage';
import { Expense, Category } from '@prisma/client';

export type ExpenseWithCategory = Expense & {
  category: Pick<Category, 'name' | 'color' | 'parentId'> | null;
};

async function getCategories(userId: string): Promise<CategoryBasic[]> {
  try {
    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        color: true,
        parentId: true,
      },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      color: category.color,
      parentId: category.parentId,
    }));
  } catch (error) {
    console.error('获取分类失败:', error);
    return [];
  }
}

async function getExpenses(userId: string): Promise<ExpenseWithCategory[]> {
  try {
    const expenses = await prisma.expense.findMany({
      where: { userId },
      orderBy: { date: 'desc' }, // 按日期降序
      include: {
        category: {
          select: { name: true, color: true,},
        },
      },
    });
    return expenses as ExpenseWithCategory[];
  } catch (error) {
    console.error('获取消费记录失败:', error);
    return [];
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // ❌ 错误写法会跳回自己，导致循环：
  // if (session) redirect('/dashboard');

  // ✅ 正确写法：若**未**登录，就跳回根路径 (登录页)
  if (!session) {
    redirect('/auth/login');
  }

  const userId = session.user.id;
  const initialCategories = await getCategories(userId);
  const initialExpenses = await getExpenses(userId);

  return (
    <DashboardClientPage
      initialCategories={initialCategories}
      initialExpenses={initialExpenses} // 将来传递消费记录
      userName={session.user.name || '用户'}
      userCurrency={session.user.currency}
      userMonthlyBudget={session.user.monthlyBudget} // 从 session 获取
    />
  );
}

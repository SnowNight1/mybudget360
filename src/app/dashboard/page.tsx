// app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma'; // 确保你有正确的 Prisma Client 实例
import { CategoryBasic } from '@/types';
import DashboardClientPage from './DashboardClientPage';
import { Expense, Category, AmountInputType } from '@prisma/client';



export type ExpenseWithCategory = Omit<Expense, 'category'> & {
  // `Expense` 已经包含了 `note: string | null;`
  // `Expense` 也包含了 `date: Date;` 和 `amountInputType: AmountInputType;`
  // 所以我们只需要处理 `category` 的类型。
  category: CategoryBasic; // <--- 确保这里是 CategoryBasic，因为 category 是一个强制关系，不会是 null。
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

    return categories as CategoryBasic[];
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

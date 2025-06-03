// src/app/api/transactions/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateExpenseSchema } from '@/types';
import { AmountInputType, Prisma } from '@prisma/client';
import { parse } from 'path';
import { create } from 'domain';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  // session 类型现在应该包含 currency
  if (!session || !session.user || !session.user.id || !session.user.currency) {
    console.error("授权失败或 Session 中缺少用户信息:", session);
    return NextResponse.json({ message: '未授权或 Session 配置不完整' }, { status: 401 });
  }

  const userId = session.user.id;
  const userCurrency = session.user.currency; // 直接从 session 获取

  try {
    const body = await request.json();
    const validationResult = CreateExpenseSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: "输入数据无效", errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    let {
      amount,
      date,
      categoryId,
      note,
      isNextMonthPayment,
      isInstallment,
      installmentCount,
      amountInputType,
    } = validationResult.data;

    let finalAmount = amount;
    if (isInstallment && amountInputType === AmountInputType.PER_INSTALLMENT && installmentCount) {
      finalAmount = amount * installmentCount;
    }

    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId: userId },
    });

    if (!category) {
      return NextResponse.json(
        { message: '无效的分类或该分类不属于您' },
        { status: 400 }
      );
    }

    const newExpense = await prisma.expense.create({
      data: {
        amount: finalAmount,
        currency: userCurrency, // 使用从 session 获取的 currency
        date: new Date(date),
        note,
        userId,
        categoryId,
        isNextMonthPayment,
        isInstallment,
        installmentCount: isInstallment ? installmentCount : null,
        amountInputType: isInstallment ? amountInputType : AmountInputType.TOTAL,
      },
    });

    return NextResponse.json(newExpense, { status: 201 });

  } catch (error) {
    console.error('创建消费记录失败:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
         return NextResponse.json({ message: '提供的分类ID无效' }, { status: 400 });
      }
    }
    return NextResponse.json({ message: '创建消费记录失败，服务器内部错误' }, { status: 500 });
  }
}

// GET 方法保持不变或根据需要调整
export async function GET(request: Request) {
  // ... (之前的 GET 方法代码) ...
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: '未授权' }, { status: 401 });
  }
  const userId = session.user.id;

  const {searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'; // 默认降序

  try {
    const expenses = await prisma.expense.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        date: sortOrder, // 按日期和创建时间排序
      },
      include: { // 可选: 如果前端需要显示分类名称
        category: {
          select: { name: true, color: true }
        }
      },
    });
    return NextResponse.json(expenses);
  } catch (error) {
    console.error('获取消费记录列表失败:', error);
    return NextResponse.json({ message: '获取消费记录列表失败' }, { status: 500 });
  }
}
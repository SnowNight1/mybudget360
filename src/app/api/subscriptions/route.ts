// src/app/api/subscriptions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// 验证订阅创建数据的 schema
const createSubscriptionSchema = z.object({
  name: z.string().min(1, '订阅名称不能为空'),
  description: z.string().optional(),
  amount: z.number().positive('金额必须大于0'),
  categoryId: z.number().int().positive('请选择有效的分类'),
  billingDay: z.number().int().min(1).max(31, '账单日必须在1-31之间'),
  startDate: z.string().datetime('请提供有效的开始日期'),
  endDate: z.string().datetime('请提供有效的结束日期').optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // 数据验证
    const validationResult = createSubscriptionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: '数据验证失败', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      amount,
      categoryId,
      billingDay,
      startDate,
      endDate
    } = validationResult.data;

    // 验证分类是否属于当前用户
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId: session.user.id
      }
    });

    if (!category) {
      return NextResponse.json(
        { error: '分类不存在或无权限访问' },
        { status: 404 }
      );
    }

    // 创建订阅
    const subscription = await prisma.subscription.create({
      data: {
        name,
        description,
        amount,
        categoryId,
        billingDay,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        userId: session.user.id,
        currency: session.user.currency || 'CNY',
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          }
        }
      }
    });

    return NextResponse.json({
      message: '订阅创建成功',
      subscription
    });

  } catch (error) {
    console.error('创建订阅失败:', error);
    return NextResponse.json(
      { error: '创建订阅失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// 获取用户所有订阅
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          }
        },
        _count: {
          select: {
            expenses: true // 统计生成的支出记录数量
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ subscriptions });

  } catch (error) {
    console.error('获取订阅列表失败:', error);
    return NextResponse.json(
      { error: '获取订阅列表失败' },
      { status: 500 }
    );
  }
}
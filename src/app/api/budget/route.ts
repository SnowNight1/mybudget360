//src/app/api/budget/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UpdateBudgetSchema = z.object({
    monthlyBudget: z.number().min(0, "预算必须大于或等于 0").nullable(),
});

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
        console.error("授权失败或 Session 中缺少用户信息:", session);
        return NextResponse.json({ message: '未授权或 Session 配置不完整' }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        const body = await request.json();
        const validationResult = UpdateBudgetSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { message: "输入数据无效", errors: validationResult.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { monthlyBudget } = validationResult.data;

        // 更新用户的月预算
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { monthlyBudget: monthlyBudget },
            select: {
                id: true,
                monthlyBudget: true,
            }
        });

        return NextResponse.json(updatedUser, { status: 200 });
    } catch (error) {
        console.error('更新预算失败:', error);
        return NextResponse.json({ message: '更新预算失败' }, { status: 500 });
    }
}
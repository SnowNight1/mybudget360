// src/app/api/user/settings/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  defaultRedirectPath: z.enum(['/dashboard', '/records']).optional(),
  // 如果还有其他设置，也可以在这里添加
});

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权 (Unauthorized)' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = updateSettingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: '无效的输入 (Invalid input)', details: validation.error.format() }, { status: 400 });
    }

    const { defaultRedirectPath } = validation.data;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(defaultRedirectPath && { defaultRedirectPath }),
      },
      select: { // 只选择需要返回的字段，避免泄露敏感信息
        id: true,
        defaultRedirectPath: true,
      }
    });

    return NextResponse.json({ message: '设置已更新 (Settings updated)', user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error('更新用户设置失败 (Failed to update user settings):', error);
    return NextResponse.json({ error: '更新设置失败 (Failed to update settings)' }, { status: 500 });
  }
}
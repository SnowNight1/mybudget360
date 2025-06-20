// src/app/api/subscriptions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  const params = await segmentData.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const subscriptionId = parseInt(params.id);
    const body = await request.json();
    const { isActive } = body;

    // 验证订阅是否属于当前用户
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId: session.user.id,
      },
    });

    if (!existingSubscription) {
      return NextResponse.json(
        { error: '订阅不存在' },
        { status: 404 }
      );
    }

    // 更新订阅状态
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { isActive },
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error('更新订阅失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  const params = await segmentData.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const subscriptionId = parseInt(params.id);

    // 验证订阅是否属于当前用户
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId: session.user.id,
      },
    });

    if (!existingSubscription) {
      return NextResponse.json(
        { error: '订阅不存在' },
        { status: 404 }
      );
    }

    // 删除订阅（注意：这不会删除已生成的支出记录）
    await prisma.subscription.delete({
      where: { id: subscriptionId },
    });

    return NextResponse.json({
      success: true,
      message: '订阅已删除',
    });
  } catch (error) {
    console.error('删除订阅失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

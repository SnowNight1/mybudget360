// src/app/api/subscriptions/check-bills/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { checkAndGenerateSubscriptionBills } from '@/lib/subscriptionUtils';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await checkAndGenerateSubscriptionBills(session.user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('检查订阅账单失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

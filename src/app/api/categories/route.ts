// src/app/api/categories/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // 你的 NextAuth 配置
import { prisma } from '@/lib/prisma';    // 你的 Prisma Client 实例
import { Prisma } from '@prisma/client/edge';
// 如果你之前在 [...nextauth].ts 中扩展了 Session 类型，这里可以直接使用
// import type { Session } from 'next-auth'; // 如果需要显式引用扩展后的 Session

// 定义我们期望从 API 返回的 Category 类型
export interface CategoryData {
  id: number;
  name: string;
  color: string;
  parentId?: number | null;
}

export async function GET() {
  //console.log("[categories API] GET request received.");
  //console.log("[categories API] Attempting to get session...");
  const session = await getServerSession(authOptions);

  //console.log("[categories API] Session object received from getServerSession:", JSON.stringify(session, null, 2));
  // 类型守卫和空值检查
  if (!session || !session.user || !session.user.id) { // 确保 session, session.user 和 session.user.id 都存在
    console.error("[categories API] Authorization failed. Session or user.id missing. Session:", session);
    return NextResponse.json({ message: '未授权' }, { status: 401 });
  }

  try {
    const categories = await prisma.category.findMany({
      where: {
        userId: session.user.id, // 现在 TypeScript 应该知道 session.user.id 存在
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        color: true,
        parentId: true,
      },
    });
    //console.log("[categories API] Fetched categories:", categories);
    return NextResponse.json(categories);
  } catch (error) {
    console.error('获取分类失败:', error);
    return NextResponse.json({ message: '获取分类失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: '未授权' }, { status: 401 });
  }

 try {
    const body = await request.json();
    const { name, color, parentId } = body;

    if (!name || !color) {
      return NextResponse.json({ message: '名称和颜色是必需的' }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9]+$/.test(name)) {
      return NextResponse.json({ message: '名称只能包含字母和数字' }, { status: 400 });
    }

    if(!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return NextResponse.json({ message: '颜色必须是有效的十六进制颜色代码' }, { status: 400 });
    }

    const existingCategory = await prisma.category.findFirst({
      where: {
        name,
        userId: session.user.id,
        parentId: parentId || null,
      },})

    if (existingCategory) {
      return NextResponse.json({ message: '分类名称已存在' }, { status: 400 });
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        color,
        parentId: parentId || null,
        userId: session.user.id, // 确保将用户 ID 关联到新分类
      },
      select: {
        id: true,
        name: true,
        color: true,
        parentId: true,
        userId: true, // 确保返回 userId
        },
    });
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('创建分类失败:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {

        // 处理已知的 Prisma 错误
        if (error.code === 'P2002') {
            return NextResponse.json({ message: '分类名称已存在' }, { status: 400 });
        }
        }
    return NextResponse.json({ message: '创建分类失败' }, { status: 500 });
  }
}
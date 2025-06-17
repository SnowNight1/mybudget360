// app/api/categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// 正确的参数类型定义
interface RouteParams {
  params: {
    id: string;
  };
}

// 验证更新分类数据的 schema
const updateCategorySchema = z.object({
  name: z.string().min(1, '分类名称不能为空').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, '无效的颜色格式').optional(),
  parentId: z.union([
    z.number().int(),
    z.string().transform((val) => val === '' ? null : parseInt(val)),
    z.null()
  ]).optional(),
});

// GET 请求 - 获取单个分类
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const categoryId = parseInt(params.id);
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: '无效的分类ID' },
        { status: 400 }
      );
    }

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId: session.user.id
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        _count: {
          select: {
            expenses: true,
            // subscriptions: true  // 暂时注释掉，避免订阅模型未部署时出错
          }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { error: '分类不存在或无权限访问' },
        { status: 404 }
      );
    }

    return NextResponse.json({ category });

  } catch (error) {
    console.error('获取分类失败:', error);
    return NextResponse.json(
      { error: '获取分类失败' },
      { status: 500 }
    );
  }
}

// PUT 请求 - 更新分类
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const categoryId = parseInt(params.id);
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: '无效的分类ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // 数据验证
    const validationResult = updateCategorySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: '数据验证失败', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { name, color, parentId } = validationResult.data;

    // 验证分类是否存在且属于当前用户
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId: session.user.id
      }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: '分类不存在或无权限访问' },
        { status: 404 }
      );
    }

    // 如果设置了父分类，验证父分类的有效性
    if (parentId !== undefined && parentId !== null) {
      // 检查父分类是否存在且属于当前用户
      const parentCategory = await prisma.category.findFirst({
        where: {
          id: parentId,
          userId: session.user.id
        }
      });

      if (!parentCategory) {
        return NextResponse.json(
          { error: '父分类不存在或无权限访问' },
          { status: 400 }
        );
      }

      // 防止将分类设置为自己的子分类（避免循环引用）
      if (parentId === categoryId) {
        return NextResponse.json(
          { error: '分类不能将自身设置为父级分类' },
          { status: 400 }
        );
      }

      // 检查是否会造成循环引用
      const wouldCreateCycle = await checkForCycle(categoryId, parentId);
      if (wouldCreateCycle) {
        return NextResponse.json(
          { error: '设置此父分类会造成循环引用' },
          { status: 400 }
        );
      }
    }

    // 构建更新数据
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (parentId !== undefined) updateData.parentId = parentId;

    // 更新分类
    const updatedCategory = await prisma.category.update({
      where: {
        id: categoryId
      },
      data: updateData,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    return NextResponse.json({
      message: '分类更新成功',
      category: updatedCategory
    });

  } catch (error) {
    console.error('更新分类失败:', error);
    return NextResponse.json(
      { error: '更新分类失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// DELETE 请求 - 删除分类
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const categoryId = parseInt(params.id);
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: '无效的分类ID' },
        { status: 400 }
      );
    }

    // 验证分类是否存在且属于当前用户
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId: session.user.id
      },
      include: {
        _count: {
          select: {
            expenses: true,
            // subscriptions: true,  // 暂时注释掉，避免订阅模型未部署时出错
            children: true
          }
        }
      }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: '分类不存在或无权限访问' },
        { status: 404 }
      );
    }

    // 检查是否有关联的支出记录或订阅
    const hasExpenses = existingCategory._count.expenses > 0;
    // const hasSubscriptions = existingCategory._count.subscriptions > 0;  // 暂时注释掉
    const hasChildren = existingCategory._count.children > 0;

    if (hasExpenses || hasChildren) {  // 移除 hasSubscriptions 检查
      let errorMessage = '无法删除该分类，因为：';
      const reasons = [];
      
      if (hasExpenses) reasons.push(`存在 ${existingCategory._count.expenses} 条支出记录`);
      // if (hasSubscriptions) reasons.push(`存在 ${existingCategory._count.subscriptions} 个订阅`);  // 暂时注释掉
      if (hasChildren) reasons.push(`存在 ${existingCategory._count.children} 个子分类`);
      
      errorMessage += reasons.join('、');

      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    // 删除分类
    await prisma.category.delete({
      where: {
        id: categoryId
      }
    });

    return NextResponse.json({
      message: '分类删除成功'
    });

  } catch (error) {
    console.error('删除分类失败:', error);
    return NextResponse.json(
      { error: '删除分类失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// 辅助函数：检查是否会造成循环引用
async function checkForCycle(categoryId: number, parentId: number): Promise<boolean> {
  let currentParentId: number | null = parentId;
  const visitedIds = new Set<number>();
  
  while (currentParentId !== null) {
    if (visitedIds.has(currentParentId)) {
      // 检测到循环
      return true;
    }
    
    if (currentParentId === categoryId) {
      // 会造成循环引用
      return true;
    }
    
    visitedIds.add(currentParentId);
    
    try {
      // 获取当前父分类的父分类
      const parent: { parentId: number | null } | null = await prisma.category.findUnique({
        where: { id: currentParentId },
        select: { parentId: true }
      });
      
      if (!parent) {
        // 父分类不存在，停止检查
        break;
      }
      
      currentParentId = parent.parentId;
    } catch (error) {
      // 数据库查询失败，为安全起见返回true
      console.error('检查循环引用时数据库查询失败:', error);
      return true;
    }
  }
  
  return false;
}
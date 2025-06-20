import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateExpenseSchema } from "@/types";
import { AmountInputType, Prisma } from "@prisma/client";

export async function GET(request: Request, context: { params: { id: string } }) {
    const { params } = context;
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ message: '未授权或 Session 配置不完整' }, { status: 401 });
    }

    const expenseId = params.id;
    if (isNaN(Number(expenseId))) {
        return NextResponse.json({ message: '无效的消费记录 ID' }, { status: 400 });
    }

    try {
        const expense = await prisma.expense.findUnique({
            where: { 
                id: Number(expenseId),
                userId: session.user.id, 
            },
            include: {
                category: {
                    select: {id: true, name: true, color: true}
                }
            }
        });
        if (!expense) {
            return NextResponse.json({ message: '未找到该支出记录' }, { status: 404 });
        }
        return NextResponse.json(expense, { status: 200 });
    } catch (error) {
        console.error('获取支出记录失败:', error);
        return NextResponse.json({ message: '获取支出记录失败' }, { status: 500 });
        
    }
}

// PUT (Update) an expense by ID
export async function PUT(request: Request, context: { params: { id: string } }) {
  const { params } = context;
  const session = await getServerSession(authOptions);
  // 确保 session, user, id, currency 都存在
  if (!session || !session.user || !session.user.id || !session.user.currency) {
    return NextResponse.json({ message: '未授权或 Session 配置不完整' }, { status: 401 });
  }

  const userId = session.user.id;
  const userCurrency = session.user.currency; // 从 session 获取

  const expenseId = parseInt(params.id, 10);
  if (isNaN(expenseId)) {
    return NextResponse.json({ message: '无效的消费记录 ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    // 对于更新，所有字段都是可选的，但我们仍然使用 CreateExpenseSchema 进行验证
    // 如果你想让某些字段在更新时也是必需的，可以创建一个 UpdateExpenseSchema
    const validationResult = CreateExpenseSchema.safeParse(body); // 复用创建的 schema

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

    // 检查要更新的消费记录是否存在且属于该用户
    const existingExpense = await prisma.expense.findUnique({
      where: { id: expenseId, userId: userId },
    });

    if (!existingExpense) {
      return NextResponse.json({ message: '消费记录未找到或您无权修改' }, { status: 404 });
    }

    // 验证分类是否属于该用户 (如果分类ID被更改)
    if (categoryId !== existingExpense.categoryId) {
        const category = await prisma.category.findFirst({
            where: { id: categoryId, userId: userId },
        });
        if (!category) {
            return NextResponse.json(
            { message: '无效的新分类或该分类不属于您' },
            { status: 400 }
            );
        }
    }


    const updatedExpense = await prisma.expense.update({
      where: {
        id: expenseId,
        // userId: userId, // Prisma update where id is unique is enough, but extra check doesn't hurt
      },
      data: {
        amount: finalAmount,
        currency: userCurrency, // 通常货币不应在编辑时更改，但保持一致
        date: new Date(date),
        note,
        categoryId,
        isNextMonthPayment,
        isInstallment,
        installmentCount: isInstallment ? installmentCount : null,
        amountInputType: isInstallment ? amountInputType : AmountInputType.TOTAL,
        // userId 不会改变
      },
      include: { // 返回更新后的数据，包含分类信息
        category: {
          select: { id: true, name: true, color: true, parentId: true }
        }
      }
    });

    return NextResponse.json(updatedExpense);

  } catch (error) {
    console.error(`更新消费记录 ${expenseId} 失败:`, error);
     if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003' && error.meta?.field_name === 'categoryId') {
         return NextResponse.json({ message: '提供的新分类ID无效' }, { status: 400 });
      }
      if (error.code === 'P2025') { // Record to update not found
        return NextResponse.json({ message: '消费记录未找到或您无权修改' }, { status: 404 });
      }
    }
    return NextResponse.json({ message: '更新消费记录失败' }, { status: 500 });
  }
}

// DELETE an expense (可以顺便加上删除功能)
export async function DELETE(request: Request, context: { params: { id: string } }) {
    const { params } = context;
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: '未授权' }, { status: 401 });
    }

    const expenseId = parseInt(params.id, 10);
    if (isNaN(expenseId)) {
      return NextResponse.json({ message: '无效的消费记录 ID' }, { status: 400 });
    }

    try {
      // 确保用户拥有此记录才能删除
      const expense = await prisma.expense.findUnique({
        where: { id: expenseId, userId: session.user.id },
      });

      if (!expense) {
        return NextResponse.json({ message: '消费记录未找到或您无权删除' }, { status: 404 });
      }

      await prisma.expense.delete({
        where: {
          id: expenseId,
        },
      });
      return NextResponse.json({ message: '消费记录已删除' }, { status: 200 }); // 或者 204 No Content
    } catch (error) {
      console.error(`删除消费记录 ${expenseId} 失败:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return NextResponse.json({ message: '消费记录未找到' }, { status: 404 });
      }
      return NextResponse.json({ message: '删除消费记录失败' }, { status: 500 });
    }
}
// app/api/categories/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
PrismaClientKnownRequestError;

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PUT(request: Request, { params }: RouteParams) {
    const session = await getServerSession(authOptions);
    const categoryId = parseInt(params.id, 10);

    if (isNaN(categoryId)) {
        return NextResponse.json({ message: 'Invalid category ID' }, { status: 400 });
    }

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, color, parentId } = body;

        if (!name || !color) {
            return NextResponse.json({ message: 'Name and color are required' }, { status: 400 });
        }
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return NextResponse.json({ message: '名称不能为空' }, { status: 400 });
        }
        if (name.trim().length > 50) {
            return NextResponse.json({ message: '名称过长，最多50个字符' }, { status: 400 });
        }
        if (!color || !/^#[0-9A-F]{6}$/i.test(color)) {
            return NextResponse.json({ message: '无效的颜色格式，应为 #RRGGBB' }, { status: 400 });
        }
        if (parentId === categoryId) {
            return NextResponse.json({ message: 'Parent category cannot be the same as the current category' }, { status: 400 });
        }

        const categoryToUpdate = await prisma.category.findUnique({
            where: { id: categoryId },
        });

        if (!categoryToUpdate || categoryToUpdate.userId !== session.user.id) {
            return NextResponse.json({ message: 'Category not found or unauthorized' }, { status: 404 });
        }

        if (name !== categoryToUpdate.name || (parentId !== undefined && parentId !== categoryToUpdate.parentId)) {
            const existingCategory = await prisma.category.findFirst({
                where: {
                    name: name,
                    userId: session.user.id,
                    parentId: parentId !== undefined ? (parentId === null ? null : Number(parentId)) : categoryToUpdate.parentId,
                    NOT: {
                        id: categoryId, // 排除当前正在更新的分类
                    },
                },
            });
            if (existingCategory) {
                return NextResponse.json({ message: 'Category with this name already exists in the same parent category' }, { status: 409 });
            } }  


        const updatedCategory = await prisma.category.update({
            where: { id: categoryId },
            data: {
                name,
                color,
                parentId: parentId !== undefined ? (parentId === null ? null : Number(parentId)) : undefined,
            },
            select: {
                id: true,
                name: true,
                color: true,
                parentId: true,
            },
        });

        return NextResponse.json(updatedCategory);
    } catch (error) {
        console.error('更新分类${categoryId} 时出错:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return NextResponse.json({ message: 'Category with this name already exists' }, { status: 409 });
            }
            if (error.code === 'P2025') {
                return NextResponse.json({ message: 'Category not found or no right to edit' }, { status: 404 });
            }
        }
        return NextResponse.json({ message: '更新分类失败' }, { status: 500 });
  }
}


export async function DELETE(request: Request, { params }: RouteParams) {
    const session = await getServerSession(authOptions);
    const categoryId = parseInt(params.id, 10);

    if (isNaN(categoryId)) {
        return NextResponse.json({ message: 'Invalid category ID' }, { status: 400 });
    }
    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    try {
        const categoryToDelete = await prisma.category.findUnique({
            where: { id: categoryId },
            include: {
                children: { select: {id: true}, take: 1}, // 包括子分类
                expenses: { select: {id: true}, take: 1},
            },
        });

        if (!categoryToDelete || categoryToDelete.userId !== session.user.id) {
            return NextResponse.json({ message: 'Category not found or unauthorized' }, { status: 404 });
        }

        if (categoryToDelete.expenses.length > 0) {
            return NextResponse.json({ message: 'Cannot delete category with expenses' }, { status: 400 });
        }

        if (categoryToDelete.children.length > 0) {
            return NextResponse.json({ message: 'Cannot delete category with subcategories' }, { status: 400 });
        }

        if (categoryToDelete.expenses.length > 0) {
            return NextResponse.json({ message: 'Cannot delete category with expenses' }, { status: 400 });
        }
        await prisma.category.delete({
            where: { id: categoryId },
        });
        return NextResponse.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('删除分类ID${params.id} 时出错:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return NextResponse.json({ message: 'Category not found or no right to delete' }, { status: 404 });
            }
            if (error.code === 'P2003') {
                return NextResponse.json({ message: 'Cannot delete category with expenses' }, { status: 400 });
            }
        }
        return NextResponse.json({ message: '删除分类失败' }, { status: 500 });
    }
}
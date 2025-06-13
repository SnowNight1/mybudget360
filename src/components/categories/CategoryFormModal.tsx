// src/components/categories/CategoryFormModal.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { CategoryData } from '@/app/api/categories/route'; // 我们在 API 路由中定义的类型

// 假设你使用 shadcn/ui 组件，如果不是，请替换为相应的 HTML 元素或你使用的库的组件
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose, // 用于关闭按钮
} from '@/components/ui/dialog'; // 调整路径
import { Input } from '@/components/ui/input';   // 调整路径
import { Button } from '@/components/ui/button'; // 调整路径
import { Label } from '@/components/ui/label';   // 调整路径
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'; // 如果你使用了 Select 组件

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCategory: CategoryData) => void; // 修改 onSuccess 以接收新分类数据
  categoryToEdit?: CategoryData | null;
  allCategories?: CategoryData[];
}

export default function CategoryFormModal({
  isOpen,
  onClose,
  onSuccess,
  categoryToEdit,
  allCategories = [],
}: CategoryFormModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#000000'); // 默认颜色
  const [parentId, setParentId] = useState<string | undefined>(undefined); // 暂不实现父分类
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!categoryToEdit;

  // 当 categoryToEdit 变化时 (例如，打开编辑模态框)，填充表单
  useEffect(() => {
    if (isOpen) {
      if (isEditing && categoryToEdit) {
        setName(categoryToEdit.name);
        setColor(categoryToEdit.color);
        setParentId(categoryToEdit.parentId !== null && categoryToEdit.parentId !== undefined ? String(categoryToEdit.parentId) : undefined);
      } else {
        // 如果是添加模式，重置表单
        setName('');
        setColor('#000000');
        setParentId(undefined);
      }
      // 每次打开模态框时清除错误状态
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen, isEditing, categoryToEdit]); // 优化依赖数组，避免不必要的重渲染

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!name.trim()) {
      setError('分类名称是必填项。');
      setIsLoading(false);
      return;
    }
    
    // 检查分类名称重复（排除自身）
    const isDuplicateName = allCategories.some(cat => 
      cat.name.toLowerCase() === name.trim().toLowerCase() && 
      (!isEditing || cat.id !== categoryToEdit?.id)
    );
    
    if (isDuplicateName) {
      setError('此名称的分类已存在。');
      setIsLoading(false);
      return;
    }

    if (!/^#[0-9A-F]{6}$/i.test(color)) {
      setError('无效的颜色格式。请使用 #RRGGBB 格式。');
      setIsLoading(false);
      return;
    }

    if (isEditing && parentId && categoryToEdit) {
      const parentIdNum = Number(parentId);
      if (parentIdNum === categoryToEdit.id) {
        setError('分类不能将自身设置为父级分类。');
        setIsLoading(false);
        return;
      }
      // 更多循环依赖检查可以放在这里，如果需要的话
    }


    const payload: { name: string; color: string; parentId?: number | null } = {
      name: name.trim(),
      color,
    };

    if (parentId !== undefined && parentId !== '') {
      payload.parentId = parentId === '' ? null : Number(parentId);
    }

    const apiUrl = isEditing ? `/api/categories/${categoryToEdit?.id}` : '/api/categories';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(apiUrl, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP 错误! 状态: ${response.status}`);
      }

      const result: CategoryData = await response.json(); // 获取新创建或更新的分类数据
      // console.log(isEditing ? 'Category updated:' : 'Category created:', result);
      onSuccess(result); // 将新分类数据传递给 onSuccess 回调
      handleClose(); 
    } catch (err: any) {
      setError(err.message || (isEditing ? '分类更新失败。' : '分类创建失败。'));
      console.error(isEditing ? 'Error updating category:' : 'Error creating category:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理模态框关闭，确保状态重置
  const handleClose = () => {
    onClose();
    // 延迟一点重置表单，避免在关闭动画期间看到内容变化
    setTimeout(() => {
      if (!isEditing) { // 只在非编辑模式下完全重置，编辑模式由 useEffect 处理
        setName('');
        setColor('#000000');
      }
      setError(null);
      setIsLoading(false);
    }, 300); // 300ms 假设是模态框关闭动画的时间
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? '编辑分类' : '添加新分类'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? '更新分类的详细信息。'
              : '请输入新分类的名称和颜色。'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name-modal" className="text-right">
              名称
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              disabled={isLoading}
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="color-text-model" className="text-right">
              颜色
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="color-text-model"
                type="text" // 或者使用 type="color" 实现一个简单的颜色选择器，但样式可能不统一
                value={color}
                onChange={(e) => setColor(e.target.value.toUpperCase())} // 转为大写，符合 HEX 习惯
                className="w-28"
                pattern="^#[0-9A-F]{6}$" // HTML5 验证
                title="请输入 #RRGGBB 格式的颜色代码。"
                maxLength={7}
                disabled={isLoading}
                required
              />
              {/* 简易颜色预览 */}
              <Input
                id="color-picker-modal" // 确保 id 唯一
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value.toUpperCase())}
                className="h-8 w-8 p-0 border-none cursor-pointer"
                disabled={isLoading}
              />
            </div>
          </div>
          {
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="parent" className="text-right">
                父级分类
              </Label>
            <Select
              value={parentId} // string | undefined
              onValueChange={(value) => setParentId(value === "none" ? '' : value)} // 'none' 代表用户选择无父级
              disabled={isLoading}
            >
              <SelectTrigger id="parent-id-modal" className="col-span-3">
                <SelectValue placeholder="选择父级分类 (可选)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none"> {/* 代表没有父级，我们将其转为空字符串，再由 handleSubmit 转为 null */}
                  <em>(无 - 根分类)</em>
                </SelectItem>
                {allCategories
                  .filter(cat => !categoryToEdit || cat.id !== categoryToEdit.id) // 编辑时不能选自己作为父级
                  .map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            </div> 
          }

          {error && <p className="text-sm text-red-500 col-span-4 text-center">{error}</p>}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                取消
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (isEditing ? '更新中...' : '创建中...') : (isEditing ? '更新' : '创建')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
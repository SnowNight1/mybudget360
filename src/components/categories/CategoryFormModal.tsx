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
  onSuccess: () => void; // 当表单成功提交后调用
  categoryToEdit?: CategoryData | null; // 用于编辑功能，目前先不完全实现
  allCategories?: CategoryData[]; // 用于父级分类选择，暂时不实现
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
  }, [isEditing, categoryToEdit, isOpen]); // isOpen 也作为依赖，确保每次打开都可能重置/填充

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!name.trim()) {
      setError('カテゴリ名は必須です。 (Category name is required.)');
      setIsLoading(false);
      return;
    }

    // 简单的颜色格式验证 (例如 #RRGGBB)
    if (!/^#[0-9A-F]{6}$/i.test(color)) {
      setError('無効なカラーフォーマットです。#RRGGBB 形式で入力してください。 (Invalid color format. Use #RRGGBB.)');
      setIsLoading(false);
      return;
    }

    const payload: { name: string; color: string; parentId?: number | null } = {
      name: name.trim(),
      color,
    };

    if (parentId !== undefined && parentId !== '') {
      payload.parentId = parentId === '' ? null : Number(parentId); // 如果选择了父分类，转换为数字
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
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // const result: CategoryData = await response.json();
      // console.log(isEditing ? 'Category updated:' : 'Category created:', result);
      onSuccess(); // 通知父组件成功
      handleClose(); // 关闭模态框
    } catch (err: any) {
      setError(err.message || (isEditing ? 'カテゴリの更新に失敗しました。' : 'カテゴリの作成に失敗しました。'));
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
          <DialogTitle>{isEditing ? 'カテゴリを編集' : '新しいカテゴリを追加'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'カテゴリの詳細を更新します。'
              : '新しいカテゴリの名前と色を入力してください。'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name-modal" className="text-right">
              名前 (Name)
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
              色 (Color)
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="color-text-model"
                type="text" // 或者使用 type="color" 实现一个简单的颜色选择器，但样式可能不统一
                value={color}
                onChange={(e) => setColor(e.target.value.toUpperCase())} // 转为大写，符合 HEX 习惯
                className="w-28"
                pattern="^#[0-9A-F]{6}$" // HTML5 验证
                title="カラーコードを #RRGGBB 形式で入力してください。"
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
                親カテゴリ (Parent)
              </Label>
            <Select
              value={parentId} // string | undefined
              onValueChange={(value) => setParentId(value === "none" ? '' : value)} // 'none' 代表用户选择无父级
              disabled={isLoading}
            >
              <SelectTrigger id="parent-id-modal" className="col-span-3">
                <SelectValue placeholder="親カテゴリを選択 (任意)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none"> {/* 代表没有父级，我们将其转为空字符串，再由 handleSubmit 转为 null */}
                  <em>(なし - ルートカテゴリ)</em>
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
                キャンセル (Cancel)
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (isEditing ? '更新中...' : '作成中...') : (isEditing ? '更新 (Update)' : '作成 (Create)')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
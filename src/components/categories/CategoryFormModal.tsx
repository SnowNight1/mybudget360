// src/components/categories/CategoryFormModal.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { CategoryData } from '@/app/api/categories/route'; // 我们在 API 路由中定义的类型
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('categoryFormModal');
  const tCommon = useTranslations('common');
  const tForms = useTranslations('forms.validation');
  
  const [name, setName] = useState('');
  const [color, setColor] = useState('#000000'); // 默认颜色
  const [parentId, setParentId] = useState<string | undefined>(undefined); // Parent category not implemented yet
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!categoryToEdit;

  // When categoryToEdit changes (e.g., opening edit modal), populate the form
  useEffect(() => {
    if (isOpen) {
      if (isEditing && categoryToEdit) {
        setName(categoryToEdit.name);
        setColor(categoryToEdit.color);
        setParentId(categoryToEdit.parentId !== null && categoryToEdit.parentId !== undefined ? String(categoryToEdit.parentId) : undefined);
      } else {
        // If in add mode, reset the form
        setName('');
        setColor('#000000');
        setParentId(undefined);
      }
      // Clear error state each time the modal opens
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen, isEditing, categoryToEdit]); // 优化依赖数组，避免不必要的重渲染

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!name.trim()) {
      setError(tForms('required'));
      setIsLoading(false);
      return;
    }
    
    // 检查分类名称重复（排除自身）
    const isDuplicateName = allCategories.some(cat => 
      cat.name.toLowerCase() === name.trim().toLowerCase() && 
      (!isEditing || cat.id !== categoryToEdit?.id)
    );
    
    if (isDuplicateName) {
      setError(t('nameExists'));
      setIsLoading(false);
      return;
    }

    if (!/^#[0-9A-F]{6}$/i.test(color)) {
      setError(t('invalidColorFormat'));
      setIsLoading(false);
      return;
    }

    if (isEditing && parentId && categoryToEdit) {
      const parentIdNum = Number(parentId);
      if (parentIdNum === categoryToEdit.id) {
        setError(t('cannotSetSelfAsParent'));
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
        throw new Error(errorData.message || t('httpError', { status: response.status }));
      }

      const result: CategoryData = await response.json(); // 获取新创建或更新的分类数据
      // console.log(isEditing ? 'Category updated:' : 'Category created:', result);
      onSuccess(result); // 将新分类数据传递给 onSuccess 回调
      handleClose(); 
    } catch (err: any) {
      setError(err.message || (isEditing ? t('updateFailed') : t('createFailed')));
      console.error(isEditing ? 'Error updating category:' : 'Error creating category:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle modal close and ensure state reset
  const handleClose = () => {
    onClose();
    // Delay form reset slightly to avoid content changes during close animation
    setTimeout(() => {
      if (!isEditing) { // Only fully reset in non-edit mode, edit mode is handled by useEffect
        setName('');
        setColor('#000000');
      }
      setError(null);
      setIsLoading(false);
    }, 300); // 300ms assuming modal close animation duration
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('editTitle') : t('addTitle')}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? t('editDescription')
              : t('addDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name-modal" className="text-right">
              {t('name')}
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
              {t('color')}
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="color-text-model"
                type="text" // 或者使用 type="color" 实现一个简单的颜色选择器，但样式可能不统一
                value={color}
                onChange={(e) => setColor(e.target.value.toUpperCase())} // 转为大写，符合 HEX 习惯
                className="w-28"
                pattern="^#[0-9A-F]{6}$" // HTML5 验证
                title={t('colorFormatHint')}
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
                {t('parentCategory')}
              </Label>
            <Select
              value={parentId} // string | undefined
              onValueChange={(value) => setParentId(value === "none" ? '' : value)} // 'none' 代表用户选择无父级
              disabled={isLoading}
            >
              <SelectTrigger id="parent-id-modal" className="col-span-3">
                <SelectValue placeholder={t('selectParentPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none"> {/* Represents no parent, we'll convert this to empty string, then to null in handleSubmit */}
                  <em>{t('noParent')}</em>
                </SelectItem>
                {allCategories
                  .filter(cat => !categoryToEdit || cat.id !== categoryToEdit.id) // Can't select self as parent when editing
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
                {tCommon('cancel')}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (isEditing ? t('updating') : t('creating')) : (isEditing ? t('update') : t('create'))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
// src/components/TransactionForm.tsx
"use client";

import React, { useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateExpenseSchema, CreateExpenseInput, CategoryBasic } from '@/types';
import { CreateSubscriptionSchema, CreateSubscriptionInput, TransactionMode } from '@/types/subscription';
import { AmountInputType } from '@prisma/client';
import { ExpenseWithCategory } from '@/app/dashboard/page';
import CategoryFormModal from '@/components/categories/CategoryFormModal';
import { CategoryData } from '@/app/api/categories/route';
import ModeSelector from '@/components/ModeSelector';

interface TransactionFormProps {
  categories: CategoryBasic[];
  onClose: () => void;
  onSuccess: (newExpense: ExpenseWithCategory) => void;
  defaultValues?: Partial<CreateExpenseInput>;
  expenseId?: number;
  onCategoryAdded?: (newCategory: CategoryBasic) => void;
  defaultMode?: TransactionMode; // 新增：默认模式
}

// 联合表单数据类型
type FormData = CreateExpenseInput | CreateSubscriptionInput;

const TransactionForm: React.FC<TransactionFormProps> = ({
  categories,
  onClose,
  onSuccess,
  defaultValues: propDefaultValues,
  expenseId,
  onCategoryAdded,
  defaultMode = 'expense', // 新增：默认为普通支出
}) => {
  // 状态管理
  const [currentCategories, setCurrentCategories] = useState<CategoryBasic[]>(categories);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [transactionMode, setTransactionMode] = useState<TransactionMode>(defaultMode);

  // 为普通支出准备默认值
  const prepareExpenseDefaultValues = (
    initialValues?: Partial<CreateExpenseInput>
  ): CreateExpenseInput => {
    const parseDate = (dateInput: string | Date | undefined): Date => {
      if (dateInput instanceof Date && !isNaN(dateInput.getTime())) return dateInput;
      if (typeof dateInput === 'string') {
        const d = new Date(dateInput);
        if (!isNaN(d.getTime())) return d;
      }
      return new Date();
    };

    return {
      amount: initialValues?.amount !== undefined ? Number(initialValues.amount) : 0,
      date: parseDate(initialValues?.date),
      categoryId: initialValues?.categoryId !== undefined ? Number(initialValues.categoryId) : 0,
      note: initialValues?.note,
      isNextMonthPayment: initialValues?.isNextMonthPayment ?? false,
      isInstallment: initialValues?.isInstallment ?? false,
      installmentCount: initialValues?.installmentCount !== undefined ? Number(initialValues.installmentCount) : undefined,
      amountInputType: initialValues?.amountInputType ?? AmountInputType.TOTAL,
    };
  };

  // 为订阅准备默认值
  const prepareSubscriptionDefaultValues = (): CreateSubscriptionInput => {
    const today = new Date();
    return {
      name: '',
      description: '',
      amount: 0,
      categoryId: 0,
      billingDay: today.getDate(),
      startDate: today.toISOString().split('T')[0],
      endDate: '',
    };
  };

  // 普通支出表单
  const expenseForm = useForm<CreateExpenseInput>({
    resolver: zodResolver(CreateExpenseSchema),
    defaultValues: prepareExpenseDefaultValues(propDefaultValues),
  });

  // 订阅表单
  const subscriptionForm = useForm<CreateSubscriptionInput>({
    resolver: zodResolver(CreateSubscriptionSchema),
    defaultValues: prepareSubscriptionDefaultValues(),
  });

  // 获取当前活跃的表单
  const activeForm = transactionMode === 'expense' ? expenseForm : subscriptionForm;
  const { handleSubmit, formState: { errors, isSubmitting }, watch, control, register, setValue, reset } = activeForm;

  // 监听字段变化
  const isInstallment = transactionMode === 'expense' ? expenseForm.watch('isInstallment') : false;

  // 处理模式切换
  const handleModeChange = (mode: TransactionMode) => {
    setTransactionMode(mode);
  };

  // 处理表单提交
  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      if (transactionMode === 'expense') {
        // 提交普通支出
        const expenseData = data as CreateExpenseInput;
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(expenseData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '添加失败');
        }

        const result = await response.json();
        onSuccess(result.expense);
      } else {
        // 提交订阅
        const subscriptionData = data as CreateSubscriptionInput;
        const response = await fetch('/api/subscriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscriptionData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '创建订阅失败');
        }

        const result = await response.json();
        // 订阅创建成功，可以显示成功消息
        onClose();
      }
    } catch (error) {
      console.error('提交失败:', error);
      // 可以添加错误提示
    }
  };

  // 处理新分类添加成功
  const handleCategorySuccess = (newCategory: CategoryData) => {
    const newCategoryBasic: CategoryBasic = {
      id: newCategory.id,
      name: newCategory.name,
      color: newCategory.color,
      parentId: newCategory.parentId ?? null
    };
    
    setCurrentCategories(prev => [...prev, newCategoryBasic]);
    setIsCategoryModalOpen(false);
    
    // 自动选择新创建的分类
    if (transactionMode === 'expense') {
      expenseForm.setValue('categoryId', newCategory.id);
    } else {
      subscriptionForm.setValue('categoryId', newCategory.id);
    }
    
    if (onCategoryAdded) {
      onCategoryAdded(newCategoryBasic);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 标题 */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {transactionMode === 'expense' ? '添加支出' : '创建订阅'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* 模式选择器 */}
          <ModeSelector mode={transactionMode} onChange={handleModeChange} />

          {/* 表单 */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {transactionMode === 'expense' ? (
              // 普通支出表单
              <>
                {/* 金额 */}
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                    金额 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">¥</span>
                    <input
                      type="number"
                      id="amount"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      {...expenseForm.register('amount', { valueAsNumber: true })}
                    />
                  </div>
                  {expenseForm.formState.errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{expenseForm.formState.errors.amount.message}</p>
                  )}
                </div>

                {/* 分类 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
                      分类 <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      + 新建分类
                    </button>
                  </div>
                  <select
                    id="categoryId"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...expenseForm.register('categoryId', { valueAsNumber: true })}
                  >
                    <option value={0}>请选择分类</option>
                    {currentCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {expenseForm.formState.errors.categoryId && (
                    <p className="mt-1 text-sm text-red-600">{expenseForm.formState.errors.categoryId.message}</p>
                  )}
                </div>

                {/* 日期 */}
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    日期 <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="date"
                    control={expenseForm.control}
                    render={({ field }) => (
                      <input
                        type="date"
                        id="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    )}
                  />
                  {expenseForm.formState.errors.date && (
                    <p className="mt-1 text-sm text-red-600">{expenseForm.formState.errors.date.message}</p>
                  )}
                </div>

                {/* 备注 */}
                <div>
                  <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                    备注
                  </label>
                  <input
                    type="text"
                    id="note"
                    placeholder="添加备注..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...expenseForm.register('note')}
                  />
                </div>

                {/* 下月还款 */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isNextMonthPayment"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    {...expenseForm.register('isNextMonthPayment')}
                  />
                  <label htmlFor="isNextMonthPayment" className="text-sm text-gray-700">
                    下月还款
                  </label>
                </div>

                {/* 分期付款 */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isInstallment"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    {...expenseForm.register('isInstallment')}
                  />
                  <label htmlFor="isInstallment" className="text-sm text-gray-700">
                    分期付款
                  </label>
                </div>

                {/* 分期期数（仅在分期付款时显示） */}
                {isInstallment && (
                  <div>
                    <label htmlFor="installmentCount" className="block text-sm font-medium text-gray-700 mb-2">
                      分期期数
                    </label>
                    <input
                      type="number"
                      id="installmentCount"
                      min="1"
                      max="60"
                      placeholder="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      {...expenseForm.register('installmentCount', { valueAsNumber: true })}
                    />
                    {expenseForm.formState.errors.installmentCount && (
                      <p className="mt-1 text-sm text-red-600">{expenseForm.formState.errors.installmentCount.message}</p>
                    )}
                  </div>
                )}

                {/* 金额类型 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    金额类型
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="amountTotal"
                        value={AmountInputType.TOTAL}
                        className="text-blue-600 focus:ring-blue-500"
                        {...expenseForm.register('amountInputType')}
                      />
                      <label htmlFor="amountTotal" className="text-sm text-gray-700">
                        总金额
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="amountMonthly"
                        value={AmountInputType.PER_INSTALLMENT}
                        className="text-blue-600 focus:ring-blue-500"
                        {...expenseForm.register('amountInputType')}
                      />
                      <label htmlFor="amountMonthly" className="text-sm text-gray-700">
                        每期金额
                      </label>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // 订阅表单
              <>
                {/* 订阅名称 */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    订阅名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    placeholder="如: Netflix Premium"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...subscriptionForm.register('name')}
                  />
                  {subscriptionForm.formState.errors.name && (
                    <p className="mt-1 text-sm text-red-600">{subscriptionForm.formState.errors.name.message}</p>
                  )}
                </div>

                {/* 描述 */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    描述（可选）
                  </label>
                  <input
                    type="text"
                    id="description"
                    placeholder="订阅服务的详细描述"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...subscriptionForm.register('description')}
                  />
                </div>

                {/* 金额 */}
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                    每月金额 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">¥</span>
                    <input
                      type="number"
                      id="amount"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      {...subscriptionForm.register('amount', { valueAsNumber: true })}
                    />
                  </div>
                  {subscriptionForm.formState.errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{subscriptionForm.formState.errors.amount.message}</p>
                  )}
                </div>

                {/* 分类 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
                      分类 <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      + 新建分类
                    </button>
                  </div>
                  <select
                    id="categoryId"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...subscriptionForm.register('categoryId', { valueAsNumber: true })}
                  >
                    <option value={0}>请选择分类</option>
                    {currentCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {subscriptionForm.formState.errors.categoryId && (
                    <p className="mt-1 text-sm text-red-600">{subscriptionForm.formState.errors.categoryId.message}</p>
                  )}
                </div>

                {/* 账单日 */}
                <div>
                  <label htmlFor="billingDay" className="block text-sm font-medium text-gray-700 mb-2">
                    每月账单日 <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="billingDay"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...subscriptionForm.register('billingDay', { valueAsNumber: true })}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>
                        每月 {day} 号
                      </option>
                    ))}
                  </select>
                  {subscriptionForm.formState.errors.billingDay && (
                    <p className="mt-1 text-sm text-red-600">{subscriptionForm.formState.errors.billingDay.message}</p>
                  )}
                </div>

                {/* 开始日期 */}
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                    开始日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...subscriptionForm.register('startDate')}
                  />
                  {subscriptionForm.formState.errors.startDate && (
                    <p className="mt-1 text-sm text-red-600">{subscriptionForm.formState.errors.startDate.message}</p>
                  )}
                </div>

                {/* 结束日期 */}
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                    结束日期（可选）
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...subscriptionForm.register('endDate')}
                  />
                  <p className="mt-1 text-xs text-gray-500">留空表示长期订阅</p>
                </div>
              </>
            )}

            {/* 按钮 */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting 
                  ? '提交中...' 
                  : transactionMode === 'expense' 
                    ? '添加支出' 
                    : '创建订阅'
                }
              </button>
            </div>
          </form>

          {/* 分类创建模态框 */}
          {isCategoryModalOpen && (
            <CategoryFormModal
              isOpen={isCategoryModalOpen}
              onClose={() => setIsCategoryModalOpen(false)}
              onSuccess={handleCategorySuccess}
              allCategories={currentCategories as any[]}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;
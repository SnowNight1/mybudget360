// src/components/TransactionForm.tsx
"use client";

import React from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateExpenseSchema, CreateExpenseInput, CategoryBasic } from '@/types';
import { AmountInputType } from '@prisma/client';

interface TransactionFormProps {
  categories: CategoryBasic[];
  onClose: () => void;
  onSuccess: (newExpense: any) => void;
  defaultValues?: Partial<CreateExpenseInput>; // Props 传入的 defaultValues 可以是部分的
}

// 定义表单上下文类型（如果你的 resolver 使用它，通常是 any）
type MyFormContext = any;

// 准备 useForm 的 defaultValues 的辅助函数
// 返回类型是 CreateExpenseInput，现在它包含可选字段 (e.g., boolean | undefined)
const prepareFormDefaultValues = (
  initialValues?: Partial<CreateExpenseInput>
): CreateExpenseInput => {
  // robust date parsing helper
  const parseDate = (dateInput: string | Date | undefined): Date => {
    if (dateInput instanceof Date && !isNaN(dateInput.getTime())) return dateInput;
    if (typeof dateInput === 'string') {
      const d = new Date(dateInput);
      if (!isNaN(d.getTime())) return d;
    }
    // For HTML date input, it's better to have a string "YYYY-MM-DD" or a Date object.
    // Let's default to a Date object for RHF internal state.
    // RHF will format it for the input.
    return new Date();
  };

  // 为表单构建符合 CreateExpenseInput 类型的完整默认值对象
  const defaults: CreateExpenseInput = {
    // 对于 Zod schema 中 `z.coerce.type()` 的字段
    amount: initialValues?.amount !== undefined ? Number(initialValues.amount) : 0, // 假设初始为0，验证会处理
    date: parseDate(initialValues?.date), // coerce.date 会处理，这里确保是 Date 对象
    categoryId: initialValues?.categoryId !== undefined ? Number(initialValues.categoryId) : 0, // 假设初始为0

    // 对于 Zod schema 中 `.optional()` 的字段
    note: initialValues?.note, // string | undefined
    isNextMonthPayment: initialValues?.isNextMonthPayment ?? false, // 业务逻辑默认值 false
    isInstallment: initialValues?.isInstallment ?? false,         // 业务逻辑默认值 false
    installmentCount: initialValues?.installmentCount !== undefined ? Number(initialValues.installmentCount) : undefined, // number | undefined
    amountInputType: initialValues?.amountInputType ?? AmountInputType.TOTAL, // 业务逻辑默认值 TOTAL
  };
  return defaults;
};

const TransactionForm: React.FC<TransactionFormProps> = ({
  categories,
  onClose,
  onSuccess,
  defaultValues: propDefaultValues, // 重命名以避免混淆
}) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm<CreateExpenseInput, MyFormContext>({ // useForm 第一个泛型是字段值类型
    // ****** 主要修改在这里 ******
    resolver: zodResolver<CreateExpenseInput, MyFormContext, CreateExpenseInput>(CreateExpenseSchema),
    // ****** 修改结束 ******
    defaultValues: prepareFormDefaultValues(propDefaultValues),
  });

  // watch('isInstallment') 返回的将是 boolean | undefined
  // 在 JSX 中，通常 {isInstallment && ...} 这种用法，undefined 会被视为 false
  const isInstallment = watch('isInstallment');

  const onSubmit: SubmitHandler<CreateExpenseInput> = async (data) => {
    // data.isNextMonthPayment 和 data.isInstallment 在这里将是 boolean | undefined
    // 如果你在API请求中需要它们是明确的 boolean，你可能需要在这里转换：
    const apiData = {
      ...data,
      isNextMonthPayment: data.isNextMonthPayment ?? false,
      isInstallment: data.isInstallment ?? false,
      amountInputType: data.amountInputType ?? AmountInputType.TOTAL, // 确保枚举值
      // 如果API期望 installmentCount 在非分期时不存在，而不是 undefined
      // installmentCount: data.isInstallment ? data.installmentCount : undefined, (或者根据API调整)
    };

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData), // 发送处理过的 apiData
      });

      // ... (后续的响应处理逻辑不变)
      const responseData = await response.json();

      if (!response.ok) {
        console.error('API Error:', responseData);
        if (responseData.errors) {
          for (const field in responseData.errors) {
            if (Object.prototype.hasOwnProperty.call(responseData.errors, field)) {
              setError(field as keyof CreateExpenseInput, {
                type: 'server',
                message: responseData.errors[field].join(', '),
              });
            }
          }
        } else {
          setError("root.serverError", {
            type: "server",
            message: responseData.message || '保存失败，请稍后再试',
          });
        }
        return;
      }

      reset(); // 重置表单为 prepareFormDefaultValues 返回的初始值
      onSuccess(responseData);
    } catch (error) {
      console.error('提交表单失败:', error);
      setError("root.networkError", {
        type: "network",
        message: '提交表单失败，请检查网络连接。',
      });
    }
  };

  // ... (getCategoryDisplayName 和 sortedCategories 逻辑不变)
  const getCategoryDisplayName = (cat: CategoryBasic, allCats: CategoryBasic[]): string => {
    if (cat.parentId) {
      const parent = allCats.find(p => p.id === cat.parentId);
      return parent ? `${getCategoryDisplayName(parent, allCats)} > ${cat.name}` : cat.name;
    }
    return cat.name;
  };

  const sortedCategories = [...categories].sort((a,b) => {
    const nameA = getCategoryDisplayName(a, categories).toLowerCase();
    const nameB = getCategoryDisplayName(b, categories).toLowerCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 bg-white rounded-lg shadow-md">
      {/* 表单的 JSX 部分基本不需要改变，因为 react-hook-form 会处理好 checkbox 的 undefined 值 */}
      {/* 金额 */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          金额
        </label>
        <input
          id="amount"
          type="number"
          step="any"
          {...register('amount')}
          className={`mt-1 block w-full px-3 py-2 border ${errors.amount ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
        />
        {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
      </div>

      {/* 日期 */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
          日期
        </label>
        <input
          id="date"
          type="date"
          {...register('date')} // RHF v7+ 通常能很好地处理 Date 对象和 <input type="date">
          className={`mt-1 block w-full px-3 py-2 border ${errors.date ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
        />
        {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>}
      </div>

      {/* 分类 */}
      <div>
        <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
          分类
        </label>
        <select
          id="categoryId"
          {...register('categoryId')}
          className={`mt-1 block w-full px-3 py-2 border ${errors.categoryId ? 'border-red-500' : 'border-gray-300'} bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
        >
          <option value="">选择一个分类</option>
          {sortedCategories.map((cat) => (
            <option key={cat.id} value={cat.id} style={{ color: cat.color || 'inherit' }}>
              {getCategoryDisplayName(cat, categories)}
            </option>
          ))}
        </select>
        {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId.message}</p>}
      </div>

      {/* 备注 */}
      <div>
        <label htmlFor="note" className="block text-sm font-medium text-gray-700">
          备注 (可选)
        </label>
        <textarea
          id="note"
          rows={2}
          {...register('note')}
          className={`mt-1 block w-full px-3 py-2 border ${errors.note ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
        />
        {errors.note && <p className="mt-1 text-xs text-red-500">{errors.note.message}</p>}
      </div>

      {/* 其他布尔选项 */}
      <div className="space-y-2">
        <div className="flex items-center">
          <input
            id="isNextMonthPayment"
            type="checkbox"
            {...register('isNextMonthPayment')}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="isNextMonthPayment" className="ml-2 block text-sm text-gray-900">
            下个月支付
          </label>
        </div>
        {errors.isNextMonthPayment && <p className="mt-1 text-xs text-red-500">{errors.isNextMonthPayment.message}</p>}

        <div className="flex items-center">
          <input
            id="isInstallment"
            type="checkbox"
            {...register('isInstallment')}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="isInstallment" className="ml-2 block text-sm text-gray-900">
            是否分期
          </label>
        </div>
        {errors.isInstallment?.message && <p className="mt-1 text-xs text-red-500">{errors.isInstallment.message}</p>}


        {isInstallment && ( // isInstallment (来自 watch) 在这里是 boolean | undefined, undefined 会作为 false 处理
          <>
            <div className="mt-2">
              <label htmlFor="installmentCount" className="block text-sm font-medium text-gray-700">
                分期次数
              </label>
              <input
                id="installmentCount"
                type="number"
                min="2"
                {...register('installmentCount')}
                className={`mt-1 block w-full px-3 py-2 border ${errors.installmentCount ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              />
              {errors.installmentCount && (
                <p className="mt-1 text-xs text-red-500">{errors.installmentCount.message}</p>
              )}
            </div>
            <div className="mt-2">
              <label htmlFor="amountInputType" className="block text-sm font-medium text-gray-700">
                金额输入方式
              </label>
              <select
                id="amountInputType"
                {...register('amountInputType')} // amountInputType 现在是 AmountInputType | undefined
                                                // select 的 value 如果是 undefined 可能行为不确定，
                                                // 最好在 defaultValues 中给一个明确的初始值 (如已做的 TOTAL)
                className={`mt-1 block w-full px-3 py-2 border ${errors.amountInputType ? 'border-red-500' : 'border-gray-300'} bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              >
                {/* 如果 amountInputType 可能是 undefined，可以考虑加一个默认空选项，或者确保它总是有值 */}
                {/* <option value={undefined}>选择方式</option> */}
                <option value={AmountInputType.TOTAL}>总金额</option>
                <option value={AmountInputType.PER_INSTALLMENT}>每期金额</option>
              </select>
              {errors.amountInputType && (
                <p className="mt-1 text-xs text-red-500">{errors.amountInputType.message}</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* 显示 refine 抛出的全局错误或API返回的通用错误 */}
      {errors.root?.serverError && <p className="mt-2 text-sm text-red-600">{errors.root.serverError.message}</p>}
      {errors.root?.networkError && <p className="mt-2 text-sm text-red-600">{errors.root.networkError.message}</p>}
      {errors.root?.message && !errors.root.serverError && !errors.root.networkError && <p className="mt-1 text-xs text-red-500">{errors.root.message}</p>}


      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? '保存中...' : '保存消费'}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
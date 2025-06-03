// src/components/BudgetForm.tsx
"use client";

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSession } from 'next-auth/react';

// Zod schema now directly reflects the final data structure (number | null)
// We will use coerce for transformation from string input
const BudgetValidationSchema = z.object({
  monthlyBudget: z.preprocess(
    (val) => (val === "" ? null : val), // Handle empty string as null before coercing
    z.coerce.number({ invalid_type_error: "请输入有效的数字" }) // Coerce to number
      .min(0, "预算不能为负数")
      .nullable() // Allow null
  ),
});

// This is the type for your form data and onSubmit data
type BudgetFormData = z.infer<typeof BudgetValidationSchema>;


interface BudgetFormProps {
  currentBudget?: number | null;
  onClose: () => void;
  onSuccess: (newBudget: number | null) => void;
}

const BudgetForm: React.FC<BudgetFormProps> = ({ currentBudget, onClose, onSuccess }) => {
  const { data: session, update } = useSession();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormData>({ // Use BudgetFormData for useForm generic
    resolver: zodResolver(BudgetValidationSchema) as any,
    defaultValues: {
      // defaultValues should match BudgetFormData.
      // The input field will be string, but Zod's preprocess/coerce handles it.
      monthlyBudget: currentBudget ?? null,
    },
  });

  // onSubmit now expects BudgetFormData
  const onSubmit: SubmitHandler<BudgetFormData> = async (data) => {
    setApiError(null);
    try {
      const response = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyBudget: data.monthlyBudget }), // data.monthlyBudget is number | null
      });

      const responseData = await response.json();

      if (!response.ok) {
        setApiError(responseData.message || '更新预算失败');
        return;
      }

      await update({ monthlyBudget: data.monthlyBudget });
      onSuccess(data.monthlyBudget ?? null);

    } catch (error) {
      console.error('更新预算表单提交失败:', error);
      setApiError('网络错误，请稍后再试。');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
      <div>
        <label htmlFor="monthlyBudget" className="block text-sm font-medium text-gray-700">
          月度预算 ({session?.user?.currency || 'N/A'})
        </label>
        <input
          id="monthlyBudget"
          type="number" // Can use number again, Zod will coerce
          step="any"   // Allow decimals if needed, or remove for integers
          placeholder="例如: 50000 (留空则清除)"
          // For react-hook-form with Zod coercion, register directly.
          // The value will be string from input, Zod handles conversion.
          {...register('monthlyBudget')}
          defaultValue={currentBudget === null || currentBudget === undefined ? '' : String(currentBudget)} // HTML defaultValue
          className={`mt-1 block w-full px-3 py-2 border ${errors.monthlyBudget ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
        />
        {errors.monthlyBudget && (
          <p className="mt-1 text-xs text-red-500">{errors.monthlyBudget.message}</p>
        )}
      </div>

      {apiError && <p className="text-sm text-red-600">{apiError}</p>}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSubmitting ? '保存中...' : '保存预算'}
        </button>
      </div>
    </form>
  );
};

export default BudgetForm;
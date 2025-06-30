// src/components/SubscriptionFields.tsx
'use client';

import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { SubscriptionFormData } from '@/types/subscription';
import { useTranslations } from 'next-intl';

interface SubscriptionFieldsProps {
  register: UseFormRegister<SubscriptionFormData>;
  errors: FieldErrors<SubscriptionFormData>;
}

export default function SubscriptionFields({ register, errors }: SubscriptionFieldsProps) {
  const t = useTranslations('subscriptions');
  const tCommon = useTranslations('common');
  
  // 生成账单日选项 (1-31)
  const billingDayOptions = Array.from({ length: 31 }, (_, i) => i + 1);
  
  return (
    <div className="space-y-4">
      {/* 订阅名称 */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          {t('name')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          placeholder={t('namePlaceholder')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          {...register('name', { 
            required: t('name') + ' ' + tCommon('required'),
            minLength: { value: 1, message: t('name') + ' ' + tCommon('required') }
          })}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* 描述（可选） */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          {t('description')}（{tCommon('optional')}）
        </label>
        <input
          type="text"
          id="description"
          placeholder={t('descriptionPlaceholder')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          {...register('description')}
        />
      </div>

      {/* 每月账单日 */}
      <div>
        <label htmlFor="billingDay" className="block text-sm font-medium text-gray-700 mb-2">
          {t('billingDay')} <span className="text-red-500">*</span>
        </label>
        <select
          id="billingDay"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          {...register('billingDay', { 
            required: t('billingDay') + ' ' + tCommon('required'),
            valueAsNumber: true 
          })}
        >
          {billingDayOptions.map(day => (
            <option key={day} value={day}>
              {t('billingDayFormat', { day })}
            </option>
          ))}
        </select>
        {errors.billingDay && (
          <p className="mt-1 text-sm text-red-600">{errors.billingDay.message}</p>
        )}
      </div>

      {/* 开始日期 */}
      <div>
        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
          {t('startDate')} <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="startDate"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          {...register('startDate', { 
            required: t('startDate') + ' ' + tCommon('required')
          })}
        />
        {errors.startDate && (
          <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
        )}
      </div>

      {/* 结束日期（可选） */}
      <div>
        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
          {t('endDateOptional')}
        </label>
        <input
          type="date"
          id="endDate"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          {...register('endDate')}
        />
        <p className="mt-1 text-xs text-gray-500">
          {t('endDateHint')}
        </p>
      </div>
    </div>
  );
}

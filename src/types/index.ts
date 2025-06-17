// src/types/index.ts (或你的 schema 文件)
import { z } from 'zod';
import { AmountInputType } from '@prisma/client'; // 确保引入

export const CreateExpenseSchema = z.object({
  amount: z.coerce.number().positive({ message: "金额必须为正数" }),
  date: z.coerce.date({
    errorMap: (issue, { defaultError }) => ({
      message: issue.code === "invalid_date" ? "请输入有效日期" : defaultError,
    }),
  }),
  categoryId: z.coerce.number().int().positive({ message: "请选择一个分类" }),
  note: z.string().max(100, { message: "备注不能超过100个字符" }).nullable().optional(),

  // ****** 主要修改在这里 ******
  isNextMonthPayment: z.boolean().optional(), // 移除了 .default(false)
  isInstallment: z.boolean().optional(),      // 移除了 .default(false)
  // ****** 修改结束 ******

  installmentCount: z.coerce.number().int().min(2).optional(),

  // ****** amountInputType 也可能需要修改 ******
  // 如果之前是 .nativeEnum(AmountInputType).default(AmountInputType.TOTAL)
  // 现在改为：
  amountInputType: z.nativeEnum(AmountInputType).optional(), // 移除了 .default()
  // ****** 修改结束 ******

}).refine(data => {
    // refine 逻辑中可能需要处理这些字段是 undefined 的情况
    // 例如，如果 isInstallment 是 undefined，它在布尔上下文中会被视为 false
    if (data.isInstallment && (data.installmentCount === undefined || data.installmentCount < 2)) {
      return false;
    }
    if (data.amountInputType === AmountInputType.PER_INSTALLMENT && !data.isInstallment) {
      return false;
    }
    return true;
  }, {
    message: "分期设置不正确：若选择分期，分期次数需至少为2次；若按每期金额输入，必须选择分期。",
    path: ["isInstallment", "installmentCount", "amountInputType"],
  });

export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;
// 现在 CreateExpenseInput['isNextMonthPayment'] 的类型是 boolean | undefined
// CreateExpenseInput['isInstallment'] 的类型是 boolean | undefined
// CreateExpenseInput['amountInputType'] 的类型是 AmountInputType | undefined

// 订阅相关类型定义
export const CreateSubscriptionSchema = z.object({
  name: z.string().min(1, { message: "订阅名称不能为空" }).max(50, { message: "订阅名称不能超过50个字符" }),
  description: z.string().max(200, { message: "描述不能超过200个字符" }).optional(),
  amount: z.coerce.number().positive({ message: "金额必须为正数" }),
  categoryId: z.coerce.number().int().positive({ message: "请选择一个分类" }),
  billingDay: z.coerce.number().int().min(1).max(31, { message: "账单日必须在1-31之间" }),
  startDate: z.coerce.date({
    errorMap: (issue, { defaultError }) => ({
      message: issue.code === "invalid_date" ? "请输入有效的开始日期" : defaultError,
    }),
  }),
  endDate: z.coerce.date({
    errorMap: (issue, { defaultError }) => ({
      message: issue.code === "invalid_date" ? "请输入有效的结束日期" : defaultError,
    }),
  }).optional(),
}).refine(data => {
  // 如果设置了结束日期，确保它在开始日期之后
  if (data.endDate && data.startDate >= data.endDate) {
    return false;
  }
  return true;
}, {
  message: "结束日期必须晚于开始日期",
  path: ["endDate"],
});

export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionSchema>;

// 订阅基本信息类型（用于组件间传递）
export type SubscriptionBasic = {
  id: number;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  billingDay: number;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  categoryId: number;
  category?: {
    id: number;
    name: string;
    color: string;
  };
};

// 表单模式类型
export type TransactionMode = 'expense' | 'subscription';

// ... (CategoryBasic 类型保持不变)
export type CategoryBasic = {
  id: number;
  name: string;
  color: string;
  parentId: number | null;
};
//src/types/subscription.ts
import { z } from 'zod';

export type TransactionMode = 'expense' | 'subscription';

export const CreateSubscriptionSchema = z.object({
    name: z.string().min(1, '请输入订阅名称'),
    description: z.string().optional(),
    amount: z.coerce.number().positive('金额必须大于0'),
    categoryId: z.coerce.number().positive('请选择分类'),
    billingDay: z.coerce.number().min(1, '账单日必须在1-31之间').max(31, '账单日必须在1-31之间'),
    startDate: z.string().min(1, '请选择开始日期'),
    endDate: z.string().optional(),
});

export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionSchema>;

export interface SubscriptionFormData extends CreateSubscriptionInput {
    currency: string;
}

export interface SubscriptionWithCategory {
    id: number;
    name: string;
    description: string | null;
    amount: number;
    currency: string;
    billingDay: number;
    startDate: Date;
    endDate: Date | null;
    userId: string;
    categoryId: number;
    isActive: boolean;
    category: {
        id: number;
        name: string;
        color: string | null;
        parentId: number | null;
    };
}
//src/types/subscription.ts

export type TransactionMode = 'expense' | 'subscription';

export type CreateSubscriptionInput = {
    name: string;
    description?: string;
    amount: number;
    categoryId: number;
    billingDay: number;
    startDate: string; // ISO date string
    endDate?: string;
};

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
        name: true;
        color: string | null;
        parentId: number | null;
    };
}
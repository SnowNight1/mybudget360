// src/app/records/RecordsClientPage.tsx
"use client";

import Link from 'next/link';
import { ExpenseWithCategory } from '../dashboard/page';
import { Button } from '@/components/ui/button';

interface RecordsClientPageProps {
    expenses: ExpenseWithCategory[];
    userCurrency: string;
}


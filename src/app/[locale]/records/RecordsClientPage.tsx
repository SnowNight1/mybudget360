// src/app/records/RecordsClientPage.tsx
"use client";

import { useState, useEffect } from 'react';
import { ExpenseWithCategory } from '../dashboard/page'; // 确保此类型包含 category.name 和 category.color
import { Button } from '@/components/ui/button';
import { useRecordsTranslations, useCommonTranslations, useNavigationTranslations, useDashboardTranslations } from '@/hooks/useTranslations';
import TransactionForm from '@/components/TransactionForm';
import { CategoryBasic, CreateExpenseInput } from '@/types';

interface RecordsClientPageProps {
  expenses: ExpenseWithCategory[];
  userCurrency: string;
  initialCategories: CategoryBasic[];
}

const formatDate = (datestring: string | Date): string => {
  const date = new Date(datestring);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    // hour: '2-digit', // 如果需要显示时间
    // minute: '2-digit',
  });
};

export default function RecordsClientPage({ expenses: initialExpenses, userCurrency, initialCategories }: RecordsClientPageProps) {
  const t = useRecordsTranslations();
  const common = useCommonTranslations();
  const nav = useNavigationTranslations();
  const tDashboard = useDashboardTranslations();

  // 状态管理
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>(initialExpenses);
  const [categories, setCategories] = useState<CategoryBasic[]>(initialCategories);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [editingExpenseData, setEditingExpenseData] = useState<Partial<CreateExpenseInput> | null>(null);

  useEffect(() => {
    setExpenses(initialExpenses);
  }, [initialExpenses]);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  // 模态框处理函数
  const handleOpenModal = (expenseToEdit?: ExpenseWithCategory) => {
    if (expenseToEdit) {
      setEditingExpenseId(expenseToEdit.id);
      setEditingExpenseData({
        amount: expenseToEdit.amount,
        date: new Date(expenseToEdit.date),
        categoryId: expenseToEdit.categoryId,
        note: expenseToEdit.note,
        isNextMonthPayment: expenseToEdit.isNextMonthPayment,
        isInstallment: expenseToEdit.isInstallment,
        installmentCount: expenseToEdit.installmentCount || undefined,
        amountInputType: expenseToEdit.amountInputType,
      });
    } else {
      setEditingExpenseId(null);
      setEditingExpenseData(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpenseId(null);
    setEditingExpenseData(null);
  };

  const handleTransactionSuccess = (processedExpense: ExpenseWithCategory) => {
    if (editingExpenseId) {
      alert(tDashboard('messages.expenseUpdated', { description: processedExpense.note || processedExpense.amount }));
      setExpenses(prevExpenses =>
        prevExpenses.map(exp =>
          exp.id === processedExpense.id ? processedExpense : exp
        )
      );
    } else {
      alert(tDashboard('messages.expenseAdded', { description: processedExpense.note || processedExpense.amount }));
      setExpenses(prevExpenses => [processedExpense, ...prevExpenses]);
    }
    handleCloseModal();
  };

  const handleCategoryAdded = (newCategory: CategoryBasic) => {
    setCategories(prevCategories => [...prevCategories, newCategory]);
  };

  const handleDelete = async (expenseId: number, expenseDescription: string) => {
    if (!window.confirm(tDashboard('messages.deleteConfirm', { description: expenseDescription }))) {
      return;
    }

    try {
      const response = await fetch(`/api/transactions/${expenseId}`, { method: 'DELETE' });
      if (response.ok) {
        setExpenses(prevExpense => prevExpense.filter(exp => exp.id !== expenseId));
        alert(tDashboard('messages.deleteSuccess'));

        if (editingExpenseId === expenseId) {
          handleCloseModal();
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: tDashboard('messages.deleteFailed') }));
        alert(tDashboard('messages.deleteServerError', { message: errorData.message || '服务器返回错误，但未提供详细信息。' }));
      }
    } catch (error) {
      console.error('删除消费记录时发生网络错误：', error);
      alert(tDashboard('messages.networkError'));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6 pb-3 border-b">
        <h1 className="text-2xl font-semibold text-gray-900">{t('title')}</h1>
        <Button onClick={() => handleOpenModal()}>
          {tDashboard('addExpense')}
        </Button>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 text-lg">{t('noRecords')}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => handleOpenModal()}
          >
            {t('startFirstRecord')}
          </Button>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul role="list" className="divide-y divide-gray-200">
            {expenses.map((expense) => (
              <li key={expense.id}>
                <div className="block hover:bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: expense.category?.color || '#e5e7eb' }}
                      ></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {expense.category?.name || t('uncategorized')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {expense.note || t('noNote')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {expense.amount.toLocaleString(undefined, { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })} {userCurrency}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(expense.date)}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenModal(expense)}
                        >
                          {common('edit')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(expense.id, expense.note || expense.amount.toString())}
                          className="text-red-600 hover:text-red-700"
                        >
                          {common('delete')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 添加/编辑支出模态框 */}
      {isModalOpen && (
        <TransactionForm
          categories={categories}
          onClose={handleCloseModal}
          onSuccess={handleTransactionSuccess}
          onCategoryAdded={handleCategoryAdded}
          expenseId={editingExpenseId || undefined}
          defaultValues={editingExpenseData || undefined}
        />
      )}
      {/* 在这里可以添加分页逻辑 */}
    </div>
  );
}
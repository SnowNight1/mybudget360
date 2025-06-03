//src/app/dashboard/DashboardClientPage.tsx
"use client";

import {useState, useEffect, use } from 'react';
import TransactionForm from '@/components/TransactionForm';
import { CategoryBasic } from '@/types';
import { ExpenseWithCategory } from './page';
import { set } from 'zod';
// import BudgetCard from '@/components/BudgetCard';
// import Chart from '@/components/Chart';
// import { Expense } from '@prisma/client'; // 将来会用到 Expense 类型

interface DashboardClientPageProps {
  initialCategories: CategoryBasic[];
  initialExpenses: ExpenseWithCategory[]; // 将来传递消费记录
  userName: string;
  userCurrency: string;
  userMonthlyBudget?: number | null // 从 session 获取
}

const formatDate = (datestring: string | Date): string => {
  const date = new Date(datestring);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function DashboardClientPage({
    initialCategories,
    initialExpenses, // 将来传递消费记录
    userName,
    userCurrency,
    userMonthlyBudget
}: DashboardClientPageProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    // categories 和 expenses 的状态管理可以根据需要实现
    // 例如，添加新消费后，你可能想重新获取消费列表或在本地更新
    const [categories, setCategories] = useState<CategoryBasic[]>(initialCategories);
    const [expenses, setExpenses] = useState<ExpenseWithCategory[]>(initialExpenses);
    // 如果分类是动态变化的，并且你想在客户端保持最新，可以添加一个 refetch 逻辑
    // 但通常初始加载就够了，除非有添加/编辑分类的功能
    useEffect(() => {
    // 如果 initialCategories 可能在某些情况下为空，但用户实际有分类，
    // 可以在这里再次尝试获取，但这通常表明 SSR/SSG 数据获取有问题
    // 对于这个场景，我们假设 initialCategories 已经是正确的了
        setCategories(initialCategories);
    }, [initialCategories]);

    useEffect(() => {
      setExpenses(initialExpenses);
    }, [initialExpenses]);

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
    }

    const handleExpenseAdded = (newExpense: any) => {
        console.log('新消费记录已添加:', newExpense);
        alert(`消费 "${newExpense.note || newExpense.amount}" 已添加!`);
        // TODO: 更新消费列表
        // 1. Optimistic update: setExpenses(prev => [newExpense, ...prev]);
        // 2. Refetch: 调用一个函数来重新从 API 获取所有消费记录
        handleCloseModal();
    };

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto p-4">
        {/* ... (Header and Add Expense Button) ... */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              欢迎回来, {userName}!
            </h1>
            <p className="text-sm text-gray-600">你的默认货币是: {userCurrency}</p>
          </div>
          <button
            onClick={handleOpenModal}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            + 添加消费
          </button>
        </div>


        {/* Budget Overview Placeholder */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-medium text-gray-700">预算概览</h2>
          {userMonthlyBudget !== null && userMonthlyBudget !== undefined ? (
            <p className="text-gray-700">
            本月预算: <span className="font-semibold">{userMonthlyBudget.toLocaleString()} {userCurrency}</span>
            </p>
          ) : (
            <p className="text-gray-500">
            你还未设置月度预算。
            {/* <button onClick={openBudgetModal}>设置预算</button> */}
            </p>
          )}
        </div>
          {/* TODO: 计算并显示当月已支出和剩余预算 */}
        {/* Expenses List */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-700 mb-4">近期消费记录</h2>
          {expenses.length === 0 ? (
            <p className="text-gray-500">暂无消费记录。</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      日期
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      分类
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      备注
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      金额 ({userCurrency})
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        <span
                          className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                          style={{
                            backgroundColor: expense.category?.color ? `${expense.category.color}33` : '#E5E7EB', // Add alpha for background
                            color: expense.category?.color || '#374151'
                          }}
                        >
                          {expense.category?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">
                        {expense.note || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                        {expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      {/* 你可能还想添加编辑/删除按钮 */}
                      {/* <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href="#" className="text-indigo-600 hover:text-indigo-900 mr-2">编辑</a>
                        <button onClick={() => handleDelete(expense.id)} className="text-red-600 hover:text-red-900">删除</button>
                      </td> */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal for Transaction Form */}
        {isModalOpen && (
          // ... (Modal JSX from previous step) ...
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full my-8">
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-lg font-semibold">添加新消费</h2>
                <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 text-2xl leading-none p-1">×</button>
              </div>
              <TransactionForm
                categories={categories}
                onClose={handleCloseModal}
                onSuccess={handleExpenseAdded}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
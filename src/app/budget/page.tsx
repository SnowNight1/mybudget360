//src/app/budget/page.tsx
"use client"; // 因为我们要使用 useState, useSession 和事件处理

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import BudgetForm from '@/components/BudgetForm'; // 假设 BudgetForm.tsx 在 src/components/

export default function BudgetPage() {
  const { data: session, status } = useSession();
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  // 当预算成功更新后的回调
  const handleBudgetSuccess = (newBudget: number | null) => {
    console.log("预算已更新:", newBudget);
    // session?.user?.monthlyBudget 应该会通过 NextAuth 的 update() 自动更新
    // 你可以在这里添加一些用户提示，比如 toast notification
    setIsBudgetModalOpen(false); // 关闭模态框
    // 可选：如果页面上其他地方显示了预算，确保它会重新渲染以获取最新的 session 数据
  };

  if (status === "loading") {
    return <main className="p-4"><p>加载中...</p></main>;
  }

  if (!session) {
    // 或者重定向到登录页
    return <main className="p-4"><p>请先登录以管理预算。</p></main>;
  }

  // 从 session 中获取当前预算，注意它可能是 undefined, null, 或 number
  const currentBudget = session.user?.monthlyBudget;

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">予算管理</h1>
        <p className="text-gray-600">在这里设置和调整您的每月预算。</p>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">当前月度预算</h2>
        {currentBudget !== null && currentBudget !== undefined ? (
          <p className="text-2xl font-bold text-indigo-600">
            {currentBudget.toLocaleString()} {session.user?.currency}
          </p>
        ) : (
          <p className="text-gray-500">您尚未设置月度预算。</p>
        )}
        <button
          onClick={() => setIsBudgetModalOpen(true)}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {currentBudget !== null && currentBudget !== undefined ? '修改预算' : '设置预算'}
        </button>
      </div>

      {/* 其他预算相关信息或图表可以放在这里 */}
      {/* <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">预算使用情况</h2>
        <p className="text-gray-500">图表或进度条...</p>
      </div> */}


      {/* 预算设置模态框 */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-700">
                {currentBudget !== null && currentBudget !== undefined ? '修改月度预算' : '设置月度预算'}
              </h2>
              <button
                onClick={() => setIsBudgetModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1"
              >
                ×
              </button>
            </div>
            <BudgetForm
              currentBudget={currentBudget}
              onClose={() => setIsBudgetModalOpen(false)}
              onSuccess={handleBudgetSuccess}
            />
          </div>
        </div>
      )}
    </main>
  );
}
//src/app/dashboard/DashboardClientPage.tsx
"use client";

import {useState, useEffect, useMemo } from 'react';
import { subMonths, format, parseISO, addMonths, startOfMonth, set } from 'date-fns';
import { zhCN } from 'date-fns/locale'; // 用于中文月份标签
import TransactionForm from '@/components/TransactionForm';
import { CategoryBasic, CreateExpenseInput } from '@/types';
import { ExpenseWithCategory } from './page';
import MonthlySpendingLineChart from '@/components/MonthlySpendingLineChart';
import CategoryPieChart from '@/components/CategoryPieChart';
import { get } from 'http';
// --- 图表导入 (稍后实际图表组件会用到) ---
// import { Line, Pie } from 'react-chartjs-2';
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend,
//   ArcElement,
// } from 'chart.js';

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend,
//   ArcElement
// );
// --- 图表导入结束 ---
//import { set } from 'zod';
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

const formatDateForDisplay = (datestring: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const date = new Date(datestring);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

const getUniqueMonths = (expense: ExpenseWithCategory[]): string[] => {
  if (!expense || expense.length === 0) return [format(new Date(), 'yyyy-MM')]; // 如果没有消费记录，返回当前月份
  const mouths = new Set<string>();
  expense.forEach(expense => {
    const date = new Date(expense.date);
    mouths.add(format(startOfMonth(date), 'yyyy-MM')); // 使用 startOfMonth 确保日期是月初
  });
  return Array.from(mouths).sort((a,b) => b.localeCompare(a)); // 返回格式为 YYYY-MM 的字符串数组，按降序排列
};

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
    const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
    const [editingExpenseData, setEditingExpenseData] = useState<Partial<CreateExpenseInput> | null>(null);
    // 如果分类是动态变化的，并且你想在客户端保持最新，可以添加一个 refetch 逻辑
    // 但通常初始加载就够了，除非有添加/编辑分类的功能

    const availableMonthsForCharts = useMemo(() => getUniqueMonths(expenses), [expenses]);
    const [selectedMonthForCharts, setSelectedMonthForCharts] = useState<string>(() => {
      if (availableMonthsForCharts.length > 0) {
        return availableMonthsForCharts[0]; // 默认选择最新月份
      }
      return format(new Date(), 'yyyy-MM'); // 如果没有消费记录，返回当前月份
    });
    const [selectedCategoryForLineChart, setSelectedCategoryForLineChart] = useState<number | 'all'>('all');
    const [selectedParentCategoryForPieChart, setSelectedParentCategoryForPieChart] = useState<number | 'all'>('all');
    const [numberOfMonthsForLineChart, setNumberOfMonthsForLineChart] = useState<number>(12); // 默认显示12个月

    useEffect(() => {
      const currentMonths = getUniqueMonths(expenses);
      if (currentMonths.length > 0) {
        if (!selectedMonthForCharts || !currentMonths.includes(selectedMonthForCharts)) {
          setSelectedMonthForCharts(currentMonths[0]); // 如果当前选择的月份不在最新的月份列表中，选择最新月份
        }
      } else {
        const currentMonthStr = format(new Date(), 'yyyy-MM');
        if (selectedMonthForCharts !== currentMonthStr) {
          setSelectedMonthForCharts(currentMonthStr); // 如果没有消费记录，选择当前月份
        }
      }
    }, [expenses, selectedMonthForCharts]);

    useEffect(() => {
    // 如果 initialCategories 可能在某些情况下为空，但用户实际有分类，
    // 可以在这里再次尝试获取，但这通常表明 SSR/SSG 数据获取有问题
    // 对于这个场景，我们假设 initialCategories 已经是正确的了
        setCategories(initialCategories);
    }, [initialCategories]);

    useEffect(() => {
      setExpenses(initialExpenses);
    }, [initialExpenses]);

    const currentDate = new Date();
    const currentMonthForBudget = currentDate.getMonth();
    const currentYearForBudget = currentDate.getFullYear();

    const currentMonthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonthForBudget && expenseDate.getFullYear() === currentYearForBudget;
    });

    const totalSpentThisMonth = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    let remainingBudget: number | null = null;
    if (userMonthlyBudget !== null && userMonthlyBudget !== undefined) {
      remainingBudget = userMonthlyBudget - totalSpentThisMonth;
    }

    const handleOpenModal = (expenseToEdit?: ExpenseWithCategory) => {
        if (expenseToEdit) {
            setEditingExpenseId(expenseToEdit.id);
            // 确保 defaultValues 的 date 是 Date 对象，TransactionForm 的 prepareFormDefaultValues 会处理
            setEditingExpenseData;({
                ...expenseToEdit,
                date: new Date(expenseToEdit.date), // 确保日期是 Date 对象
                // categoryId 已经在 expenseToEdit 中
                // installmentCount 和 amountInputType 也是可选的
            });
            console.log("准备编辑消费记录:", expenseToEdit);
        } else {
            setEditingExpenseId(null);
            setEditingExpenseData(null);
            console.log("准备添加新消费记录");
        }
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingExpenseId(null); // 重置编辑 ID
        setEditingExpenseData(null); // 重置编辑数据
    }

    const handleTransactionSuccess = (processedExpense: ExpenseWithCategory) => {
        console.log('消费记录处理成功:', processedExpense);
        if (editingExpenseId) { // 如果是编辑模式
            alert(`消费 "${processedExpense.note || processedExpense.amount}" 已更新!`);
            setExpenses(prevExpenses =>
                prevExpenses.map(exp =>
                    exp.id === processedExpense.id ? processedExpense : exp
                )
            );
        } else { // 如果是添加模式
            alert(`消费 "${processedExpense.note || processedExpense.amount}" 已添加!`);
            // 新增的记录放在最前面
            setExpenses(prevExpenses => [processedExpense, ...prevExpenses]);
        }
        handleCloseModal(); // 无论是添加还是更新，都关闭模态框
    };

    // 处理新分类添加成功
    const handleCategoryAdded = (newCategory: CategoryBasic) => {
        setCategories(prevCategories => [...prevCategories, newCategory]);
    };

    const handleDelete = async (expenseId: number, expenseDescription: string) => {
      if (!window.confirm(`确定要删除这条消费记录 (${expenseDescription}) 吗？此操作无法撤销。`)) {
        return;
      }

      try {
        const response = await fetch(`api/transactions/${expenseId}`,{method:'DELETE'});
        if (response.ok) {
          setExpenses(prevExpense => prevExpense.filter(exp => exp.id !== expenseId));
          alert('消费记录已成功删除');

          if (editingExpenseId === expenseId) {
            handleCloseModal();
          }
        } else {
          const errorData = await response.json().catch(() => ({message:'删除失败，请稍后再试，服务器未返回有效错误信息'}));
          console.error('删除消费记录失败 API response:', errorData);
          alert(`删除失败: ${errorData.message || '服务器返回错误，但未提供详细信息。'}`);
        }
      } catch(error) {
        console.error('删除消费记录时发生网络错误：', error);
        alert('删除消费记录时发生网络错误，请检查你的链接')
      }
    };

  const topLevelCategories = useMemo(() => categories.filter(cat => !cat.parentId), [categories]);
  const allCategoriesForFilter = useMemo(() => {
    const getDisplayName = (cat: CategoryBasic, allCats: CategoryBasic[]): string => {
      if (cat.parentId) {
        const parent = allCats.find(p => p.id === cat.parentId);
        return parent ? `${getDisplayName(parent, allCats)} > ${cat.name}` : cat.name;
      }
      return cat.name;
    };
    return categories
    .map(c => ({...c, displayName: getDisplayName(c, categories) }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [categories]);

  const monthOptionsForSelect = useMemo(() => {
    if (availableMonthsForCharts.length === 0 || 
      (availableMonthsForCharts.length === 1 && !expenses.find(exp => format(startOfMonth(new Date(exp.date)), 'yyyy-MM')
      === availableMonthsForCharts[0]))) {
        const options = [];
      let month = new Date();
      for (let i = 0;  i < 12; i++) {
        options.push({
          value:format(month, 'yyyy-MM'),
          lable: format(month, 'yyyy年M月', { locale: zhCN })
        });
        month = subMonths(month, 1);
      }
      return options;
    }
    return availableMonthsForCharts.map(monthStr => ({
      value: monthStr,
      lable: format(parseISO(`${monthStr}-01`), 'yyyy年M月', { locale: zhCN})
    }));
  },[availableMonthsForCharts,expenses]);

  // 检查并生成订阅账单
    useEffect(() => {
      const checkSubscriptionBills = async () => {
        try {
          const response = await fetch('/api/subscriptions/check-bills', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const result = await response.json();
            if (result.generatedCount > 0) {
              console.log(`自动生成了 ${result.generatedCount} 个订阅账单`);
              // 刷新支出列表以包含新生成的账单
              await refreshExpenses();
            }
          }
        } catch (error) {
          console.error('检查订阅账单失败:', error);
        }
      };

      checkSubscriptionBills();
    }, []); // 只在组件挂载时执行一次

    // 刷新支出列表的函数
    const refreshExpenses = async () => {
      try {
        const response = await fetch('/api/transactions');
        if (response.ok) {
          const data = await response.json();
          setExpenses(data.expenses || []);
        }
      } catch (error) {
        console.error('刷新支出列表失败:', error);
      }
    };

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* ... (Header and Add Expense Button) ... */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              欢迎回来, {userName}!
            </h1>
            <p className="text-sm text-gray-600">你的默认货币是: {userCurrency}</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            添加消费
          </button>
        </div>


        {/* Budget Overview Placeholder */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-medium text-gray-700">预算概览</h2>
          {userMonthlyBudget !== null && userMonthlyBudget !== undefined ? (
            <div className='space-y-1'>
            <p className="text-gray-700">
            本月预算: <span className="font-semibold">{userMonthlyBudget.toLocaleString()} {userCurrency}</span>
            </p>
            <p className='text-gray-700'>
              本月已支出：
              <span className='font-semibold'
              style={{
                color: totalSpentThisMonth > userMonthlyBudget ? 'red' : (totalSpentThisMonth > userMonthlyBudget * 0.8 ? 'orange' : 'green')
              }}> 
              {totalSpentThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {userCurrency}
              </span>
            </p>
            <p className='text-gray-700'>
              剩余预算：
              <span className='font-semibold'
              style={{
                color: remainingBudget !== null && remainingBudget < 0 ? 'red' : (remainingBudget !== null && remainingBudget >= 0 ? '#10B981' : 'inherit')
              }}>
                {remainingBudget !== null ? remainingBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'} {userCurrency}
              </span>
            </p>
            </div>
          ) : (
            <p className="text-gray-500">
            你还未设置月度预算。
            {/* <button onClick={openBudgetModal}>设置预算</button> */}
            </p>
          )}
        </div>
        {/* --- START: Charts Section --- */}
        {expenses.length > 0 || monthOptionsForSelect.length>0 ? (
          <div className="bg-white p-6 rounded-lg shadow space-y-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">消费分析</h2>
            {/*全局图表控件：月份选择 */}
            <div className='mb-6 pb-4 border-b'>
              <label htmlFor='charMonthSelect' className='block text-sm font-medium text-gray-700 mb-1'>
                选择图标月份（将作为时间范围的结束月份）
              </label>
              <select
              id = 'charMonthSelect'
              value={selectedMonthForCharts}
              onChange={(e) => 
                setSelectedMonthForCharts(e.target.value)
              }
              className='block w-full sm:w-auto max-w-xs psx-3 py-1.5 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-xs'
              >
                {monthOptionsForSelect.map( opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.lable}
                  </option>
                ))}
              </select>
            </div>
            {selectedMonthForCharts && (
            <>
            {/* Line Chart Section */}
            {/* <div className="border-t pt-6"> */}
              <div className=" flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                <h3 className="text-lg font-medium text-gray-700">月度支出趋势</h3>
                <select
                    value={selectedCategoryForLineChart}
                    onChange={(e) => setSelectedCategoryForLineChart(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="mt-1 sm:mt-0 block w-full sm:w-auto max-w-xs px-3 py-1.5 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-xs"
                >
                    <option value="all">所有分类</option>
                    {allCategoriesForFilter.map(cat => ( // Use the new sorted list with display names
                        <option key={cat.id} value={cat.id}>{cat.displayName}</option>
                    ))}
                </select>
                <select
                value={numberOfMonthsForLineChart}
                onChange={(e) =>
                  setNumberOfMonthsForLineChart(Number(e.target.value))
                }
                className="block w-full sm:w-auto px-3 py-1.5 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-xs"
                >
                  <option value={3}>最近3个月</option>
                  <option value={6}>最近6个月</option>
                  <option value={12}>最近12个月</option>
                  <option value={24}>最近24个月</option>
                </select>
              </div>
              {/* Replace Placeholder with actual component */}
              <div className="h-[350px] w-full"> {/* Added container with height for responsiveness */}
                <MonthlySpendingLineChart
                    expenses={expenses}
                    selectedMonth={selectedMonthForCharts}
                    selectedCategoryId={selectedCategoryForLineChart}
                    categories={categories}
                    userCurrency={userCurrency}
                    numberOfMonthsToShow={numberOfMonthsForLineChart}
                />
              </div>
            {/* </div> */}

            {/* Pie Chart Section */}
            <div className="border-t pt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                    <h3 className="text-lg font-medium text-gray-700">分类支出占比
                      ({format(parseISO(`${selectedMonthForCharts}-01`),'yyyy年M月',{locale:zhCN})})
                    </h3>
                    <select
                        value={selectedParentCategoryForPieChart}
                        onChange={(e) => setSelectedParentCategoryForPieChart(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="mt-1 sm:mt-0 block w-full sm:w-auto max-w-xs px-3 py-1.5 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-xs"
                    >
                        <option value="all">所有一级分类</option>
                        {topLevelCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
                {/* Replace Placeholder with actual component */}
                <div className="h-[350px] w-full"> {/* Added container with height for responsiveness */}
                  <CategoryPieChart
                      expenses={expenses}
                      selectedMonth={selectedMonthForCharts}
                      selectedParentCategoryId={selectedParentCategoryForPieChart}
                      categories={categories}
                      userCurrency={userCurrency}
                  />
                </div>
            </div>
            </>
            )}
            {!selectedMonthForCharts && (
                 <p className="text-gray-500 italic text-center">请选择一个月份以查看图表分析。</p>
            )}
          </div>
        ) : (
             <p className="text-gray-500 italic text-center py-8">暂无消费数据，无法生成分析图表。</p>
        )}
        {/* --- END: Charts Section --- */}
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
                      <th
                      scope="col"
                      className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatDateForDisplay(expense.date)}
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
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleOpenModal(expense)} // 传入当前消费记录进行编辑
                          className="text-indigo-600 hover:text-indigo-900 mr-2"
                        >
                          编辑
                        </button>
                        <button onClick={() => handleDelete(expense.id,expense.note || `金额 ${expense.amount}`)}
                          className='text-red-600 hover:text-red-900'>
                            删除
                        </button>
                      </td>
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
                onSuccess={handleTransactionSuccess}
                onCategoryAdded={handleCategoryAdded}
                defaultValues={editingExpenseData || undefined} // 传入编辑数据，或 undefined 表示添加模式
                expenseId={editingExpenseId || undefined} // 传入消费记录 ID，或 undefined 表示添加模式
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
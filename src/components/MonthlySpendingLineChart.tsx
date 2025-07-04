// src/components/MonthlySpendingLineChart.tsx
"use client";

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip, // 工具提示
  Legend,  // 图例
  Filler,  // 填充
} from 'chart.js';
import { CategoryBasic } from '@/types'; // 根据需要调整路径
import { ExpenseWithCategory } from '@/app/[locale]/dashboard/page'; // 根据需要调整路径
import { subMonths, addMonths, format, getYear, getMonth, parseISO, startOfMonth, isWithinInterval, isEqual } from 'date-fns';
import { zhCN } from 'date-fns/locale'; // 用于中文月份标签
import { useTranslations } from 'next-intl';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MonthlySpendingLineChartProps {
  expenses: ExpenseWithCategory[];
  selectedMonth: string; // YYYY-MM 格式,这将是我们范围的结束月份
  selectedCategoryId: number | 'all';
  categories: CategoryBasic[];
  userCurrency: string;
  numberOfMonthsToShow?: number; // 新增属性 (Prop), 例如 12 代表过去12个月
}

const MonthlySpendingLineChart: React.FC<MonthlySpendingLineChartProps> = ({
  expenses,
  selectedMonth, // 例如: "2023-06"
  selectedCategoryId,
  categories,
  userCurrency,
  numberOfMonthsToShow = 12, // 默认显示12个月
}) => {
  const t = useTranslations('dashboard');
  // 1. Determine the date range for the chart
  // selectedMonth is the end point of our period.
  // Ensure selectedMonth is a valid date string for parsing (e.g., "YYYY-MM-01")
  const endMonthDate = startOfMonth(parseISO(`${selectedMonth}-01T00:00:00Z`)); // Use ISO format with Z for UTC to avoid timezone issues when only passing YYYY-MM to parseISO
  const startMonthDate = startOfMonth(subMonths(endMonthDate, numberOfMonthsToShow - 1));

  const chartPeriodLabel = `${format(startMonthDate, 'yyyy年M月', { locale: zhCN })} - ${format(endMonthDate, 'yyyy年M月', { locale: zhCN })}`;

  // 2. Generate month labels for X-axis within the determined range
  const monthLabels: string[] = [];
  const monthKeys: string[] = []; // For internal mapping, e.g., "2023-05"
  let currentMonthIterator = new Date(startMonthDate);

  for (let i = 0; i < numberOfMonthsToShow; i++) {
    monthLabels.push(format(currentMonthIterator, 'yyyy年M月', { locale: zhCN }));
    monthKeys.push(format(currentMonthIterator, 'yyyy-MM')); // Key for data aggregation
    currentMonthIterator = addMonths(currentMonthIterator, 1);
  }

  // 3. 筛选选定日期范围和类别的支出
  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date); // 假设 expense.date 是一个有效的日期字符串或 Date 对象
    const expenseMonthStart = startOfMonth(expenseDate);

    // 检查支出是否在整个图表周期内
    if (!isWithinInterval(expenseMonthStart, { start: startMonthDate, end: endMonthDate })) {
      return false;
    }

    // 分类筛选逻辑 (同之前)
    if (selectedCategoryId === 'all') return true;
    
    let currentCategoryToCheck: CategoryBasic | undefined = categories.find(c => c.id === expense.categoryId);
    let categoryMatch = false;
    while(currentCategoryToCheck) {
        if (currentCategoryToCheck.id === selectedCategoryId) {
            categoryMatch = true;
            break;
        }
        const parentId = currentCategoryToCheck.parentId;
        if(parentId !== null) {
            currentCategoryToCheck = categories.find(c => c.id === parentId);
        } else {
            currentCategoryToCheck = undefined;
        }
    }
    return categoryMatch;
  });

  // 4. Aggregate expenses by month for the generated monthKeys
  const monthlyTotalsMap = new Map<string, number>();
  monthKeys.forEach(key => monthlyTotalsMap.set(key, 0)); // Initialize all months in range to 0

  filteredExpenses.forEach(expense => {
    const expenseDate = new Date(expense.date);
    const expenseMonthKey = format(startOfMonth(expenseDate), 'yyyy-MM'); // "YYYY-MM"
    if (monthlyTotalsMap.has(expenseMonthKey)) {
      monthlyTotalsMap.set(expenseMonthKey, (monthlyTotalsMap.get(expenseMonthKey) || 0) + expense.amount);
    }
  });
  
  const monthlyTotalsData: number[] = monthKeys.map(key => monthlyTotalsMap.get(key) || 0);

  const selectedCategoryName = selectedCategoryId === 'all' 
    ? t('allCategories')
    : categories.find(c => c.id === selectedCategoryId)?.name || t('allCategories');

  // Highlight the data point corresponding to selectedMonth (i.e., endMonthDate)
  const pointRadii = monthKeys.map(key => {
    const monthDateFromKey = parseISO(`${key}-01T00:00:00Z`);
    return isEqual(startOfMonth(monthDateFromKey), endMonthDate) ? 6 : 3; // 最后一个月使用更大的半径
  });

  const pointBackgroundColors = monthKeys.map(key => {
    const monthDateFromKey = parseISO(`${key}-01T00:00:00Z`);
    return isEqual(startOfMonth(monthDateFromKey), endMonthDate) ? 'rgb(255, 99, 132)' : 'rgb(75, 192, 192)'; // 最后一个月使用不同颜色
  });


  const chartData = {
    labels: monthLabels, // 使用 "yyyy年M月" 格式的标签
    datasets: [
      {
        label: `${selectedCategoryName} - 每月总支出 (${userCurrency})`,
        data: monthlyTotalsData,
        fill: true,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        pointRadius: pointRadii, // 数据点半径
        pointBackgroundColor: pointBackgroundColors, // 数据点背景颜色
        pointHoverRadius: (context: any) => { // 使悬停半径更大
            // context.dataIndex 是数据点的索引
            const monthDateFromKey = parseISO(`${monthKeys[context.dataIndex]}-01T00:00:00Z`);
            return isEqual(startOfMonth(monthDateFromKey), endMonthDate) ? 8 : 6;
        },
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${chartPeriodLabel} 各月支出趋势`, // 更新图表标题
        font: {
            size: 16,
        }
      },
      tooltip: { // 工具提示 (Tooltip)
        callbacks: { // 回调函数 (Callbacks)
          title: function(tooltipItems: any) {
            // tooltipItems 是一个数组，取第一个
            if (tooltipItems.length > 0) {
              const item = tooltipItems[0];
              // item.label is already in 'yyyy年M月' format, from chartData.labels
              return item.label;
            }
            return '';
          },
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label = label.split(" - ")[0]; // Show only category name in tooltip line
              // context.label is already the complete year-month string
              // label += ` (${context.label})`; // No need to add month again
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('zh-CN', { style: 'currency', currency: userCurrency }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'category' as const, // X轴现在是基于类别的 (月份)
        title: {
          display: true,
          text: '月份',
        },
        grid: {
            display: false,
        }
      },
      y: {
        title: {
          display: true,
          text: `总金额 (${userCurrency})`,
        },
        beginAtZero: true,
        ticks: {
            callback: function(value: any) { // 刻度回调 (Ticks Callback)
                 return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: userCurrency, minimumFractionDigits:0 }).format(value);
            }
        }
      },
    },
  };
  
  const hasDataForPeriod = monthlyTotalsData.some(total => total > 0);

  if (!hasDataForPeriod) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px] text-gray-500">
        {chartPeriodLabel} 期间 {selectedCategoryName} 无支出数据
      </div>
    );
  }

  return <Line options={options} data={chartData} height={300} />;
};

export default MonthlySpendingLineChart;
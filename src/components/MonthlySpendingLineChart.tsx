// src/components/MonthlySpendingLineChart.tsx
"use client";

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, // Changed from TimeScale
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
// No longer need 'chartjs-adapter-date-fns' for this specific chart
import { CategoryBasic } from '@/types'; // Adjust path as needed
import { ExpenseWithCategory } from '@/app/dashboard/page'; // Adjust path as needed

ChartJS.register(
  CategoryScale, // Use CategoryScale for X-axis (months)
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
  selectedMonth: string; // YYYY-MM format, we'll primarily use the year part
  selectedCategoryId: number | 'all';
  categories: CategoryBasic[];
  userCurrency: string;
}

const MonthlySpendingLineChart: React.FC<MonthlySpendingLineChartProps> = ({
  expenses,
  selectedMonth, // e.g., "2023-06"
  selectedCategoryId,
  categories,
  userCurrency,
}) => {
  const yearOfSelectedMonth = parseInt(selectedMonth.split('-')[0], 10);

  // 1. Filter expenses for the selected year and category
  const yearlyExpensesForCategory = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const isInYear = expenseDate.getFullYear() === yearOfSelectedMonth;
    if (!isInYear) return false;

    if (selectedCategoryId === 'all') return true;
    
    // Category filtering logic (same as before)
    let currentCategoryToCheck: CategoryBasic | undefined = categories.find(c => c.id === expense.categoryId);
    let categoryMatch = false;
    while(currentCategoryToCheck) {
        if (currentCategoryToCheck.id === selectedCategoryId) {
            categoryMatch = true;
            break;
        }
        // Check parent category if it exists
        const parentId = currentCategoryToCheck.parentId;
        if(parentId !== null) { // If parent matches
            currentCategoryToCheck = categories.find(c => c.id === parentId);
        } else {
            currentCategoryToCheck = undefined;
        }
        
    }
    return categoryMatch;
  });

  // 2. Aggregate expenses by month for the selected year
  const monthlyTotals: number[] = Array(12).fill(0); // Initialize 12 months with 0

  yearlyExpensesForCategory.forEach(expense => {
    const expenseDate = new Date(expense.date);
    const monthIndex = expenseDate.getMonth(); // 0 for January, 11 for December
    monthlyTotals[monthIndex] += expense.amount;
  });
  
  const monthLabels = [
    "1月", "2月", "3月", "4月", "5月", "6月", 
    "7月", "8月", "9月", "10月", "11月", "12月"
  ];

  const selectedCategoryName = selectedCategoryId === 'all' 
    ? '所有分类' 
    : categories.find(c => c.id === selectedCategoryId)?.name || '选定分类';

  const chartData = {
    labels: monthLabels,
    datasets: [
      {
        label: `${selectedCategoryName} - 每月总支出 (${userCurrency})`,
        data: monthlyTotals,
        fill: true,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        pointRadius: 3,
        pointHoverRadius: 6,
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
        text: `${yearOfSelectedMonth}年 各月支出趋势`, // Updated title
        font: {
            size: 16,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label = label.split(" - ")[0]; // Show only category name in tooltip line
              label += ` (${context.label})`; // Add month
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
        type: 'category' as const, // X-axis is now category-based (months)
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
            callback: function(value: any) {
                 return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: userCurrency, minimumFractionDigits:0 }).format(value);
            }
        }
      },
    },
  };
  
  // Check if there's any data to display for the year
  const hasDataForYear = monthlyTotals.some(total => total > 0);

  if (!hasDataForYear) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px] text-gray-500">
        {yearOfSelectedMonth}年 {selectedCategoryName} 无支出数据
      </div>
    );
  }

  return <Line options={options} data={chartData} height={300} />;
};

export default MonthlySpendingLineChart;
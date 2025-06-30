// src/components/CategoryPieChart.tsx
"use client";

import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import {  CategoryBasic } from '@/types'; // Adjust path as needed
import { group } from 'console';
import { ExpenseWithCategory } from '@/app/[locale]/dashboard/page'; // Adjust path as needed
import { useTranslations } from 'next-intl';

ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface CategoryPieChartProps {
  expenses: ExpenseWithCategory[];
  selectedMonth: string; // YYYY-MM format
  selectedParentCategoryId: number | 'all';
  categories: CategoryBasic[];
  userCurrency: string;
}

// Helper function to generate random colors if category color is not available
const getRandomColor = () => {
  const r = Math.floor(Math.random() * 200);
  const g = Math.floor(Math.random() * 200);
  const b = Math.floor(Math.random() * 200);
  return `rgb(${r},${g},${b})`;
};

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  expenses,
  selectedMonth,
  selectedParentCategoryId,
  categories,
  userCurrency,
}) => {
  const t = useTranslations('charts');
  
  const [year, month] = selectedMonth.split('-').map(Number);

  // 1. Filter expenses for the selected month
  const monthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getFullYear() === year && expenseDate.getMonth() === month - 1;
  });

  // 2. Aggregate expenses by category based on selectedParentCategoryId
  const categorySpending: { [key: string]: { name: string; amount: number; color: string } } = {};
  
  let chartTitle = `${year}年${month}月`;

  monthExpenses.forEach(expense => {
    let categoryToDisplay: CategoryBasic | undefined = categories.find(c => c.id === expense.categoryId);
    if (!categoryToDisplay) return; // Skip if category not found for some reason

    let targetCategoryIdKey: number | string = 'unknown';
    let targetCategoryName: string = categoryToDisplay.name;
    let targetCategoryColor: string = categoryToDisplay.color || getRandomColor();

    if (selectedParentCategoryId === 'all') {
      // Aggregate by top-level category
      let topLevelParent = categoryToDisplay;
      while (topLevelParent.parentId && categories.find(c => c.id === topLevelParent.parentId)) {
        topLevelParent = categories.find(c => c.id === topLevelParent.parentId)!;
      }
      targetCategoryIdKey = topLevelParent.id;
      targetCategoryName = topLevelParent.name;
      targetCategoryColor = topLevelParent.color || getRandomColor();
      chartTitle += ` - ${t('topLevelCategories')}`;
    } else {
      // Aggregate by sub-categories of the selectedParentCategoryId
      // Only include direct children or the parent itself if it has no children being used
      if (categoryToDisplay.parentId === selectedParentCategoryId) {
        targetCategoryIdKey = categoryToDisplay.id;
        // name and color are already correct
      } else if (categoryToDisplay.id === selectedParentCategoryId) {
        // If an expense is directly assigned to the selected parent, show it
        targetCategoryIdKey = categoryToDisplay.id;
      } else {
        return; // This expense is not a direct sub-category of the selected parent
      }
      const parentCatName = categories.find(c => c.id === selectedParentCategoryId)?.name;
      chartTitle += ` - ${parentCatName || t('selectedCategory')} ${t('subcategorySpending')}`;
    }

    if (typeof targetCategoryIdKey === 'string' && selectedParentCategoryId !== 'all') return; // Skip if not matching sub-category criteria

    if (!categorySpending[targetCategoryIdKey]) {
      categorySpending[targetCategoryIdKey] = { name: targetCategoryName, amount: 0, color: targetCategoryColor };
    }
    categorySpending[targetCategoryIdKey].amount += expense.amount;
  });

  const uniqueChartTitle = Array.from(new Set(chartTitle.split(" - "))).join(" - "); // Avoid duplicate title parts

  const labels = Object.values(categorySpending).map(item => item.name);
  const dataPoints = Object.values(categorySpending).map(item => item.amount);
  const backgroundColors = Object.values(categorySpending).map(item => item.color);


  const chartData = {
    labels: labels,
    datasets: [
      {
        label: `支出 (${userCurrency})`,
        data: dataPoints,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color.replace('rgb', 'rgba').replace(')', ', 0.7)')), // Add some border
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const, // Position legend to the right for pie charts
        labels: {
            boxWidth: 20,
            padding: 15,
        }
      },
      title: {
        display: true,
        text: uniqueChartTitle,
        font: {
            size: 16,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((acc: number, val: number) => acc + val, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : 0;
            return `${label}: ${new Intl.NumberFormat('zh-CN', { style: 'currency', currency: userCurrency }).format(value)} (${percentage}%)`;
          }
        }
      }
    },
  };
  
  if (labels.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px] text-gray-500">
        此条件下无数据显示
      </div>
    );
  }

  return <Pie options={options} data={chartData} height={300} />; // Adjust height as needed
};

export default CategoryPieChart;
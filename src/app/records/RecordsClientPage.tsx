// src/app/records/RecordsClientPage.tsx
"use client";

import Link from 'next/link';
import { ExpenseWithCategory } from '../dashboard/page'; // 确保此类型包含 category.name 和 category.color
import { Button } from '@/components/ui/button';

interface RecordsClientPageProps {
  expenses: ExpenseWithCategory[];
  userCurrency: string;
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

export default function RecordsClientPage({ expenses, userCurrency }: RecordsClientPageProps) {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6 pb-3 border-b">
        <h1 className="text-2xl font-semibold text-gray-900">消费记录</h1>
        <Link href="/add">
          <Button>添加新消费</Button>
        </Link>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 text-lg">暂无消费记录。</p>
          <Link href="/add" className="mt-4 inline-block">
             <Button variant="outline">开始记录第一笔消费</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul role="list" className="divide-y divide-gray-200">
            {expenses.map((expense) => (
              <li key={expense.id}>
                <Link href={`/records/${expense.id}`} className="block hover:bg-gray-50"> {/* 将来可以有详情页 */}
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {expense.note || '无备注'}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${expense.category?.color ? '' : 'bg-gray-100 text-gray-800'}`}
                           style={expense.category?.color ? { backgroundColor: `${expense.category.color}33`, color: expense.category.color } : {}}
                        >
                          {expense.category?.name || '未分类'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {/* Heroicon name: solid/currency-dollar */}
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path d="M8.433 7.418c.158-.103.358-.196.583-.29c1.695-.678 3.631-.914 5.253-.971.470-.018.889.207.968.663.086.503-.329.906-.797.906h-.505c-.488 0-.994.056-1.47.165a9.408 9.408 0 00-1.941.842 6.913 6.913 0 00-1.482 1.36C6.72 11.04 6 12.347 6 13.955V14a1 1 0 002 0v-.045c0-.43.105-.85.308-1.224a6.89 6.89 0 011.138-1.341zM7.467 3.339c.355-.54.958-.84 1.6-.84h.967c.574 0 1.1.221 1.49.614.39.393.613.916.613 1.49v.967c0 .642-.3 1.245-.84 1.6a4.003 4.003 0 01-1.6.841h-.967a4.003 4.003 0 01-1.6-.841 4.003 4.003 0 01-.84-1.6V5.443c0-.574.222-1.1.613-1.49a4.01 4.01 0 011.49-.614z" />
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 7a1 1 0 011-1h8a1 1 0 011 1v2a1 1 0 01-1 1H6a1 1 0 01-1-1v-2zm3 5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H9a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                          </svg>
                          {expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {userCurrency}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        {/* Heroicon name: solid/calendar */}
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <p>
                          <time dateTime={new Date(expense.date).toISOString()}>{formatDate(expense.date)}</time>
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* 在这里可以添加分页逻辑 */}
    </div>
  );
}
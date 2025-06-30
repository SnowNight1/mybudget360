// src/app/subscriptions/SubscriptionsClientPage.tsx
'use client';

import React, { useState } from 'react';
import { SubscriptionWithCategory } from '@/types/subscription';
import { CategoryBasic } from '@/types';
import TransactionForm from '@/components/TransactionForm';
import { useTranslations } from 'next-intl';

interface SubscriptionsClientPageProps {
  initialSubscriptions: SubscriptionWithCategory[];
  categories: CategoryBasic[];
}

export default function SubscriptionsClientPage({
  initialSubscriptions,
  categories,
}: SubscriptionsClientPageProps) {
  const t = useTranslations('subscriptions');
  const tCommon = useTranslations('common');
  
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithCategory[]>(initialSubscriptions);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // 激活/停用订阅
  const toggleSubscriptionStatus = async (subscriptionId: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        const updatedSubscription = await response.json();
        setSubscriptions(prev =>
          prev.map(sub =>
            sub.id === subscriptionId
              ? { ...sub, isActive: !isActive }
              : sub
          )
        );
      }
    } catch (error) {
      console.error(t('updateStatusFailed'), error);
    }
  };

  // 删除订阅
  const deleteSubscription = async (subscriptionId: number) => {
    if (!confirm(t('deleteConfirm'))) {
      return;
    }

    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSubscriptions(prev => prev.filter(sub => sub.id !== subscriptionId));
      }
    } catch (error) {
      console.error(t('deleteFailed'), error);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN');
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${currency}${amount.toFixed(2)}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 页头 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600 mt-2">{t('description_page')}</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t('createSubscription')}
        </button>
      </div>

      {/* 订阅统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('activeSubscriptions')}</h3>
          <p className="text-3xl font-bold text-green-600">
            {subscriptions.filter(sub => sub.isActive).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('totalSubscriptions')}</h3>
          <p className="text-3xl font-bold text-blue-600">
            {subscriptions.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('monthlyTotal')}</h3>
          <p className="text-3xl font-bold text-purple-600">
            ¥{subscriptions
              .filter(sub => sub.isActive)
              .reduce((total, sub) => total + sub.amount, 0)
              .toFixed(2)}
          </p>
        </div>
      </div>

      {/* 订阅列表 */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{t('subscriptionList')}</h2>
        </div>
        
        {subscriptions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-lg mb-4">🔄</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noSubscriptions')}</h3>
            <p className="text-gray-600 mb-4">{t('noSubscriptionsDescription')}</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('createFirst')}
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {subscriptions.map((subscription) => (
              <div key={subscription.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {subscription.name}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          subscription.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {subscription.isActive ? t('status.active') : t('status.inactive')}
                      </span>
                    </div>
                    
                    {subscription.description && (
                      <p className="text-gray-600 mb-2">{subscription.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span>
                        {t('info.monthlyAmount', { amount: formatAmount(subscription.amount, subscription.currency) })}
                      </span>
                      <span>
                        {t('info.billingDay', { day: subscription.billingDay })}
                      </span>
                      <span>
                        {t('info.category', { category: subscription.category.name })}
                      </span>
                      <span>
                        {t('info.startDate', { date: formatDate(subscription.startDate) })}
                      </span>
                      {subscription.endDate && (
                        <span>
                          {t('info.endDate', { date: formatDate(subscription.endDate) })}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleSubscriptionStatus(subscription.id, subscription.isActive)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        subscription.isActive
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {subscription.isActive ? t('deactivate') : t('activate')}
                    </button>
                    <button
                      onClick={() => deleteSubscription(subscription.id)}
                      className="px-3 py-1 rounded text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
                    >
                      {tCommon('delete')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 创建订阅模态框 */}
      {isCreateModalOpen && (
        <TransactionForm
          categories={categories}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            // 刷新订阅列表
            window.location.reload();
          }}
          defaultMode="subscription"
        />
      )}
    </div>
  );
}

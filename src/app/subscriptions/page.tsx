import { redirect } from 'next/navigation';

export default function SubscriptionsPage() {
  // 这是中文版本的订阅页面，重定向到带 locale 的版本用于处理
  redirect('/zh/subscriptions');
}

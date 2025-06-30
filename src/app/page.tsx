// app/page.tsx
import { redirect } from 'next/navigation';

export default function RootPage() {
  // 使用 always 前缀策略，所有语言都显示前缀
  redirect('/zh/auth/login');
}

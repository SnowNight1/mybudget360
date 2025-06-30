import { getRequestConfig } from 'next-intl/server';

// 支持的语言列表 - 将默认语言放在第一位
export const locales = ['zh', 'en', 'ja'] as const;
export type Locale = (typeof locales)[number];

// 默认语言
export const defaultLocale: Locale = 'zh';

export default getRequestConfig(async ({ locale }) => {
  // 确保 locale 有效，如果没有则使用默认值
  const validLocale = locale && locales.includes(locale as any) ? locale : defaultLocale;
  
  return {
    locale: validLocale,
    messages: (await import(`../messages/${validLocale}.json`)).default
  };
});

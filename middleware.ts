import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './src/i18n/config';

export default createMiddleware({
  // 支持的语言列表
  locales,
  // 默认语言
  defaultLocale,
  // 路径前缀策略：always 表示所有语言都显示前缀，这样更一致
  localePrefix: 'always'
});

export const config = {
  // 匹配所有路径，除了 API 路由和静态文件
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};

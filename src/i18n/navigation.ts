import { createNavigation } from 'next-intl/navigation';

export const locales = ['en', 'zh', 'ja'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'zh';

export const { Link, redirect, usePathname, useRouter } =
  createNavigation({ locales });

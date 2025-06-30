'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales, type Locale } from '@/i18n/config';
import { useEffect, useState } from 'react';

export default function LanguageSelector() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  // 调试：打印初始状态
  useEffect(() => {
    console.log('🔍 LanguageSelector mounted:', {
      locale,
      pathname,
      locales,
      isClient: false,
      window_location: typeof window !== 'undefined' ? window.location.href : 'SSR'
    });
  }, []);

  useEffect(() => {
    setIsClient(true);
    console.log('🔍 LanguageSelector client ready:', {
      locale,
      pathname,
      isClient: true,
      window_location: typeof window !== 'undefined' ? window.location.href : 'SSR'
    });
  }, []);

  const handleLanguageChange = (newLocale: Locale) => {
    console.log('🚀 Language change started:', { 
      currentLocale: locale, 
      newLocale, 
      pathname,
      isCurrentLanguage: newLocale === locale
    });
    
    if (newLocale === locale) {
      // 如果选择的是当前语言，不需要切换
      console.log('⚠️ Same language selected, no change needed');
      return;
    }
    
    // 获取当前路径，去掉语言前缀
    let pathWithoutLocale = pathname;
    console.log('📍 Original pathname:', pathWithoutLocale);
    
    // 移除现有的语言前缀（包括中文的 /zh 前缀，因为可能存在）
    for (const loc of locales) {
      if (pathWithoutLocale.startsWith(`/${loc}`)) {
        pathWithoutLocale = pathWithoutLocale.substring(`/${loc}`.length) || '/';
        console.log(`🔧 Removed /${loc} prefix, new path:`, pathWithoutLocale);
        break;
      }
    }
    
    // 确保路径以 / 开头
    if (!pathWithoutLocale.startsWith('/')) {
      pathWithoutLocale = '/' + pathWithoutLocale;
      console.log('🔧 Added leading slash:', pathWithoutLocale);
    }
    
    // 构建新的路径 - 使用 'always' 策略，所有语言都需要前缀
    let newPath: string;
    newPath = `/${newLocale}${pathWithoutLocale}`;
    console.log(`🌍 ${newLocale} selected, added prefix:`, newPath);
    
    console.log('✅ Final navigation:', { 
      from: pathname,
      to: newPath,
      locale: newLocale
    });
    
    router.push(newPath);
  };

  const languageNames: Record<Locale, string> = {
    zh: '中文',
    en: 'English',
    ja: '日本語'
  };

  // 防止 hydration 错误，在客户端渲染前显示静态内容
  if (!isClient) {
    console.log('🔄 Rendering SSR placeholder for locale:', locale, languageNames[locale]);
    return (
      <div className="relative">
        <select 
          disabled
          className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent opacity-50"
        >
          <option>{languageNames[locale]}</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
          </svg>
        </div>
      </div>
    );
  }

  console.log('🎨 Rendering full selector:', {
    locale,
    selectedValue: locale,
    availableOptions: locales.map(loc => ({ value: loc, label: languageNames[loc] }))
  });

  return (
    <div className="relative">
      <select
        value={locale}
        onChange={(e) => {
          console.log('📝 Select onChange triggered:', {
            selectedValue: e.target.value,
            currentLocale: locale
          });
          handleLanguageChange(e.target.value as Locale);
        }}
        className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {languageNames[loc]}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
        </svg>
      </div>
    </div>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useNavigationTranslations, useAuthTranslations } from '@/hooks/useTranslations';
import LanguageSelector from './LanguageSelector';
import NoSSR from './NoSSR';
import { Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const t = useNavigationTranslations();
  const tAuth = useAuthTranslations();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const navItems = [
    { href: '/dashboard', label: t('dashboard') },
    { href: '/records', label: t('records') },
    { href: '/categories', label: t('categories') },
    { href: '/budget', label: t('budget') },
    { href: '/subscriptions', label: t('subscriptions') },
    { href: '/settings', label: t('settings') },
  ];

  // 检查当前路径是否匹配（考虑语言前缀）
  const isCurrentPath = (href: string) => {
    const currentPathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
    return currentPathWithoutLocale === href;
  };

  return (
    <header className="w-full p-4 shadow bg-white">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="text-xl font-bold">
          度支司
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-6 items-center">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'hover:text-blue-600 transition-colors',
                isCurrentPath(item.href) && 'text-blue-600 font-semibold underline'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="hidden md:flex gap-4 items-center">
          <LanguageSelector />
          <NoSSR fallback={<div className="w-20 h-8"></div>}>
            {status === 'authenticated' && session?.user ? (
              <>
                <Avatar>
                  <AvatarImage src={session.user.image ?? ''} alt={session.user.name ?? 'User'} />
                  <AvatarFallback>{session.user.name?.[0]}</AvatarFallback>
                </Avatar>
                <span>{session.user.name}</span>
                <Button variant="outline" onClick={() => signOut({ callbackUrl: `/${locale}/auth/login` })}>
                  {tAuth('logout')}
                </Button>
              </>
            ) : null}
          </NoSSR>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav Dropdown */}
      {open && (
        <nav className="flex flex-col md:hidden mt-2 gap-2 px-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-gray-600">Language:</span>
            <LanguageSelector />
          </div>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={clsx(
                'py-2 border-b',
                isCurrentPath(item.href) ? 'text-blue-600 font-semibold' : 'text-gray-700'
              )}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-2">
            <NoSSR fallback={<div className="w-full h-8"></div>}>
              {status === 'authenticated' && session?.user ? (
                <Button variant="outline" onClick={() => signOut({ callbackUrl: `/${locale}/auth/login`})} className="w-full">
                  {tAuth('logout')}
                </Button>
              ) : null}
            </NoSSR>
          </div>
        </nav>
      )}
    </header>
  );
}

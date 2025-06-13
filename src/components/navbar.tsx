'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/records', label: 'Records' },
  { href: '/charts', label: 'Charts' },
  { href: '/categories', label: 'Categories' },
  { href: '/budget', label: 'Budget' },
  { href: '/accounts', label: 'Accounts' },
  { href: '/settings', label: 'Settings' },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="w-full p-4 shadow bg-white">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="text-xl font-bold">
          MyBudget360
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-6 items-center">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'hover:text-blue-600 transition-colors',
                pathname === item.href && 'text-blue-600 font-semibold underline'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="hidden md:flex gap-4 items-center">
          {status === 'authenticated' && session?.user ? (
            <>
              <Avatar>
                <AvatarImage src={session.user.image ?? ''} alt={session.user.name ?? 'User'} />
                <AvatarFallback>{session.user.name?.[0]}</AvatarFallback>
              </Avatar>
              <span>{session.user.name}</span>
              <Button variant="outline" onClick={() => signOut()}>
                Logout
              </Button>
            </>
          ) : (
            <></>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav Dropdown */}
      {open && (
        <nav className="flex flex-col md:hidden mt-2 gap-2 px-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={clsx(
                'py-2 border-b',
                pathname === item.href ? 'text-blue-600 font-semibold' : 'text-gray-700'
              )}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-2">
            {status === 'authenticated' && session?.user ? (
              <Button variant="outline" onClick={() => signOut({ callbackUrl: '/auth/login'})} className="w-full">
                Logout
              </Button>
            ) : (
              <></>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

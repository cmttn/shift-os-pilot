'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ClubRecord } from '@/lib/dashboard/getClubData';

interface SidebarProps {
  club: ClubRecord;
}

const navItems = [
  { href: '/dashboard/club', label: 'Home', icon: '🏠' },
  { href: '/dashboard/club/teams', label: 'Teams', icon: '👥' },
  { href: '/dashboard/club/fixtures', label: 'Fixtures', icon: '📅' },
  { href: '/dashboard/club/tools', label: 'Tools', icon: '🧰' },
  { href: '/dashboard/club/settings', label: 'Settings', icon: '⚙️' }
];

export default function Sidebar({ club }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const initials = club.name.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed left-4 top-4 z-50 rounded-lg border border-gray-700 bg-gray-900 p-2 text-white md:hidden">☰</button>
      {open && <button onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/60 md:hidden" aria-label="Close menu" />}
      <aside className={`fixed left-0 top-0 z-50 flex h-screen w-full flex-col border-r border-gray-800 bg-gray-950 p-4 transition-transform md:w-[240px] md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setOpen(false)} className="ml-auto rounded-lg border border-gray-700 px-3 py-1 text-white md:hidden" aria-label="Close sidebar">✕</button>
        <div className="mb-8 flex items-center gap-3">
          {club.badge_url ? <img src={club.badge_url} alt={`${club.name} badge`} className="h-12 w-12 rounded-full border border-gray-700 bg-white object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800 text-lg font-bold text-white">{initials}</div>}
          <div>
            <p className="font-bold text-white">{club.name}</p>
            <span className="rounded-full border border-gray-700 px-2 py-0.5 text-xs uppercase text-gray-200">{club.plan_tier === 'pro' ? 'Pro' : 'Free'}</span>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition ${active ? 'border-transparent text-white' : 'border-transparent text-gray-300 hover:border-gray-700 hover:bg-gray-900 hover:text-white'}`} style={active ? { backgroundColor: `${club.primary_colour}33`, color: club.primary_colour } : undefined}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <button onClick={handleSignOut} className="w-full rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-200 hover:bg-gray-900">Sign out</button>
          <p className="mt-3 text-center text-xs text-gray-500">Powered by SHIFT/OS</p>
        </div>
      </aside>
    </>
  );
}

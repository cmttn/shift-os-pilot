'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ClubRecord } from '@/lib/dashboard/getClubData';

function getContrastText(hexColour: string): string {
  const r = parseInt(hexColour.slice(1, 3), 16);
  const g = parseInt(hexColour.slice(3, 5), 16);
  const b = parseInt(hexColour.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

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
  const initials = club.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const contrastText = getContrastText(club.primary_colour);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-lg p-2 text-white shadow-lg md:hidden"
        style={{ backgroundColor: club.primary_colour }}
        aria-label="Open sidebar"
      >
        ☰
      </button>
      {open && (
        <button
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 md:hidden"
          aria-label="Close menu overlay"
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col border-r border-gray-800 bg-gray-950 p-4 transition-transform md:w-[240px] md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded-lg border border-gray-700 px-3 py-1 text-white md:hidden"
          aria-label="Close sidebar"
        >
          ✕
        </button>
        <div className="mb-8 mt-8 flex items-center gap-3 md:mt-0">
          {club.badge_url ? (
            <img
              src={club.badge_url}
              alt={`${club.name} badge`}
              className="h-16 w-16 rounded-full border-2 border-white bg-white object-cover"
              style={{ boxShadow: `0 0 20px ${club.primary_colour}66` }}
            />
          ) : (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white text-xl font-bold"
              style={{ boxShadow: `0 0 20px ${club.primary_colour}66`, backgroundColor: club.primary_colour, color: contrastText }}
            >
              {initials}
            </div>
          )}
          <div>
            <p className="font-bold" style={{ color: club.primary_colour }}>
              {club.name}
            </p>
            <span
              className="rounded-full border px-2 py-0.5 text-xs uppercase"
              style={{ borderColor: club.primary_colour, color: club.primary_colour }}
            >
              {club.plan_tier === 'pro' ? 'Pro' : 'Free'}
            </span>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-r-lg border border-transparent px-3 py-2 text-sm transition hover:border-gray-700 hover:bg-gray-900"
                style={
                  active
                    ? { borderLeft: `3px solid ${club.primary_colour}`, backgroundColor: `${club.primary_colour}22`, color: club.primary_colour }
                    : { color: '#d1d5db' }
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <button onClick={handleSignOut} className="w-full rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-200 hover:bg-gray-900">
            Sign out
          </button>
          <p className="mt-3 text-center text-xs text-gray-500">Powered by SHIFT/OS</p>
        </div>
      </aside>
    </>
  );
}

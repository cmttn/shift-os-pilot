'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signOut } from '@/lib/auth/signOut';

type MobileHeaderRole = 'club' | 'coach' | 'player';

interface MobileRoleHeaderProps {
  role: MobileHeaderRole;
  title: string;
  subtitle?: string | null;
  badgeUrl?: string | null;
  initials: string;
  primaryColour: string;
}

interface HeaderNavItem {
  href: string;
  label: string;
  activePaths?: string[];
}

const roleNavItems: Record<MobileHeaderRole, HeaderNavItem[]> = {
  club: [
    { href: '/dashboard/club', label: 'Home' },
    { href: '/dashboard/club/notifications', label: 'Notifications' },
    { href: '/dashboard/club/fixtures', label: 'Schedule' },
    { href: '/dashboard/club/teams', label: 'Teams' },
    { href: '/dashboard/club/tickets', label: 'Tickets' },
    { href: '/dashboard/club/settings', label: 'Settings' }
  ],
  coach: [
    { href: '/dashboard/coach', label: 'Home' },
    { href: '/dashboard/coach/messages', label: 'Notifications' },
    { href: '/dashboard/coach/schedule', label: 'Schedule', activePaths: ['/dashboard/coach/sessions', '/dashboard/coach/fixtures'] },
    { href: '/dashboard/coach/players', label: 'Players', activePaths: ['/dashboard/coach/players', '/dashboard/coach/teams'] },
    { href: '/dashboard/coach/tickets', label: 'Tickets' },
    { href: '/dashboard/coach/settings', label: 'Settings' }
  ],
  player: [
    { href: '/dashboard/player', label: 'Home' },
    { href: '/dashboard/player/notifications', label: 'Notifications' },
    { href: '/dashboard/player/schedule', label: 'Schedule' },
    { href: '/dashboard/player/goals', label: 'Goals' },
    { href: '/dashboard/player/tickets', label: 'Tickets' },
    { href: '/dashboard/player/settings', label: 'Settings' }
  ]
};

function getContrastText(hexColour: string): string {
  const hex = hexColour.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

function darkenHex(hexColour: string, percent: number): string {
  const hex = hexColour.replace('#', '');
  const value = parseInt(hex.length === 6 ? hex : '00c851', 16);
  const amount = Math.round((255 * percent) / 100);
  const r = Math.max(0, (value >> 16) - amount);
  const g = Math.max(0, ((value >> 8) & 0xff) - amount);
  const b = Math.max(0, (value & 0xff) - amount);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function isActivePath(pathname: string, item: HeaderNavItem): boolean {
  if (item.href === '/dashboard/club' || item.href === '/dashboard/coach' || item.href === '/dashboard/player') {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`) || Boolean(item.activePaths?.some((path) => pathname.startsWith(path)));
}

export default function MobileRoleHeader({ role, title, subtitle, badgeUrl, initials, primaryColour }: MobileRoleHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const darkColour = darkenHex(primaryColour, 36);
  const contrastText = getContrastText(primaryColour);
  const navItems = roleNavItems[role];

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  async function handleSignOut() {
    await signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <header className="relative z-40 overflow-visible md:hidden">
      <div
        className="relative overflow-hidden pb-8 pl-5 pr-4 pt-[calc(env(safe-area-inset-top)+14px)]"
        style={{
          background: `linear-gradient(135deg, ${primaryColour} 0%, ${darkColour} 52%, rgba(8,10,15,0.98) 100%)`,
          boxShadow: '0 18px 42px rgba(0,0,0,0.28)'
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle at 18px 18px, #ffffff 1px, transparent 1px)',
            backgroundSize: '18px 18px'
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-[#080a0f]" />

        <div className="relative flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div
              className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-2xl ring-1 ring-white/20"
              style={{
                background: badgeUrl ? 'rgba(255,255,255,0.08)' : `linear-gradient(135deg, ${primaryColour}, ${darkColour})`,
                boxShadow: `0 16px 36px rgba(0,0,0,0.42), 0 0 26px ${primaryColour}55`
              }}
            >
              {badgeUrl ? (
                <img src={badgeUrl} alt={`${title} badge`} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-black tracking-tight" style={{ color: contrastText }}>
                  {initials}
                </span>
              )}
            </div>
            <div className="min-w-0 pb-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/35">{role === 'club' ? 'Club OS' : role === 'coach' ? 'Coach OS' : 'Player OS'}</p>
              <h1 className="mt-1 truncate text-xl font-black tracking-tight text-white">{title}</h1>
              {subtitle ? <p className="mt-1 truncate text-xs font-medium text-white/45">{subtitle}</p> : null}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.09] text-white shadow-lg backdrop-blur-xl transition-all duration-300 ease-out active:scale-95"
            aria-label="Open navigation menu"
          >
            <svg width="21" height="21" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 7h14" />
              <path d="M5 12h14" />
              <path d="M5 17h14" />
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" aria-label="Close navigation menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
          <div
            className="absolute inset-x-4 top-[calc(env(safe-area-inset-top)+14px)] overflow-hidden rounded-[24px] border border-white/[0.08] p-3 shadow-2xl"
            style={{ background: 'linear-gradient(180deg, rgba(13,17,23,0.98), rgba(8,10,15,0.98))' }}
          >
            <div className="flex items-center justify-between gap-3 px-2 pb-3 pt-1">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.28em] text-white/25">Navigation</p>
                <p className="mt-1 truncate text-sm font-semibold text-white">{title}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-white/65 transition-all duration-300 ease-out active:scale-95"
                aria-label="Close navigation menu"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <nav className="grid gap-1">
              {navItems.map((item) => {
                const active = isActivePath(pathname, item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-12 items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300 ease-out"
                    style={active ? { backgroundColor: `${primaryColour}1f`, color: '#ffffff' } : { color: 'rgba(255,255,255,0.54)' }}
                  >
                    <span>{item.label}</span>
                    <span className="text-lg leading-none" style={{ color: active ? primaryColour : 'rgba(255,255,255,0.24)' }}>→</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-3 border-t border-white/[0.06] px-4 pb-2 pt-4">
              <button type="button" onClick={handleSignOut} className="text-sm font-medium text-white/35 transition-all duration-300 ease-out active:text-white">
                Sign out
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

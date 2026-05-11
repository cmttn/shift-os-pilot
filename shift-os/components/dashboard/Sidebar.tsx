'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { signOut } from '@/lib/auth/signOut';
import type { ClubRecord } from '@/lib/dashboard/getClubData';

function getContrastText(hexColour: string): string {
  const hex = hexColour.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

interface SidebarProps {
  club: ClubRecord;
}

const navItems = [
  {
    href: '/dashboard/club',
    label: 'Home',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9,22 9,12 15,12 15,22" />
      </svg>
    )
  },
  {
    href: '/dashboard/club/teams',
    label: 'Teams',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    )
  },
  {
    href: '/dashboard/club/fixtures',
    label: 'Fixtures',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    )
  },
  {
    href: '/dashboard/club/tools',
    label: 'Tools',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
      </svg>
    )
  },
  {
    href: '/dashboard/club/tickets',
    label: 'Tickets',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 11h6" />
        <path d="M9 15h4" />
        <path d="M19 3H5a2 2 0 00-2 2v14l4-4h12a2 2 0 002-2V5a2 2 0 00-2-2z" />
      </svg>
    )
  },
  {
    href: '/dashboard/club/settings',
    label: 'Settings',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    )
  }
] satisfies Array<{ href: string; label: string; icon: ReactNode }>;

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
  const accentSoft = `${club.primary_colour}1f`;
  const accentGlow = `${club.primary_colour}59`;

  const handleSignOut = async () => {
    await signOut();
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
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl font-black shadow-lg transition-all duration-300 ease-out hover:scale-105 md:hidden"
        style={{ color: club.primary_colour, boxShadow: `0 12px 30px ${club.primary_colour}40` }}
        aria-label="Open sidebar"
      >
        =
      </button>
      {open && (
        <button
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          aria-label="Close menu overlay"
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r transition-transform duration-300 ease-out md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, #0a0d14 0%, #080a0f 100%)',
          borderColor: 'rgba(255,255,255,0.06)'
        }}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white/45 transition-all duration-300 ease-out hover:bg-white/[0.04] hover:text-white md:hidden"
          aria-label="Close sidebar"
        >
          x
        </button>

        <div className="px-7 pb-5 pt-7">
          {club.badge_url ? (
            <img
              src={club.badge_url}
              alt={`${club.name} badge`}
              className="h-[72px] w-[72px] rounded-full object-cover"
              style={{ filter: `drop-shadow(0 8px 24px rgba(0,0,0,0.6)) drop-shadow(0 0 12px ${accentGlow})` }}
            />
          ) : (
            <p className="text-3xl font-black leading-none" style={{ color: club.primary_colour }}>
              {initials}
            </p>
          )}
          <p className="mt-3 text-lg font-semibold tracking-tight" style={{ color: club.primary_colour }}>
            {club.name}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.28em] text-white/25">{club.plan_tier === 'pro' ? 'Pro' : 'Free'}</p>
          <div className="mt-5 h-px w-full bg-white/[0.06]" />
        </div>

        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const active = item.href === '/dashboard/club' ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="group flex items-center gap-3 rounded-[10px] px-4 py-3 text-sm transition-all duration-300 ease-out hover:translate-x-1 hover:bg-white/[0.04]"
                style={
                  active
                    ? {
                        backgroundColor: accentSoft,
                        borderLeft: `2px solid ${club.primary_colour}`,
                        color: '#ffffff'
                      }
                    : { color: 'rgba(255,255,255,0.45)' }
                }
              >
                <span
                  className="flex h-5 w-5 items-center justify-center text-xs font-black transition-all duration-300 ease-out group-hover:text-white"
                  style={active ? { color: club.primary_colour } : { color: 'rgba(255,255,255,0.35)' }}
                >
                  {item.icon}
                </span>
                <span className={`transition-all duration-300 ease-out group-hover:text-white ${active ? 'font-semibold' : ''}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-7 pb-7">
          <button
            onClick={handleSignOut}
            className="text-sm text-white/25 transition-all duration-300 ease-out hover:text-white"
            style={{ textShadow: `0 0 18px ${contrastText === '#ffffff' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}
          >
            Sign out
          </button>
          <p className="mt-5 text-xs uppercase tracking-[0.28em] text-white/[0.12]">Powered by SHIFT/OS</p>
        </div>
      </aside>
    </>
  );
}

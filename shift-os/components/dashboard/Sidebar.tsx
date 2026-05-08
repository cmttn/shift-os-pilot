'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
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
  { href: '/dashboard/club', label: 'Home', icon: 'H' },
  { href: '/dashboard/club/teams', label: 'Teams', icon: 'T' },
  { href: '/dashboard/club/fixtures', label: 'Fixtures', icon: 'F' },
  { href: '/dashboard/club/tools', label: 'Tools', icon: 'K' },
  { href: '/dashboard/club/settings', label: 'Settings', icon: 'S' }
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
  const accentSoft = `${club.primary_colour}1f`;
  const accentGlow = `${club.primary_colour}59`;

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
            const active = pathname === item.href;
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

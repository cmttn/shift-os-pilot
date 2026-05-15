'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { signOut } from '@/lib/auth/signOut';

type SidebarIcon = 'home' | 'profile' | 'calendar' | 'goals' | 'potm' | 'tickets' | 'bell' | 'settings';

export interface DesktopSidebarItem {
  href: string;
  label: string;
  icon: SidebarIcon;
  activePaths?: string[];
}

export interface DesktopSidebarProfile {
  id: string;
  name: string;
  href: string;
}

interface DashboardDesktopSidebarProps {
  title: string;
  subtitle: string;
  initials: string;
  primaryColour: string;
  items: DesktopSidebarItem[];
  email?: string;
  profileSwitcher?: {
    profiles: DesktopSidebarProfile[];
  };
}

function Icon({ type }: { type: SidebarIcon }) {
  const common = { width: 18, height: 18, fill: 'none', stroke: 'currentColor', strokeWidth: 2, viewBox: '0 0 24 24', 'aria-hidden': true } as const;
  if (type === 'home') return <svg {...common}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></svg>;
  if (type === 'profile') return <svg {...common}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
  if (type === 'calendar') return <svg {...common}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></svg>;
  if (type === 'goals') return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7l4 3-1.5 5h-5L8 10z" /><path d="M12 7V3" /><path d="M16 10l4-1" /><path d="M14.5 15l2.5 4" /><path d="M9.5 15L7 19" /><path d="M8 10L4 9" /></svg>;
  if (type === 'potm') return <svg {...common}><path d="M8 21h8" /><path d="M12 17v4" /><path d="M7 4h10v4a5 5 0 01-10 0V4z" /><path d="M17 5h3a3 3 0 01-3 3" /><path d="M7 5H4a3 3 0 003 3" /></svg>;
  if (type === 'bell') return <svg {...common}><path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>;
  if (type === 'settings') return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>;
  return <svg {...common}><path d="M9 11h6" /><path d="M9 15h4" /><path d="M19 3H5a2 2 0 00-2 2v14l4-4h12a2 2 0 002-2V5a2 2 0 00-2-2z" /></svg>;
}

function isActive(pathname: string, item: DesktopSidebarItem): boolean {
  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return true;
  return (item.activePaths ?? []).some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function possessiveName(name: string): string {
  return name.trim().endsWith('s') ? `${name.trim()}'` : `${name.trim()}'s`;
}

export default function DashboardDesktopSidebar({ title, subtitle, initials, primaryColour, items, email, profileSwitcher }: DashboardDesktopSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [profilesOpen, setProfilesOpen] = useState(false);
  const selectedProfile = useMemo(() => {
    const profiles = profileSwitcher?.profiles ?? [];
    return profiles.find((profile) => pathname.includes(`/player/${profile.id}`) || pathname.includes(`/stars/${profile.id}`)) ?? profiles[0] ?? null;
  }, [pathname, profileSwitcher?.profiles]);

  async function handleSignOut() {
    await signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r md:flex" style={{ background: 'linear-gradient(180deg,#0a0d14,#080a0f)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="p-7">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-black shadow-[0_18px_40px_rgba(0,0,0,0.35)]" style={{ backgroundColor: `${primaryColour}22`, color: primaryColour, border: `1px solid ${primaryColour}44` }}>
          {initials}
        </span>
        <h2 className="mt-4 truncate text-lg font-semibold tracking-tight text-white">{title}</h2>
        <p className="mt-1 text-xs uppercase tracking-[0.28em] text-white/25">{subtitle}</p>
        <div className="mt-5 h-px w-full bg-white/[0.06]" />
      </div>

      {profileSwitcher && selectedProfile ? (
        <div className="relative px-3 pb-3">
          <button
            type="button"
            onClick={() => setProfilesOpen((open) => !open)}
            className="flex w-full items-center gap-3 rounded-[10px] px-4 py-3 text-left text-sm text-white transition-all duration-300 ease-out hover:bg-white/[0.04]"
            style={{ backgroundColor: pathname.includes(`/player/${selectedProfile.id}`) ? `${primaryColour}1f` : 'rgba(255,255,255,0.03)', borderLeft: `2px solid ${primaryColour}` }}
          >
            <span className="flex h-5 w-5 items-center justify-center" style={{ color: primaryColour }}>
              <Icon type="profile" />
            </span>
            <span className="min-w-0 flex-1 truncate font-semibold">{possessiveName(selectedProfile.name)} Profile</span>
            <span className="text-xs text-white/35">v</span>
          </button>
          {profilesOpen ? (
            <div className="absolute left-3 right-3 top-14 z-50 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0d1117] shadow-2xl">
              {profileSwitcher.profiles.map((profile) => (
                <Link key={profile.id} href={profile.href} onClick={() => setProfilesOpen(false)} className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-white/65 transition hover:bg-white/[0.04] hover:text-white">
                  <span className="truncate">{possessiveName(profile.name)} Profile</span>
                  {profile.id === selectedProfile.id ? <span style={{ color: primaryColour }}>✓</span> : null}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <nav className="flex-1 space-y-1 px-3" aria-label="Dashboard quick links">
        {items.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 rounded-[10px] px-4 py-3 text-sm transition-all duration-300 ease-out hover:translate-x-1 hover:bg-white/[0.04] hover:text-white"
              style={active ? { backgroundColor: `${primaryColour}1f`, borderLeft: `2px solid ${primaryColour}`, color: '#ffffff' } : { color: 'rgba(255,255,255,0.45)' }}
            >
              <span className="flex h-5 w-5 items-center justify-center transition-all duration-300 ease-out group-hover:text-white" style={{ color: active ? primaryColour : 'rgba(255,255,255,0.35)' }}>
                <Icon type={item.icon} />
              </span>
              <span className={active ? 'font-semibold' : undefined}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-7">
        {email ? <p className="mb-4 truncate text-xs text-white/25">{email}</p> : null}
        <button type="button" onClick={handleSignOut} className="text-sm text-white/25 transition-all duration-300 ease-out hover:text-white">
          Sign out
        </button>
        <p className="mt-6 text-xs uppercase tracking-[0.28em] text-white/[0.12]">Powered by SHIFT/OS</p>
      </div>
    </aside>
  );
}

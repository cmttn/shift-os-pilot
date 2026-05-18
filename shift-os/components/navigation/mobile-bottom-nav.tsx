'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Role = 'parent' | 'coach' | 'club' | 'player';

interface NavItem {
  href: string;
  label: string;
  icon: 'home' | 'bell' | 'calendar' | 'goals' | 'tickets' | 'players' | 'teams' | 'settings';
  activePaths?: string[];
}

interface MobileBottomNavProps {
  role: Role;
  primaryColour?: string;
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
  parent: [
    { href: '/dashboard/parent', label: 'Home', icon: 'home', activePaths: ['/dashboard/parent/player'] },
    { href: '/dashboard/parent/notifications', label: 'Notifications', icon: 'bell' },
    { href: '/dashboard/parent/schedule', label: 'Schedule', icon: 'calendar' },
    { href: '/dashboard/parent/goals', label: 'Goals', icon: 'goals', activePaths: ['/dashboard/parent/goals', '/dashboard/parent/stars'] },
    { href: '/dashboard/parent/tickets', label: 'Tickets', icon: 'tickets' },
    { href: '/dashboard/parent/settings', label: 'Settings', icon: 'settings' }
  ],
  coach: [
    { href: '/dashboard/coach', label: 'Home', icon: 'home' },
    { href: '/dashboard/coach/messages', label: 'Notifications', icon: 'bell' },
    { href: '/dashboard/coach/schedule', label: 'Schedule', icon: 'calendar', activePaths: ['/dashboard/coach/sessions', '/dashboard/coach/fixtures'] },
    { href: '/dashboard/coach/players', label: 'Players', icon: 'players', activePaths: ['/dashboard/coach/players', '/dashboard/coach/teams'] },
    { href: '/dashboard/coach/tickets', label: 'Tickets', icon: 'tickets' },
    { href: '/dashboard/coach/settings', label: 'Settings', icon: 'settings' }
  ],
  club: [
    { href: '/dashboard/club', label: 'Home', icon: 'home' },
    { href: '/dashboard/club/notifications', label: 'Notifications', icon: 'bell' },
    { href: '/dashboard/club/fixtures', label: 'Fixtures', icon: 'calendar' },
    { href: '/dashboard/club/teams', label: 'Teams', icon: 'teams' },
    { href: '/dashboard/club/tickets', label: 'Tickets', icon: 'tickets' },
    { href: '/dashboard/club/settings', label: 'Settings', icon: 'settings' }
  ],
  player: [
    { href: '/dashboard/player', label: 'Home', icon: 'home' },
    { href: '/dashboard/player/notifications', label: 'Notifications', icon: 'bell' },
    { href: '/dashboard/player/schedule', label: 'Schedule', icon: 'calendar' },
    { href: '/dashboard/player/goals', label: 'Goals', icon: 'goals' },
    { href: '/dashboard/player/tickets', label: 'Tickets', icon: 'tickets' },
    { href: '/dashboard/player/settings', label: 'Settings', icon: 'settings' }
  ]
};

function Icon({ type }: { type: NavItem['icon'] }) {
  const common = { width: 20, height: 20, fill: 'none', stroke: 'currentColor', strokeWidth: 2, viewBox: '0 0 24 24', 'aria-hidden': true } as const;
  if (type === 'home') return <svg {...common}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></svg>;
  if (type === 'bell') return <svg {...common}><path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>;
  if (type === 'calendar') return <svg {...common}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></svg>;
  if (type === 'goals') return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7l4 3-1.5 5h-5L8 10z" /><path d="M12 7V3" /><path d="M16 10l4-1" /><path d="M14.5 15l2.5 4" /><path d="M9.5 15L7 19" /><path d="M8 10L4 9" /></svg>;
  if (type === 'players') return <svg {...common}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>;
  if (type === 'teams') return <svg {...common}><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-8h6v8" /></svg>;
  if (type === 'settings') return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>;
  return <svg {...common}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>;
}

function isActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href) return true;
  const candidates = item.activePaths ?? [];
  return candidates.some((candidate) => pathname === candidate || pathname.startsWith(`${candidate}/`));
}

export default function MobileBottomNav({ role, primaryColour = '#00C851' }: MobileBottomNavProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS[role];

  return (
    <nav
      aria-label={`${role} dashboard navigation`}
      className="fixed inset-x-0 bottom-0 z-50 border-t px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 backdrop-blur-xl md:hidden"
      style={{ backgroundColor: 'rgba(8,10,15,0.96)', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <div className="mx-auto grid max-w-[560px] gap-1" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[9px] font-medium transition-all duration-300 ease-out"
              style={{
                color: active ? primaryColour : 'rgba(255,255,255,0.42)',
                backgroundColor: active ? `${primaryColour}14` : 'transparent'
              }}
            >
              <Icon type={item.icon} />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

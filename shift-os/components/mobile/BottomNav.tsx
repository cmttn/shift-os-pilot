'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BottomNavItem {
  href: string;
  label: string;
  icon: string;
}

interface BottomNavProps {
  primaryColour: string;
  items: BottomNavItem[];
}

function NavIcon({ label, fallback }: { label: string; fallback: string }) {
  const key = label.toLowerCase();
  if (key === 'squad') {
    return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>;
  }
  if (key === 'schedule' || key === 'fixtures') {
    return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
  }
  if (key === 'stats' || key === 'avail') {
    return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>;
  }
  if (key === 'messages') {
    return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>;
  }
  if (key === 'profile' || key === 'settings' || key === 'team') {
    return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
  }
  return <span className="text-lg leading-none">{fallback}</span>;
}

export default function BottomNav({ primaryColour, items }: BottomNavProps) {
  const pathname = usePathname();
  const visibleItems = items.slice(0, 5);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 h-16 border-t px-3 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden" style={{ backgroundColor: 'rgba(8,10,15,0.95)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="mx-auto grid h-full max-w-[480px] items-center" style={{ gridTemplateColumns: `repeat(${visibleItems.length}, minmax(0, 1fr))` }}>
        {visibleItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center gap-1 text-xs transition-all duration-300 ease-out" style={{ color: active ? primaryColour : 'rgba(255,255,255,0.3)' }}>
              <span className="flex h-5 items-center justify-center leading-none"><NavIcon label={item.label} fallback={item.icon} /></span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

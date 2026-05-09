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

export default function BottomNav({ primaryColour, items }: BottomNavProps) {
  const pathname = usePathname();
  const visibleItems = items.slice(0, 5);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 h-16 border-t px-3 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl" style={{ backgroundColor: 'rgba(8,10,15,0.95)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="mx-auto grid h-full max-w-[480px] items-center" style={{ gridTemplateColumns: `repeat(${visibleItems.length}, minmax(0, 1fr))` }}>
        {visibleItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center gap-1 text-xs transition-all duration-300 ease-out" style={{ color: active ? primaryColour : 'rgba(255,255,255,0.3)' }}>
              <span className="text-lg leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

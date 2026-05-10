'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth/signOut';
import type { CoachDashboardData } from '@/lib/dashboard/getCoachData';

interface CoachSidebarProps {
  data: CoachDashboardData;
}

const navItems = [
  ['Squad', '/dashboard/coach'],
  ['Schedule', '/dashboard/coach/schedule'],
  ['Stats', '/dashboard/coach/stats'],
  ['Messages', '/dashboard/coach/messages'],
  ['Profile', '/dashboard/coach/profile'],
  ['Settings', '/dashboard/coach/settings']
] as const;

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'CO';
}

export default function CoachSidebar({ data }: CoachSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const team = data.teams[0] ?? null;
  const primaryColour = team?.club_primary_colour ?? '#00C851';
  async function handleSignOut() {
    await signOut();
    router.push('/');
    router.refresh();
  }
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r md:flex" style={{ background: 'linear-gradient(180deg,#0a0d14,#080a0f)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="p-7">
        <div className="text-4xl font-black" style={{ color: primaryColour }}>{team ? initials(team.name) : 'SO'}</div>
        <h2 className="mt-3 text-lg font-semibold tracking-tight text-white">{team?.name ?? 'Coach'}</h2>
        <p className="mt-1 text-xs uppercase tracking-widest text-white/25">{team?.age_group ?? 'No team selected'}</p>
        {team?.is_club_managed ? <p className="mt-3 text-xs text-white/35">{team.club_name}</p> : null}
      </div>
      <nav className="flex-1 px-3">
        {navItems.map(([label, href]) => {
          const isActive = href === '/dashboard/coach' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={href} href={href} className="mb-1 flex items-center gap-3 rounded-[10px] px-4 py-3 text-sm text-white/45 transition-all duration-300 ease-out hover:translate-x-1 hover:bg-white/[0.04] hover:text-white" style={isActive ? { backgroundColor: `${primaryColour}1f`, borderLeft: `2px solid ${primaryColour}`, color: '#ffffff' } : undefined}>
              <span className="flex h-[18px] w-[18px] items-center justify-center text-xs font-black" style={{ color: isActive ? primaryColour : 'rgba(255,255,255,0.35)' }}>{label[0]}</span>
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-7">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-black" style={{ backgroundColor: primaryColour, color: '#000000' }}>{initials(data.coach.full_name)}</span>
          <p className="min-w-0 truncate text-sm text-white/55">{data.coach.full_name}</p>
        </div>
        <button type="button" onClick={handleSignOut} className="mt-5 text-sm text-white/25 transition-all duration-300 ease-out hover:text-white">Sign out</button>
        <p className="mt-6 text-xs uppercase tracking-widest text-white/[0.12]">Powered by SHIFT/OS</p>
      </div>
    </aside>
  );
}

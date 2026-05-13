'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signOut } from '@/lib/auth/signOut';
import type { CoachDashboardData } from '@/lib/dashboard/getCoachData';
import { createClient } from '@/lib/supabase/client';

interface CoachSidebarProps {
  data: CoachDashboardData;
}

const navItems = [
  ['Squad', '/dashboard/coach'],
  ['Schedule', '/dashboard/coach/schedule'],
  ['Stats', '/dashboard/coach/stats'],
  ['Tickets', '/dashboard/coach/tickets'],
  ['Profile', '/dashboard/coach/profile'],
  ['Settings', '/dashboard/coach/settings']
] as const;

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'CO';
}

function NavIcon({ label }: { label: string }) {
  if (label === 'Tickets') {
    return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" /></svg>;
  }
  if (label === 'Settings') {
    return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>;
  }
  return <span>{label[0]}</span>;
}

export default function CoachSidebar({ data }: CoachSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [unviewedTicketCount, setUnviewedTicketCount] = useState(0);
  const team = data.teams[0] ?? null;
  const primaryColour = team?.club_primary_colour ?? '#00C851';
  async function handleSignOut() {
    await signOut();
    router.push('/');
    router.refresh();
  }
  useEffect(() => {
    async function loadTicketCount() {
      const { count } = await createClient()
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .eq('coach_recipient_id', data.coach.id)
        .eq('is_safeguarding', false)
        .eq('status', 'open');
      setUnviewedTicketCount(count ?? 0);
    }
    void loadTicketCount();
  }, [data.coach.id]);

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
              <span className="relative flex h-[18px] w-[18px] items-center justify-center text-xs font-black" style={{ color: isActive ? primaryColour : 'rgba(255,255,255,0.35)' }}>
                <NavIcon label={label} />
                {label === 'Tickets' && unviewedTicketCount > 0 ? <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">{unviewedTicketCount > 9 ? '9+' : unviewedTicketCount}</span> : null}
              </span>
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

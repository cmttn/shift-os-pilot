import type { ReactNode } from 'react';
import DashboardDesktopSidebar, { type DesktopSidebarItem } from '@/components/navigation/DashboardDesktopSidebar';
import MobileBottomNav from '@/components/navigation/mobile-bottom-nav';
import MobileRoleHeader from '@/components/navigation/mobile-role-header';
import { createClient } from '@/lib/supabase/server';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default async function PlayerDashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  const { data: profile } = user
    ? await supabase.from('users_profile').select('full_name').eq('id', user.id).maybeSingle<{ full_name: string | null }>()
    : { data: null };
  const playerName = profile?.full_name?.trim() || String(user?.user_metadata.full_name ?? '').trim() || 'Player';
  const playerItems: DesktopSidebarItem[] = [
    { href: '/dashboard/player', label: 'Home', icon: 'home' },
    { href: '/dashboard/player/settings', label: 'Profile & Settings', icon: 'profile' },
    { href: '/dashboard/player/schedule', label: 'Schedule', icon: 'calendar' },
    { href: '/dashboard/player/goals', label: 'Goals', icon: 'goals' },
    { href: '/dashboard/player/tickets', label: 'Tickets', icon: 'tickets' },
    { href: '/dashboard/player/notifications', label: 'Notifications', icon: 'bell' }
  ];

  return (
    <>
      <DashboardDesktopSidebar
        title={playerName}
        subtitle="Player workspace"
        initials={getInitials(playerName)}
        primaryColour="#00C851"
        items={playerItems}
        email={user?.email}
      />
      <MobileRoleHeader
        role="player"
        title={playerName}
        subtitle="Player workspace"
        initials={getInitials(playerName)}
        primaryColour="#00C851"
      />
      <div className="pb-24 md:pb-0 md:pl-[260px]">{children}</div>
      <MobileBottomNav role="player" primaryColour="#00C851" />
    </>
  );
}

import type { ReactNode } from 'react';
import DashboardDesktopSidebar, { type DesktopSidebarItem } from '@/components/navigation/DashboardDesktopSidebar';
import MobileBottomNav from '@/components/navigation/mobile-bottom-nav';
import { getParentDashboardData, type ParentPlayer } from '@/lib/dashboard/getParentDashboardData';

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'PO';
}

function playerHref(player: ParentPlayer | null): string {
  if (!player) return '/dashboard/parent';
  if (player.teams.length === 1) return `/dashboard/parent/player/${player.id}/team/${player.teams[0].team_id}`;
  return `/dashboard/parent/player/${player.id}`;
}

export default async function ParentDashboardLayout({ children }: { children: ReactNode }) {
  const parentData = await getParentDashboardData();
  const primaryColour = parentData?.allSameClub ? parentData.globalPrimaryColour : '#00C851';
  const parentItems: DesktopSidebarItem[] = [
    { href: '/dashboard/parent', label: 'Home', icon: 'home' },
    { href: '/dashboard/parent/schedule', label: 'Schedule', icon: 'calendar' },
    { href: '/dashboard/parent/goals', label: 'Goals', icon: 'goals', activePaths: ['/dashboard/parent/goals', '/dashboard/parent/stars'] },
    { href: '/dashboard/parent/potm', label: 'POTM Library', icon: 'potm' },
    { href: '/dashboard/parent/tickets', label: 'Tickets', icon: 'tickets' },
    { href: '/dashboard/parent/notifications', label: 'Notifications', icon: 'bell' },
    { href: '/dashboard/parent/settings', label: 'Settings', icon: 'settings' }
  ];

  return (
    <>
      <DashboardDesktopSidebar
        title={parentData?.parentFirstName ? `${parentData.parentFirstName}'s dashboard` : 'Parent dashboard'}
        subtitle={parentData?.allSameClub && parentData.globalClubName ? parentData.globalClubName : 'SHIFT/OS parent'}
        initials={initials(parentData?.parentFirstName ?? 'Parent')}
        primaryColour={primaryColour}
        items={parentItems}
        email={parentData?.email}
        profileSwitcher={parentData && parentData.players.length > 0 ? {
          profiles: parentData.players.map((player) => ({
            id: player.id,
            name: player.first_name || player.full_name,
            href: playerHref(player)
          }))
        } : undefined}
      />
      <div className="pb-24 md:pb-0 md:pl-[260px]">{children}</div>
      <MobileBottomNav role="parent" primaryColour={primaryColour} />
    </>
  );
}

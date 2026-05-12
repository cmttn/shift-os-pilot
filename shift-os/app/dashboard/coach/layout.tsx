import { ReactNode } from 'react';
import CoachSidebar from '@/components/dashboard/CoachSidebar';
import NotificationPermission from '@/components/NotificationPermission';
import MobileBottomNav from '@/components/navigation/mobile-bottom-nav';
import MobileRoleHeader from '@/components/navigation/mobile-role-header';
import { getCoachData } from '@/lib/dashboard/getCoachData';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default async function CoachLayout({ children }: { children: ReactNode }) {
  const coachData = await getCoachData();
  if (!coachData) {
    return <>{children}</>;
  }

  if (coachData.teams.length === 0) {
    return <>{children}</>;
  }

  const activeTeam = coachData.teams[0] ?? null;
  const primaryColour = activeTeam?.club_primary_colour ?? '#00C851';
  const title = activeTeam?.name ?? coachData.coach.full_name;
  const subtitle = activeTeam
    ? [activeTeam.age_group, activeTeam.gender, activeTeam.club_name].filter(Boolean).join(' / ')
    : 'Coach workspace';
  return (
    <>
      <CoachSidebar data={coachData} />
      <NotificationPermission />
      <MobileRoleHeader
        role="coach"
        title={title}
        subtitle={subtitle}
        badgeUrl={activeTeam?.club_badge_url ?? null}
        initials={getInitials(title)}
        primaryColour={primaryColour}
      />
      <div className="pb-24 md:pb-0">{children}</div>
      <MobileBottomNav role="coach" primaryColour={primaryColour} />
    </>
  );
}

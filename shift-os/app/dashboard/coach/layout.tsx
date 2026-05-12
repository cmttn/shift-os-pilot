import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import CoachSidebar from '@/components/dashboard/CoachSidebar';
import NotificationPermission from '@/components/NotificationPermission';
import MobileBottomNav from '@/components/navigation/mobile-bottom-nav';
import { getCoachData } from '@/lib/dashboard/getCoachData';

export default async function CoachLayout({ children }: { children: ReactNode }) {
  const coachData = await getCoachData();
  if (!coachData) redirect('/dashboard/coach/welcome');
  const primaryColour = coachData.teams[0]?.club_primary_colour ?? '#00C851';
  return (
    <>
      <CoachSidebar data={coachData} />
      <NotificationPermission />
      <div className="pb-24 md:pb-0">{children}</div>
      <MobileBottomNav role="coach" primaryColour={primaryColour} />
    </>
  );
}

import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import ClubHeader from '@/components/dashboard/ClubHeader';
import MobileBottomNav from '@/components/navigation/mobile-bottom-nav';
import MobileRoleHeader from '@/components/navigation/mobile-role-header';
import { getClubData } from '@/lib/dashboard/getClubData';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default async function ClubDashboardLayout({ children }: { children: ReactNode }) {
  const clubData = await getClubData();

  if (!clubData) {
    redirect('/onboarding');
  }

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#080a0f' }}>
      <Sidebar club={clubData.club} />
      <main className="md:ml-[260px]">
        <MobileRoleHeader
          role="club"
          title={clubData.club.name}
          subtitle={clubData.club.ethos ?? 'Club operations'}
          badgeUrl={clubData.club.badge_url}
          initials={getInitials(clubData.club.name)}
          primaryColour={clubData.club.primary_colour}
        />
        <ClubHeader clubData={clubData} />
        <div className="px-4 pb-28 pt-6 md:px-8 md:py-8">{children}</div>
      </main>
      <MobileBottomNav role="club" primaryColour={clubData.club.primary_colour} />
    </div>
  );
}

import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import ClubHeader from '@/components/dashboard/ClubHeader';
import MobileBottomNav from '@/components/navigation/mobile-bottom-nav';
import { getClubData } from '@/lib/dashboard/getClubData';

export default async function ClubDashboardLayout({ children }: { children: ReactNode }) {
  const clubData = await getClubData();

  if (!clubData) {
    redirect('/onboarding');
  }

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#080a0f' }}>
      <Sidebar club={clubData.club} />
      <main className="md:ml-[260px]">
        <ClubHeader clubData={clubData} />
        <div className="px-4 pb-28 pt-4 md:px-8 md:py-8">{children}</div>
      </main>
      <MobileBottomNav role="club" primaryColour={clubData.club.primary_colour} />
    </div>
  );
}

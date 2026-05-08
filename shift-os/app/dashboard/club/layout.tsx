import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import ClubHeader from '@/components/dashboard/ClubHeader';
import { getClubData } from '@/lib/dashboard/getClubData';

export default async function ClubDashboardLayout({ children }: { children: ReactNode }) {
  const clubData = await getClubData();

  if (!clubData) {
    redirect('/onboarding');
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Sidebar club={clubData.club} />
      <main className="md:ml-[240px]">
        <ClubHeader clubData={clubData} />
        <div className="px-4 py-4 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}

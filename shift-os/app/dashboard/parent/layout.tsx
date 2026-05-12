import type { ReactNode } from 'react';
import MobileBottomNav from '@/components/navigation/mobile-bottom-nav';
import { getParentDashboardData } from '@/lib/dashboard/getParentDashboardData';

export default async function ParentDashboardLayout({ children }: { children: ReactNode }) {
  const parentData = await getParentDashboardData();
  const primaryColour = parentData?.allSameClub ? parentData.globalPrimaryColour : '#00C851';

  return (
    <>
      <div className="pb-24 md:pb-0">{children}</div>
      <MobileBottomNav role="parent" primaryColour={primaryColour} />
    </>
  );
}

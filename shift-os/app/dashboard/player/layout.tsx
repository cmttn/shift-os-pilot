import type { ReactNode } from 'react';
import MobileBottomNav from '@/components/navigation/mobile-bottom-nav';

export default function PlayerDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="pb-24 md:pb-0">{children}</div>
      <MobileBottomNav role="player" primaryColour="#00C851" />
    </>
  );
}

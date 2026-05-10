import { redirect } from 'next/navigation';
import BottomNav from '@/components/mobile/BottomNav';
import SettingsShell from '@/components/dashboard/SettingsShell';
import { getParentDashboardData } from '@/lib/dashboard/getParentDashboardData';

export default async function ParentSettingsPage() {
  const parentData = await getParentDashboardData();
  if (!parentData) redirect('/dashboard/parent/player');
  return (
    <>
      <SettingsShell
        title="Parent Settings"
        name={parentData.firstName}
        email={parentData.email}
        contextRows={[
          { label: 'Linked players', value: parentData.players.map((player) => player.full_name).join(', ') || 'No linked players' }
        ]}
      />
      <BottomNav primaryColour={parentData.club.primary_colour} items={[
        { href: '/dashboard/parent/player', label: 'Home', icon: 'H' },
        { href: '/dashboard/parent/player', label: 'Fixtures', icon: 'F' },
        { href: '/dashboard/parent/player', label: 'Avail', icon: 'A' },
        { href: '/dashboard/parent/player', label: 'Team', icon: 'T' },
        { href: '/dashboard/parent/settings', label: 'Settings', icon: 'S' }
      ]} />
    </>
  );
}

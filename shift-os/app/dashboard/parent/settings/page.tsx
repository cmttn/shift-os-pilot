import { redirect } from 'next/navigation';
import BottomNav from '@/components/mobile/BottomNav';
import SettingsShell from '@/components/dashboard/SettingsShell';
import { getParentDashboardData } from '@/lib/dashboard/getParentDashboardData';
import { createClient } from '@/lib/supabase/server';

export default async function ParentSettingsPage() {
  const parentData = await getParentDashboardData();
  if (!parentData) redirect('/dashboard/parent');
  const primaryColour = parentData.allSameClub ? parentData.globalPrimaryColour : '#f0f4ff';
  const supabase = await createClient();
  const { count: openTicketCount } = await supabase
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('raised_by', parentData.userId)
    .neq('status', 'resolved');
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
      <BottomNav primaryColour={primaryColour} items={[
        { href: '/dashboard/parent', label: 'Home', icon: 'H' },
        { href: '/dashboard/parent', label: 'Fixtures', icon: 'F' },
        { href: '/dashboard/parent', label: 'Avail', icon: 'A' },
        { href: '/dashboard/parent/tickets', label: 'Tickets', icon: 'T', badgeCount: openTicketCount ?? 0 },
        { href: '/dashboard/parent/settings', label: 'Settings', icon: 'S' }
      ]} />
    </>
  );
}

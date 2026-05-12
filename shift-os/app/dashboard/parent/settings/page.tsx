import { redirect } from 'next/navigation';
import SettingsShell from '@/components/dashboard/SettingsShell';
import { getParentDashboardData } from '@/lib/dashboard/getParentDashboardData';

export default async function ParentSettingsPage() {
  const parentData = await getParentDashboardData();
  if (!parentData) redirect('/dashboard/parent');
  return (
    <SettingsShell
      title="Parent Settings"
      name={parentData.firstName}
      email={parentData.email}
      contextRows={[
        { label: 'Linked players', value: parentData.players.map((player) => player.full_name).join(', ') || 'No linked players' }
      ]}
    />
  );
}

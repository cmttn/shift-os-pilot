import { redirect } from 'next/navigation';
import SettingsPage from '@/components/dashboard/SettingsPage';
import { getParentDashboardData } from '@/lib/dashboard/getParentDashboardData';
import { getSettingsProfile } from '@/lib/dashboard/getSettingsProfile';

export default async function ParentSettingsPage() {
  const [parentData, settingsData] = await Promise.all([getParentDashboardData(), getSettingsProfile()]);
  if (!parentData) redirect('/dashboard/parent');
  if (!settingsData) redirect('/auth/login');

  const linkedPlayers = parentData.players.map((player) => ({
    id: player.id,
    name: player.full_name,
    teamName: player.teams[0]?.team_name ?? 'Team'
  }));

  return (
    <SettingsPage
      role="parent"
      user={settingsData.user}
      profile={settingsData.profile}
      primaryColour={parentData.allSameClub ? parentData.globalPrimaryColour : '#00C851'}
      linkedPlayers={linkedPlayers}
    />
  );
}

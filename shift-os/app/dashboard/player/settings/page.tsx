import { redirect } from 'next/navigation';
import SettingsPage from '@/components/dashboard/SettingsPage';
import { getSettingsProfile } from '@/lib/dashboard/getSettingsProfile';

export default async function PlayerSettingsPage() {
  const settingsData = await getSettingsProfile();
  if (!settingsData) redirect('/auth/login');

  return (
    <SettingsPage
      role="player"
      user={settingsData.user}
      profile={settingsData.profile}
      primaryColour="#00C851"
    />
  );
}

import { redirect } from 'next/navigation';
import CoachPotmSettingsForm from '@/components/dashboard/CoachPotmSettingsForm';
import SettingsPage from '@/components/dashboard/SettingsPage';
import { getCoachData } from '@/lib/dashboard/getCoachData';
import { getSettingsProfile } from '@/lib/dashboard/getSettingsProfile';

export default async function CoachSettingsPage() {
  const [coachData, settingsData] = await Promise.all([getCoachData(), getSettingsProfile()]);
  if (!coachData) redirect('/dashboard/coach/welcome');
  if (!settingsData) redirect('/auth/login');

  const activeTeam = coachData.teams[0] ?? null;
  const primaryColour = activeTeam?.club_primary_colour ?? '#00C851';

  return (
    <SettingsPage
      role="coach"
      user={settingsData.user}
      profile={settingsData.profile}
      primaryColour={primaryColour}
      extraContent={<CoachPotmSettingsForm userId={coachData.coach.id} clubId={activeTeam?.club_id ?? null} primaryColour={primaryColour} />}
    />
  );
}

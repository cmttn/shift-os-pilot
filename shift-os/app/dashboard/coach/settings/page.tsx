import { redirect } from 'next/navigation';
import SettingsShell from '@/components/dashboard/SettingsShell';
import { getCoachData } from '@/lib/dashboard/getCoachData';

export default async function CoachSettingsPage() {
  const coachData = await getCoachData();
  if (!coachData) redirect('/dashboard/coach/welcome');
  return (
    <SettingsShell
      title="Coach Settings"
      name={coachData.coach.full_name}
      email={coachData.coach.email}
      contextRows={[
        { label: 'Assigned teams', value: coachData.teams.map((team) => team.name).join(', ') || 'No teams assigned' }
      ]}
      desktopOffset
    />
  );
}

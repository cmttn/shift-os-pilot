import { redirect } from 'next/navigation';
import FixtureImportWizard from '@/components/fixtures/FixtureImportWizard';
import { getCoachData } from '@/lib/dashboard/getCoachData';

export default async function CoachFixtureImportPage() {
  const coachData = await getCoachData();
  if (!coachData) redirect('/dashboard/coach/welcome');
  const independentTeams = coachData.teams.filter((team) => !team.is_club_managed);
  if (independentTeams.length === 0) redirect('/dashboard/coach');
  const primaryColour = independentTeams[0]?.club_primary_colour ?? '#00C851';

  return (
    <main className="min-h-screen px-5 pb-[92px] pt-8 text-white" style={{ backgroundColor: '#080a0f' }}>
      <FixtureImportWizard
        teams={independentTeams.map((team) => ({
          id: team.id,
          name: team.name,
          primaryColour: team.club_primary_colour ?? primaryColour
        }))}
        coachId={coachData.coach.id}
        primaryColour={primaryColour}
      />
    </main>
  );
}

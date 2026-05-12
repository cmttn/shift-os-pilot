import { redirect } from 'next/navigation';
import CSVImporter from '@/components/fixtures/CSVImporter';
import { getCoachData } from '@/lib/dashboard/getCoachData';

export default async function CoachFixtureImportPage() {
  const coachData = await getCoachData();
  if (!coachData) redirect('/dashboard/coach/welcome');
  const independentTeams = coachData.teams.filter((team) => !team.is_club_managed);
  if (independentTeams.length === 0) redirect('/dashboard/coach');
  const primaryColour = independentTeams[0]?.club_primary_colour ?? '#00C851';
  return (
    <main className="min-h-screen px-5 pb-[92px] pt-8 text-white" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[480px]">
        <p className="text-xs uppercase tracking-[0.3em] text-white/30">Independent Coach</p>
        <h1 className="mt-3 text-3xl font-black">Import Fixtures</h1>
        <p className="mt-2 text-sm text-white/40">Upload a CSV to build your schedule quickly.</p>
        <div className="mt-6">
          <CSVImporter teams={independentTeams.map((team) => ({ id: team.id, name: team.name }))} lockedTeamId={independentTeams[0]?.id} primaryColour={primaryColour} importedFrom="coach_csv" />
        </div>
      </div>
    </main>
  );
}

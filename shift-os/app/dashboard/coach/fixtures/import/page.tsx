import { redirect } from 'next/navigation';
import FixtureImportWizard from '@/components/fixtures/FixtureImportWizard';
import { getCoachData } from '@/lib/dashboard/getCoachData';
import { contrastText } from '@/lib/utils/contrastText';

export default async function CoachFixtureImportPage() {
  const coachData = await getCoachData();
  if (!coachData) redirect('/dashboard/coach/welcome');
  const importableTeams = coachData.teams.filter((team) => !team.is_club_managed || team.allow_coach_fixture_imports);
  const primaryColour = importableTeams[0]?.club_primary_colour ?? coachData.teams[0]?.club_primary_colour ?? '#00C851';
  const primaryText = contrastText(primaryColour);

  if (importableTeams.length === 0) {
    return (
      <main className="min-h-screen px-5 pb-[92px] pt-8 text-white" style={{ backgroundColor: '#080a0f' }}>
        <section className="mx-auto max-w-[560px] rounded-2xl border border-white/[0.06] p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)' }}>
          <p className="text-xs uppercase tracking-[0.3em] text-white/30">Import Fixtures</p>
          <h1 className="mt-3 text-2xl font-black text-white">League imports are club-managed</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/45">
            Your club controls league fixture uploads for this team. You can still add a friendly manually, view fixtures, add coach notes and send availability polls.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a href="/dashboard/coach/sessions/new?mode=friendly&type=match" className="inline-flex rounded-full px-5 py-3 text-sm font-semibold" style={{ backgroundColor: primaryColour, color: primaryText }}>
              Add Friendly
            </a>
            <a href="/dashboard/coach/schedule" className="inline-flex rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white/55">
              Back to Schedule
            </a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 pb-[92px] pt-8 text-white" style={{ backgroundColor: '#080a0f' }}>
      <FixtureImportWizard
        teams={importableTeams.map((team) => ({
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

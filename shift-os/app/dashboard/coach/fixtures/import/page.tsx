import { redirect } from 'next/navigation';
import FixtureImportWizard from '@/components/fixtures/FixtureImportWizard';
import { getCoachData } from '@/lib/dashboard/getCoachData';
import { contrastText } from '@/lib/utils/contrastText';

export default async function CoachFixtureImportPage() {
  const coachData = await getCoachData();
  if (!coachData) redirect('/dashboard/coach/welcome');
  const independentTeams = coachData.teams.filter((team) => !team.is_club_managed);
  const primaryColour = independentTeams[0]?.club_primary_colour ?? coachData.teams[0]?.club_primary_colour ?? '#00C851';
  const primaryText = contrastText(primaryColour);

  if (independentTeams.length === 0) {
    return (
      <main className="min-h-screen px-5 pb-[92px] pt-8 text-white" style={{ backgroundColor: '#080a0f' }}>
        <section className="mx-auto max-w-[560px] rounded-2xl border border-white/[0.06] p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)' }}>
          <p className="text-xs uppercase tracking-[0.3em] text-white/30">Import Fixtures</p>
          <h1 className="mt-3 text-2xl font-black text-white">Fixtures are club-managed</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/45">
            Your club controls fixture imports for this team. You can still view fixtures, add coach notes and send availability polls from your schedule.
          </p>
          <a href="/dashboard/coach/schedule" className="mt-6 inline-flex rounded-full px-5 py-3 text-sm font-semibold" style={{ backgroundColor: primaryColour, color: primaryText }}>
            Back to Schedule
          </a>
        </section>
      </main>
    );
  }

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

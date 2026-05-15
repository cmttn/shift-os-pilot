import Link from 'next/link';
import { redirect } from 'next/navigation';
import CoachAvailabilityToolClient from '@/components/dashboard/CoachAvailabilityToolClient';
import { getCoachData } from '@/lib/dashboard/getCoachData';

export default async function CoachAvailabilityToolPage() {
  const coachData = await getCoachData();
  if (!coachData) redirect('/dashboard/coach/welcome');

  const sessions = coachData.upcomingSessions.map((session) => {
    const team = coachData.teams.find((item) => item.id === session.team_id);
    return {
      ...session,
      teamName: team?.name ?? 'Team',
      teamPrimaryColour: team?.club_primary_colour ?? '#00C851',
      activePlayerCount: coachData.players.filter((player) => player.team_id === session.team_id && player.is_active).length
    };
  });
  const primaryColour = coachData.teams[0]?.club_primary_colour ?? '#00C851';

  return (
    <main className="min-h-screen px-5 pb-24 pt-8 text-white md:ml-[260px] md:px-8" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard/coach" className="text-sm text-white/40 transition hover:text-white">Back to dashboard</Link>
        <header className="mt-6">
          <p className="text-xs uppercase tracking-[0.28em] text-white/30">Coach tool</p>
          <h1 className="mt-2 text-3xl font-black text-white">Availability / Fixtures</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/40">
            Manage upcoming availability polls, view response counts and follow up without resetting existing replies.
          </p>
        </header>

        <CoachAvailabilityToolClient sessions={sessions} primaryColour={primaryColour} />
      </div>
    </main>
  );
}

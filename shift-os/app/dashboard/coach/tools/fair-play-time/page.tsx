import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCoachData } from '@/lib/dashboard/getCoachData';
import { contrastText } from '@/lib/utils/contrastText';

function formatDateTime(value: string): { date: string; time: string } {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return { date: value, time: '' };
  return {
    date: date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
    time: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  };
}

export default async function FairPlayTimeToolPage() {
  const coachData = await getCoachData();
  if (!coachData) redirect('/dashboard/coach/welcome');

  const matches = coachData.upcomingSessions
    .filter((session) => session.type === 'match')
    .map((session) => ({
      session,
      team: coachData.teams.find((team) => team.id === session.team_id)
    }))
    .filter((item) => item.team);
  const primaryColour = coachData.teams[0]?.club_primary_colour ?? '#00C851';
  const primaryText = contrastText(primaryColour);

  return (
    <main className="min-h-screen px-5 pb-24 pt-8 text-white md:ml-[260px] md:px-8" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard/coach" className="text-sm text-white/40 transition hover:text-white">Back to dashboard</Link>
        <header className="mt-6">
          <p className="text-xs uppercase tracking-[0.28em] text-white/30">Coach tool</p>
          <h1 className="mt-2 text-3xl font-black text-white">Fair Play Time</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/40">
            Choose an upcoming match, then use the existing playtime calculator to plan minutes fairly.
          </p>
        </header>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          {matches.length === 0 ? (
            <div className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <h2 className="text-xl font-bold text-white">No upcoming matches</h2>
              <p className="mt-2 text-sm text-white/40">Add a match session before planning playtime.</p>
              <Link href="/dashboard/coach/sessions/new?type=match" className="mt-5 inline-flex rounded-full px-5 py-3 text-sm font-semibold" style={{ backgroundColor: primaryColour, color: primaryText }}>
                Create match session
              </Link>
            </div>
          ) : matches.map(({ session, team }) => {
            const formatted = formatDateTime(session.session_date);
            return (
              <article key={session.id} className="rounded-2xl border p-5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/30">{team?.name}</p>
                    <h2 className="mt-2 text-xl font-bold text-white">{session.opponent ? `vs ${session.opponent}` : session.title ?? 'Match'}</h2>
                  </div>
                  <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/45">Match</span>
                </div>
                <div className="mt-4 space-y-1 text-sm text-white/40">
                  <p>{formatted.date}{formatted.time ? ` at ${formatted.time}` : ''}</p>
                  <p>{session.full_address || session.location || 'Location TBC'}</p>
                </div>
                <Link href={`/dashboard/coach/sessions/${session.id}/playtime`} className="mt-5 inline-flex w-full justify-center rounded-full px-5 py-3 text-sm font-semibold" style={{ backgroundColor: primaryColour, color: primaryText }}>
                  Plan playtime
                </Link>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}

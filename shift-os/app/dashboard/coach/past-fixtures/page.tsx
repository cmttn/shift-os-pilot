import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCoachData } from '@/lib/dashboard/getCoachData';
import { createClient } from '@/lib/supabase/server';

interface RawSession {
  id: string;
  team_id: string;
  type: string;
  title: string | null;
  opponent: string | null;
  session_date: string;
  location: string | null;
}

interface RawSaved {
  session_id: string;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function sessionTitle(session: RawSession): string {
  if (session.type === 'match') return `vs ${session.opponent ?? 'Opponent TBC'}`;
  return session.title ?? session.opponent ?? session.type;
}

export default async function CoachPastFixturesPage() {
  const coachData = await getCoachData();
  if (!coachData) redirect('/dashboard/coach/welcome');
  const teamIds = coachData.teams.map((team) => team.id);
  const supabase = await createClient();
  const { data: sessionsData } = teamIds.length > 0
    ? await supabase
      .from('sessions')
      .select('id,team_id,type,title,opponent,session_date,location')
      .in('team_id', teamIds)
      .eq('is_active', true)
      .lt('session_date', new Date().toISOString())
      .order('session_date', { ascending: false })
    : { data: [] as RawSession[] };
  const sessions = (sessionsData ?? []) as RawSession[];
  const sessionIds = sessions.map((session) => session.id);
  const [{ data: playtimeData }, { data: statsData }] = await Promise.all([
    sessionIds.length > 0 ? supabase.from('playtime_calculations').select('session_id').in('session_id', sessionIds) : Promise.resolve({ data: [] as RawSaved[] }),
    sessionIds.length > 0 ? supabase.from('match_stats').select('session_id').in('session_id', sessionIds) : Promise.resolve({ data: [] as RawSaved[] })
  ]);
  const playtimeIds = new Set(((playtimeData ?? []) as RawSaved[]).map((row) => row.session_id));
  const statsIds = new Set(((statsData ?? []) as RawSaved[]).map((row) => row.session_id));
  const primaryColour = coachData.teams[0]?.club_primary_colour ?? '#00C851';

  return (
    <main className="min-h-screen px-5 pb-24 pt-8 text-white md:ml-[260px]" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[900px]">
        <Link href="/dashboard/coach" className="text-sm text-white/40 transition-all duration-300 ease-out hover:text-white">Back to coach dashboard</Link>
        <header className="mt-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/30">Past Fixtures</p>
            <h1 className="mt-2 text-3xl font-black">Review sessions and match records</h1>
          </div>
          <input placeholder="Search by opponent or date" className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-white outline-none md:w-64" />
        </header>

        <section className="mt-6 space-y-3">
          {sessions.length === 0 ? (
            <p className="rounded-2xl border border-white/[0.06] p-6 text-sm text-white/40" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)' }}>No past fixtures yet.</p>
          ) : sessions.map((session) => {
            const team = coachData.teams.find((item) => item.id === session.team_id);
            return (
              <Link key={session.id} href={`/dashboard/coach/sessions/${session.id}/past`} className="block rounded-2xl border p-5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-white/15" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/30">{formatDate(session.session_date)} · {session.type}</p>
                    <h2 className="mt-1 text-xl font-bold">{sessionTitle(session)}</h2>
                    <p className="mt-1 text-sm text-white/35">{team?.name ?? 'Team'} · {session.location ?? 'Location TBC'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {playtimeIds.has(session.id) ? <span className="rounded-full px-3 py-1 text-xs font-semibold text-black" style={{ backgroundColor: primaryColour }}>playtime saved</span> : null}
                    {statsIds.has(session.id) ? <span className="rounded-full bg-white/[0.08] px-3 py-1 text-xs text-white/60">stats saved</span> : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}

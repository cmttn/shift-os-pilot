import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCoachData } from '@/lib/dashboard/getCoachData';
import { createClient } from '@/lib/supabase/server';
import { type PlaytimeResult } from '@/lib/tools/playtimeCalculator';

interface PastSessionPageProps {
  params: {
    sessionId: string;
  };
}

interface RawSession {
  id: string;
  team_id: string;
  type: string;
  title: string | null;
  opponent: string | null;
  session_date: string;
  location: string | null;
  coach_notes: string | null;
}

interface RawPlayer {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface RawCalc {
  result_json: PlaytimeResult;
}

interface RawStats {
  score_for: number | null;
  score_against: number | null;
  potm_player_id: string | null;
  attendance_count: number | null;
  notes: string | null;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return `${date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} at ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

function sessionTitle(session: RawSession): string {
  if (session.type === 'match') return `vs ${session.opponent ?? 'Opponent TBC'}`;
  return session.title ?? session.opponent ?? session.type;
}

function playerName(player: RawPlayer): string {
  return [player.first_name, player.last_name].map((part) => part?.trim()).filter(Boolean).join(' ') || 'Player';
}

export default async function CoachPastSessionPage({ params }: PastSessionPageProps) {
  const coachData = await getCoachData();
  if (!coachData) redirect('/dashboard/coach/welcome');
  const supabase = await createClient();
  const { data: session } = await supabase
    .from('sessions')
    .select('id,team_id,type,title,opponent,session_date,location,coach_notes')
    .eq('id', params.sessionId)
    .maybeSingle<RawSession>();
  if (!session || !coachData.teams.some((team) => team.id === session.team_id)) notFound();

  const [{ data: playersData }, { data: calcData }, { data: statsData }] = await Promise.all([
    supabase.from('players').select('id,first_name,last_name').eq('team_id', session.team_id).eq('is_active', true).order('first_name', { ascending: true }),
    supabase.from('playtime_calculations').select('result_json').eq('session_id', session.id).order('created_at', { ascending: false }).limit(1).maybeSingle<RawCalc>(),
    supabase.from('match_stats').select('score_for,score_against,potm_player_id,attendance_count,notes').eq('session_id', session.id).maybeSingle<RawStats>()
  ]);
  const players = (playersData ?? []) as RawPlayer[];
  const team = coachData.teams.find((item) => item.id === session.team_id);
  const primaryColour = team?.club_primary_colour ?? '#00C851';
  const potmName = players.find((player) => player.id === statsData?.potm_player_id);

  return (
    <main className="min-h-screen px-5 pb-24 pt-8 text-white md:ml-[260px]" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[900px]">
        <Link href="/dashboard/coach/past-fixtures" className="text-sm text-white/40 transition-all duration-300 ease-out hover:text-white">Back to past fixtures</Link>
        <header className="mt-6 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-xs uppercase tracking-[0.28em] text-white/30">{session.type}</p>
          <h1 className="mt-2 text-3xl font-black">{sessionTitle(session)}</h1>
          <p className="mt-2 text-sm text-white/40">{formatDate(session.session_date)} · {session.location ?? 'Location TBC'}</p>
        </header>

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border p-5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-xs uppercase tracking-[0.24em] text-white/30">Overview</p>
            <p className="mt-3 text-sm text-white/45">{session.coach_notes ?? 'No coach notes saved.'}</p>
            <p className="mt-4 text-sm text-white/35">Attendance: {statsData?.attendance_count ?? 'Not set'}</p>
          </article>

          <article className="rounded-2xl border p-5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-xs uppercase tracking-[0.24em] text-white/30">Playtime Calc</p>
            {calcData?.result_json ? (
              <>
                <p className="mt-3 text-4xl font-black" style={{ color: primaryColour }}>{calcData.result_json.fair_share_minutes}</p>
                <p className="text-sm text-white/40">minutes per player</p>
                <Link href={`/dashboard/coach/sessions/${session.id}/playtime/result`} className="mt-4 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-white">View saved result</Link>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm text-white/40">No saved result yet.</p>
                <Link href={`/dashboard/coach/sessions/${session.id}/playtime`} className="mt-4 inline-flex rounded-full px-4 py-2 text-sm font-semibold text-black" style={{ backgroundColor: primaryColour }}>Calculate now</Link>
              </>
            )}
          </article>

          <article className="rounded-2xl border p-5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-xs uppercase tracking-[0.24em] text-white/30">Match Stats</p>
            <p className="mt-3 text-3xl font-black text-white">{statsData?.score_for ?? '-'} - {statsData?.score_against ?? '-'}</p>
            <p className="mt-2 text-sm text-white/40">POTM: {potmName ? playerName(potmName) : 'Not set'}</p>
            <p className="mt-2 text-sm text-white/35">{statsData?.notes ?? 'Goalscorers and detailed stats can be added here next.'}</p>
          </article>
        </section>
      </div>
    </main>
  );
}

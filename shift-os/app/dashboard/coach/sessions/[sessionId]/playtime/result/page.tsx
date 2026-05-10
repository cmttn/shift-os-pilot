import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCoachData } from '@/lib/dashboard/getCoachData';
import { createClient } from '@/lib/supabase/server';
import { formatMinutes, type PlaytimeResult } from '@/lib/tools/playtimeCalculator';

interface ResultPageProps {
  params: {
    sessionId: string;
  };
}

interface RawCalculation {
  id: string;
  session_id: string;
  total_minutes: number;
  format: string;
  periods: number;
  fair_share_minutes: number;
  result_json: PlaytimeResult;
  created_at: string | null;
}

interface RawSession {
  id: string;
  team_id: string;
  type: string;
  title: string | null;
  opponent: string | null;
  session_date: string;
}

function sessionTitle(session: RawSession): string {
  if (session.type === 'match') return `vs ${session.opponent ?? 'Opponent TBC'}`;
  return session.title ?? session.opponent ?? session.type;
}

export default async function PlaytimeResultPage({ params }: ResultPageProps) {
  const coachData = await getCoachData();
  if (!coachData) redirect('/dashboard/coach/welcome');
  const supabase = await createClient();
  const { data: session } = await supabase
    .from('sessions')
    .select('id,team_id,type,title,opponent,session_date')
    .eq('id', params.sessionId)
    .maybeSingle<RawSession>();
  if (!session || !coachData.teams.some((team) => team.id === session.team_id)) notFound();

  const { data: calculation } = await supabase
    .from('playtime_calculations')
    .select('id,session_id,total_minutes,format,periods,fair_share_minutes,result_json,created_at')
    .eq('session_id', params.sessionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<RawCalculation>();

  const team = coachData.teams.find((item) => item.id === session.team_id);
  const primaryColour = team?.club_primary_colour ?? '#00C851';

  return (
    <main className="min-h-screen px-5 pb-20 pt-8 text-white" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[680px]">
        <Link href={`/dashboard/coach/sessions/${params.sessionId}/playtime`} className="text-sm text-white/40 transition-all duration-300 ease-out hover:text-white">Back to calculator</Link>
        <header className="mt-6">
          <p className="text-xs uppercase tracking-[0.28em] text-white/30">Saved Playtime Result</p>
          <h1 className="mt-2 text-3xl font-black">{sessionTitle(session)}</h1>
        </header>

        {!calculation ? (
          <section className="mt-6 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="text-xl font-bold">No saved calculation yet</h2>
            <p className="mt-2 text-sm text-white/40">Run the playtime calculator for this session to save a touchline plan.</p>
            <Link href={`/dashboard/coach/sessions/${params.sessionId}/playtime`} className="mt-5 inline-flex rounded-full px-5 py-3 text-sm font-semibold text-black" style={{ backgroundColor: primaryColour }}>Calculate now</Link>
          </section>
        ) : (
          <>
            <section className="mt-6 rounded-2xl border p-6 text-center" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="text-xs uppercase tracking-[0.24em] text-white/35">Fair Play Time</p>
              <p className="mt-3 text-6xl font-black" style={{ color: primaryColour }}>{calculation.result_json.fair_share_minutes}</p>
              <p className="mt-1 text-sm text-white/40">minutes per player ({formatMinutes(calculation.result_json.fair_share_minutes)})</p>
              <p className="mt-4 text-sm text-white/45">{calculation.result_json.goalkeeper_rule_applied}</p>
            </section>

            <section className="mt-5 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <h2 className="text-xl font-bold">Player Breakdown</h2>
              <div className="mt-4 space-y-2">
                {calculation.result_json.allocations.map((allocation) => (
                  <article key={allocation.player_id} className="rounded-xl bg-white/[0.03] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-white">{allocation.player_name}</span>
                      <span className="font-bold" style={{ color: primaryColour }}>{allocation.total_minutes} mins</span>
                    </div>
                    {allocation.is_goalkeeper ? <p className="mt-1 text-xs text-white/35">{allocation.goal_minutes} goal + {allocation.outfield_minutes} outfield = {allocation.total_minutes} total</p> : null}
                  </article>
                ))}
              </div>
            </section>

            {calculation.result_json.substitution_order.length > 0 ? (
              <section className="mt-5 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <h2 className="text-xl font-bold">Substitution Order</h2>
                <p className="mt-1 text-xs text-white/35">Show this to your assistant on the touchline.</p>
                <div className="mt-4 space-y-2">
                  {calculation.result_json.substitution_order.map((event, index) => (
                    <p key={`${event.minute}-${event.player_on_id}-${index}`} className="rounded-xl bg-white/[0.03] p-3 text-sm text-white/70">
                      <strong style={{ color: primaryColour }}>Min {event.minute}</strong> - {event.reason === 'gk_swap' ? `GK SWAP: ${event.player_off_name} leaves goal · ${event.player_on_name} enters goal` : `${event.player_off_name} OFF → ${event.player_on_name} ON`}
                    </p>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}

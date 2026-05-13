import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCategoryMeta, getCurrentSeason, MILESTONES, type MilestoneId } from '@/lib/tools/starCategories';

interface GoalsPageProps {
  params: {
    playerId: string;
  };
}

interface PlayerRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface TotalRow {
  season: string;
  total_stars: number | null;
  potm_stars: number | null;
  enjoyment_stars: number | null;
  effort_stars: number | null;
  teamwork_stars: number | null;
  bravery_stars: number | null;
  attitude_stars: number | null;
}

interface GoalRow {
  id: string;
  stars_awarded: number;
  category: string;
  awarded_at: string | null;
}

interface MilestoneRow {
  milestone_id: MilestoneId;
  opponent: string | null;
  session_date: string | null;
  achieved_at: string | null;
}

function fullName(player: PlayerRow): string {
  return [player.first_name, player.last_name].map((part) => part?.trim()).filter(Boolean).join(' ') || 'Player';
}

function firstName(player: PlayerRow): string {
  return player.first_name?.trim() || fullName(player).split(' ')[0] || 'Player';
}

function formatDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function milestoneLabel(id: string): string {
  return MILESTONES.find((milestone) => milestone.id === id)?.label ?? id;
}

export default async function ChildGoalsPage({ params }: GoalsPageProps) {
  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) redirect('/auth/login');

  const { data: player } = await supabase
    .from('players')
    .select('id,first_name,last_name')
    .eq('id', params.playerId)
    .or(`parent_user_id.eq.${user.id},co_parent_user_id.eq.${user.id}`)
    .maybeSingle<PlayerRow>();
  if (!player) redirect('/dashboard/parent');

  const season = getCurrentSeason();
  const [{ data: total }, { data: recentGoals }, { data: allTotals }, { data: milestoneRows }] = await Promise.all([
    supabase.from('player_star_totals').select('season,total_stars,potm_stars,enjoyment_stars,effort_stars,teamwork_stars,bravery_stars,attitude_stars').eq('player_id', player.id).eq('season', season).maybeSingle<TotalRow>(),
    supabase.from('player_stars').select('id,stars_awarded,category,awarded_at').eq('player_id', player.id).eq('season', season).order('awarded_at', { ascending: false }).limit(5),
    supabase.from('player_star_totals').select('season,total_stars').eq('player_id', player.id).order('season', { ascending: false }),
    supabase.from('player_milestone_achievements').select('milestone_id,opponent,session_date,achieved_at').eq('player_id', player.id).order('achieved_at', { ascending: false })
  ]);

  const totalGoals = total?.total_stars ?? 0;
  const goalBreakdown = [
    { label: getCategoryMeta('instructions').label, goals: total?.attitude_stars ?? 0 },
    { label: getCategoryMeta('teammate').label, goals: total?.teamwork_stars ?? 0 },
    { label: getCategoryMeta('enjoyment').label, goals: total?.enjoyment_stars ?? 0 },
    { label: getCategoryMeta('bravery').label, goals: total?.bravery_stars ?? 0 },
    { label: getCategoryMeta('effort').label, goals: total?.effort_stars ?? 0 }
  ].sort((a, b) => b.goals - a.goals);
  const milestones = (milestoneRows ?? []) as MilestoneRow[];

  return (
    <main className="min-h-screen px-5 pb-12 pt-8 text-white" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[520px]">
        <header>
          <h1 className="text-3xl font-black">{firstName(player)}&apos;s Goals</h1>
          <p className="mt-1 text-sm text-white/40">Season {season}</p>
        </header>

        <section className="mt-8 rounded-2xl border border-white/[0.06] p-6 text-center" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)' }}>
          <p className="text-5xl font-black text-white">{totalGoals}</p>
          <p className="mt-2 text-sm text-white/40">goals this season</p>
          {(total?.potm_stars ?? 0) > 0 ? <p className="mt-4 rounded-full border border-white/[0.08] px-4 py-2 text-sm text-white/55">Player of the Match: {total?.potm_stars ?? 0} goals</p> : null}
        </section>

        <section className="mt-8 border-t border-white/[0.06] pt-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.24em] text-white/35">Goal breakdown</h2>
          <div className="mt-4 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.06]" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)' }}>
            {goalBreakdown.map((item) => (
              <p key={item.label} className="flex justify-between gap-4 px-4 py-3 text-sm">
                <span className="text-white/70">{item.label}</span>
                <span className="font-semibold text-white">{item.goals} goals</span>
              </p>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xs font-bold uppercase tracking-[0.24em] text-white/35">Recent goals</h2>
          <div className="mt-4 space-y-3">
            {((recentGoals ?? []) as GoalRow[]).length === 0 ? (
              <p className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 text-sm text-white/45">No goals logged yet.</p>
            ) : ((recentGoals ?? []) as GoalRow[]).map((goal) => (
              <article key={goal.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                <p className="font-semibold text-white">{goal.stars_awarded} goals - {getCategoryMeta(goal.category).label}</p>
                <p className="mt-1 text-xs text-white/35">{formatDate(goal.awarded_at)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xs font-bold uppercase tracking-[0.24em] text-white/35">Milestones</h2>
          <div className="mt-4 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            {milestones.length === 0 ? (
              <p className="px-4 py-3 text-xs text-white/20">No milestones yet</p>
            ) : milestones.map((milestone) => (
              <article key={`${milestone.milestone_id}-${milestone.achieved_at ?? ''}`} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{milestoneLabel(milestone.milestone_id)}</p>
                  <p className="mt-0.5 text-xs text-white/35">vs {milestone.opponent ?? 'Match'} | {formatDate(milestone.session_date ?? milestone.achieved_at)}</p>
                </div>
                <p className="shrink-0 text-xs text-emerald-400/60">+3 goals</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xs font-bold uppercase tracking-[0.24em] text-white/35">Past seasons</h2>
          <div className="mt-4 space-y-2">
            {((allTotals ?? []) as Array<{ season: string; total_stars: number | null }>).map((row) => (
              <p key={row.season} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-sm text-white/55">
                Season {row.season}: <span className="font-semibold text-white">{row.total_stars ?? 0} goals</span>
              </p>
            ))}
          </div>
        </section>

        <Link href="/dashboard/parent" className="mt-8 block text-center text-sm text-white/35">Back to parent dashboard</Link>
      </div>
    </main>
  );
}

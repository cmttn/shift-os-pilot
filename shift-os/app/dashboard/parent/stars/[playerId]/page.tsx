import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCategoryMeta, getCurrentSeason, isOffSeason, isPreSeason, MILESTONES, nextMilestone, STAR_CATEGORIES, type StarCategory } from '@/lib/tools/starCategories';

interface StarsPageProps {
  params: {
    playerId: string;
  };
}

interface PlayerRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  team_id: string | null;
}

interface TeamRow {
  id: string;
  club_id: string | null;
}

interface ClubRow {
  badge_url: string | null;
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
  special_stars: number | null;
  milestones_reached: unknown;
}

interface StarRow {
  id: string;
  stars_awarded: number;
  category: StarCategory;
  parent_message: string | null;
  awarded_at: string | null;
}

function fullName(player: PlayerRow): string {
  return [player.first_name, player.last_name].map((part) => part?.trim()).filter(Boolean).join(' ') || 'Player';
}

function firstName(player: PlayerRow): string {
  return player.first_name?.trim() || fullName(player).split(' ')[0] || 'Player';
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function formatDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default async function ChildStarsPage({ params }: StarsPageProps) {
  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) redirect('/auth/login');

  const { data: player } = await supabase.from('players').select('id,first_name,last_name,team_id').eq('id', params.playerId).eq('parent_user_id', user.id).maybeSingle<PlayerRow>();
  if (!player) redirect('/dashboard/parent');

  const season = getCurrentSeason();
  const [{ data: total }, { data: recentStars }, { data: allTotals }, { data: team }] = await Promise.all([
    supabase.from('player_star_totals').select('season,total_stars,potm_stars,enjoyment_stars,effort_stars,teamwork_stars,bravery_stars,attitude_stars,special_stars,milestones_reached').eq('player_id', player.id).eq('season', season).maybeSingle<TotalRow>(),
    supabase.from('player_stars').select('id,stars_awarded,category,parent_message,awarded_at').eq('player_id', player.id).eq('season', season).order('awarded_at', { ascending: false }).limit(5),
    supabase.from('player_star_totals').select('season,total_stars').eq('player_id', player.id).order('season', { ascending: false }),
    player.team_id ? supabase.from('teams').select('id,club_id').eq('id', player.team_id).maybeSingle<TeamRow>() : Promise.resolve({ data: null })
  ]);
  const { data: club } = team?.club_id ? await supabase.from('clubs').select('badge_url').eq('id', team.club_id).maybeSingle<ClubRow>() : { data: null };
  const totalStars = total?.total_stars ?? 0;
  const reachedMilestones = stringArray(total?.milestones_reached);
  const next = nextMilestone(totalStars);
  const categoryValues = [
    { category: 'enjoyment' as StarCategory, stars: total?.enjoyment_stars ?? 0 },
    { category: 'effort' as StarCategory, stars: total?.effort_stars ?? 0 },
    { category: 'teamwork' as StarCategory, stars: total?.teamwork_stars ?? 0 },
    { category: 'bravery' as StarCategory, stars: total?.bravery_stars ?? 0 },
    { category: 'attitude' as StarCategory, stars: total?.attitude_stars ?? 0 },
    { category: 'special' as StarCategory, stars: total?.special_stars ?? 0 }
  ].sort((a, b) => b.stars - a.stars);

  return (
    <main className="min-h-screen px-5 pb-12 pt-8 text-[#fff7ed]" style={{ backgroundColor: '#0f0d09' }}>
      <div className="mx-auto max-w-[520px]">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black">{firstName(player)}&apos;s Stars</h1>
            <p className="mt-1 text-sm text-amber-100/55">Season {season}</p>
          </div>
          {club?.badge_url ? <img src={club.badge_url} alt="" className="h-12 w-12 rounded-full object-cover" /> : <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-xl">⭐</span>}
        </header>

        <section className="mt-8 rounded-[2rem] border p-8 text-center shadow-[0_0_24px_rgba(245,158,11,0.15)]" style={{ backgroundColor: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }}>
          <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full border-4 border-amber-400 bg-gradient-to-br from-amber-400/20 to-orange-500/20">
            <span className="text-6xl font-black text-amber-300">{totalStars}</span>
          </div>
          <p className="mt-4 text-lg font-bold">⭐ stars this season</p>
          {isOffSeason() ? <p className="mt-2 text-sm text-amber-100/55">Come back in September for a fresh start!</p> : null}
          {isPreSeason() ? <p className="mt-2 inline-flex rounded-full bg-amber-400/10 px-3 py-1 text-sm text-amber-200">Pre-season stars ✨</p> : null}
          {next ? <p className="mt-2 text-sm text-amber-100/55">Keep going — {next.label} at {next.stars} stars!</p> : <p className="mt-2 text-sm text-amber-100/55">Hall of Fame energy. Keep smiling.</p>}
          {(total?.potm_stars ?? 0) > 0 ? <p className="mt-4 inline-flex rounded-full bg-amber-400/15 px-4 py-2 text-sm font-semibold text-amber-200">🏆 {total?.potm_stars} POTM stars</p> : null}
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-black">Category Breakdown</h2>
          <div className="mt-4 space-y-3">
            {categoryValues.map(({ category, stars }) => {
              const meta = getCategoryMeta(category);
              const width = totalStars > 0 ? Math.max(6, Math.round((stars / totalStars) * 100)) : 0;
              return (
                <div key={category} className="rounded-3xl bg-amber-400/5 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span>{meta.emoji} {meta.label}</span>
                    <span>{stars} ⭐</span>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: meta.colour }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-black">Recent Stars</h2>
          <div className="mt-4 space-y-3">
            {((recentStars ?? []) as StarRow[]).length === 0 ? <p className="rounded-3xl bg-amber-400/5 p-5 text-sm text-amber-100/55">No stars yet. The first one will feel magic.</p> : ((recentStars ?? []) as StarRow[]).map((star) => {
              const meta = getCategoryMeta(star.category);
              return <article key={star.id} className="rounded-3xl bg-amber-400/5 p-4"><p className="text-3xl">{meta.emoji}</p><p className="mt-2 font-black">{star.stars_awarded} ⭐ · {meta.label}</p><p className="text-xs text-amber-100/45">{formatDate(star.awarded_at)}</p>{star.parent_message ? <p className="mt-2 text-sm italic text-amber-100/70">“{star.parent_message}”</p> : null}</article>;
            })}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-black">Milestones</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {MILESTONES.map((milestone) => {
              const reached = reachedMilestones.includes(milestone.label) || totalStars >= milestone.stars;
              return <div key={milestone.label} className={`rounded-3xl p-4 text-center ${reached ? 'bg-amber-400/15' : 'bg-white/5 opacity-45'}`}><p className="text-3xl">{milestone.emoji}</p><p className="mt-2 text-sm font-black">{milestone.label}</p><p className="text-xs text-amber-100/45">{milestone.stars} stars</p></div>;
            })}
          </div>
          {next ? <p className="mt-4 text-center text-sm text-amber-100/55">{next.stars - totalStars} more stars to reach {next.label}!</p> : null}
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-black">Past Seasons</h2>
          <div className="mt-4 space-y-2">
            {((allTotals ?? []) as Array<{ season: string; total_stars: number | null }>).map((row) => <details key={row.season} className="rounded-2xl bg-amber-400/5 p-4"><summary className="cursor-pointer font-semibold">{row.season} · {row.total_stars ?? 0} stars</summary><p className="mt-2 text-sm text-amber-100/50">Season card coming soon.</p></details>)}
          </div>
        </section>

        <Link href="/dashboard/parent" className="mt-8 block text-center text-sm text-amber-100/45">Back to parent dashboard</Link>
      </div>
    </main>
  );
}

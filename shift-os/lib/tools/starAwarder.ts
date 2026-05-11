import type { SupabaseClient } from '@supabase/supabase-js';
import { MILESTONES, getCurrentSeason, isPreSeason, type StarCategory } from '@/lib/tools/starCategories';

interface AwardStarsInput {
  player_id: string;
  parent_user_id: string;
  session_id: string | null;
  stars: number;
  category: StarCategory;
  parent_message: string | null;
  supabase: SupabaseClient;
}

interface AwardStarsResult {
  success: boolean;
  new_total: number;
  milestone_reached: string | null;
}

interface StarTotalRow {
  id: string;
  total_stars: number | null;
  potm_stars: number | null;
  parent_stars: number | null;
  enjoyment_stars: number | null;
  effort_stars: number | null;
  teamwork_stars: number | null;
  bravery_stars: number | null;
  attitude_stars: number | null;
  special_stars: number | null;
  milestones_reached: unknown;
  milestone_celebration_pending: unknown;
}

type CategoryColumn = 'enjoyment_stars' | 'effort_stars' | 'teamwork_stars' | 'bravery_stars' | 'attitude_stars' | 'special_stars';

const categoryColumnMap: Partial<Record<StarCategory, CategoryColumn>> = {
  enjoyment: 'enjoyment_stars',
  effort: 'effort_stars',
  teamwork: 'teamwork_stars',
  bravery: 'bravery_stars',
  attitude: 'attitude_stars',
  special: 'special_stars'
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function getTopCategory(next: Record<CategoryColumn, number>): string | null {
  const entries = Object.entries(next) as Array<[CategoryColumn, number]>;
  const top = entries.sort((a, b) => b[1] - a[1])[0];
  if (!top || top[1] <= 0) return null;
  return top[0].replace('_stars', '');
}

export async function awardStars(input: AwardStarsInput): Promise<AwardStarsResult> {
  const season = getCurrentSeason();
  const stars = Math.max(1, Math.min(10, input.stars));

  const { error: insertError } = await input.supabase.from('player_stars').insert({
    player_id: input.player_id,
    parent_user_id: input.parent_user_id,
    session_id: input.session_id,
    stars_awarded: stars,
    category: input.category,
    parent_message: input.parent_message,
    season,
    is_pre_season: isPreSeason()
  });

  if (insertError) {
    return { success: false, new_total: 0, milestone_reached: null };
  }

  const { data: existing } = await input.supabase
    .from('player_star_totals')
    .select('id,total_stars,potm_stars,parent_stars,enjoyment_stars,effort_stars,teamwork_stars,bravery_stars,attitude_stars,special_stars,milestones_reached,milestone_celebration_pending')
    .eq('player_id', input.player_id)
    .eq('season', season)
    .maybeSingle<StarTotalRow>();

  const previousTotal = existing?.total_stars ?? 0;
  const newTotal = previousTotal + stars;
  const categoryTotals: Record<CategoryColumn, number> = {
    enjoyment_stars: existing?.enjoyment_stars ?? 0,
    effort_stars: existing?.effort_stars ?? 0,
    teamwork_stars: existing?.teamwork_stars ?? 0,
    bravery_stars: existing?.bravery_stars ?? 0,
    attitude_stars: existing?.attitude_stars ?? 0,
    special_stars: existing?.special_stars ?? 0
  };
  const categoryColumn = categoryColumnMap[input.category];
  if (categoryColumn) {
    categoryTotals[categoryColumn] += stars;
  }

  const reached = toStringArray(existing?.milestones_reached);
  const pending = toStringArray(existing?.milestone_celebration_pending);
  const milestone = MILESTONES.find((item) => previousTotal < item.stars && newTotal >= item.stars) ?? null;
  const reachedLabels = milestone && !reached.includes(milestone.label) ? [...reached, milestone.label] : reached;
  const pendingLabels = milestone && !pending.includes(milestone.label) ? [...pending, milestone.label] : pending;

  const payload = {
    player_id: input.player_id,
    season,
    total_stars: newTotal,
    potm_stars: (existing?.potm_stars ?? 0) + (input.category === 'potm' ? stars : 0),
    parent_stars: (existing?.parent_stars ?? 0) + (input.category === 'potm' ? 0 : stars),
    enjoyment_stars: categoryTotals.enjoyment_stars,
    effort_stars: categoryTotals.effort_stars,
    teamwork_stars: categoryTotals.teamwork_stars,
    bravery_stars: categoryTotals.bravery_stars,
    attitude_stars: categoryTotals.attitude_stars,
    special_stars: categoryTotals.special_stars,
    top_category: getTopCategory(categoryTotals),
    milestones_reached: reachedLabels,
    milestone_celebration_pending: pendingLabels,
    updated_at: new Date().toISOString()
  };

  const { error: upsertError } = await input.supabase.from('player_star_totals').upsert(payload, { onConflict: 'player_id,season' });
  if (upsertError) {
    return { success: false, new_total: previousTotal, milestone_reached: null };
  }

  return { success: true, new_total: newTotal, milestone_reached: milestone?.label ?? null };
}

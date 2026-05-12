export const STAR_CATEGORIES = [
  { id: 'instructions', label: "Follow the coach's instructions", colour: '#3b82f6' },
  { id: 'teammate', label: 'Be a good teammate', colour: '#10b981' },
  { id: 'enjoyment', label: 'Enjoy every moment', colour: '#f59e0b' },
  { id: 'bravery', label: 'Try something brave', colour: '#8b5cf6' },
  { id: 'effort', label: "Give everything you've got", colour: '#ef4444' },
  { id: 'potm', label: 'Player of the Match', colour: '#f59e0b' }
] as const;

export type StarCategory = typeof STAR_CATEGORIES[number]['id'];
export type ParentStarCategory = Exclude<StarCategory, 'potm'>;

export const MILESTONES = [
  { id: 'first_goal', label: 'First goal scored', goals: 3 },
  { id: 'first_assist', label: 'First assist', goals: 3 },
  { id: 'first_hatrick', label: 'First hat trick', goals: 3 },
  { id: 'first_penalty_saved', label: 'First penalty saved', goals: 3 },
  { id: 'first_clearance', label: 'First goal line clearance', goals: 3 },
  { id: 'first_tackle', label: 'First goal saving tackle', goals: 3 },
  { id: 'first_top_bins', label: 'First top bins', goals: 3 },
  { id: 'first_rounding', label: 'First time rounding the keeper', goals: 3 },
  { id: 'first_skill', label: 'First skill move in a game', goals: 3 }
] as const;

export type MilestoneId = typeof MILESTONES[number]['id'];

export function getCurrentSeason(): string {
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  if (month >= 9) return `${year}-${String(year + 1).slice(2)}`;
  if (month <= 6) return `${year - 1}-${String(year).slice(2)}`;
  return 'off-season';
}

export function isPreSeason(): boolean {
  return new Date().getMonth() + 1 === 8;
}

export function isOffSeason(): boolean {
  return new Date().getMonth() + 1 === 7;
}

export function getCategoryMeta(category: StarCategory | string) {
  const legacyMap: Record<string, ParentStarCategory> = {
    teamwork: 'teammate',
    attitude: 'enjoyment',
    special: 'effort'
  };
  return STAR_CATEGORIES.find((item) => item.id === (legacyMap[category] ?? category)) ?? STAR_CATEGORIES[0];
}

export function nextMilestone(_totalGoals: number) {
  return null;
}

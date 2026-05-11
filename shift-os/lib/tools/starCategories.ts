export const STAR_CATEGORIES = [
  { id: 'enjoyment', label: 'Play with a smile', emoji: '😊', colour: '#f59e0b' },
  { id: 'effort', label: 'Give everything', emoji: '💪', colour: '#ef4444' },
  { id: 'teamwork', label: 'Be a good teammate', emoji: '🤝', colour: '#3b82f6' },
  { id: 'bravery', label: 'Try something brave', emoji: '🎯', colour: '#8b5cf6' },
  { id: 'attitude', label: 'Enjoy every moment', emoji: '⭐', colour: '#10b981' },
  { id: 'special', label: 'Something special', emoji: '🌟', colour: '#f97316' },
  { id: 'potm', label: 'Player of the Match', emoji: '🏆', colour: '#f59e0b' }
] as const;

export type StarCategory = typeof STAR_CATEGORIES[number]['id'];
export type ParentStarCategory = Exclude<StarCategory, 'potm'>;

export const MILESTONES = [
  { stars: 5, label: 'First Stars!', emoji: '🌟', colour: '#f59e0b' },
  { stars: 10, label: 'Rising Star', emoji: '⭐', colour: '#f59e0b' },
  { stars: 25, label: 'Star Player', emoji: '💫', colour: '#f97316' },
  { stars: 50, label: 'Superstar', emoji: '🌠', colour: '#8b5cf6' },
  { stars: 100, label: 'Legend', emoji: '🏆', colour: '#ef4444' },
  { stars: 150, label: 'Hall of Fame', emoji: '👑', colour: '#f59e0b' }
] as const;

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

export function getCategoryMeta(category: StarCategory) {
  return STAR_CATEGORIES.find((item) => item.id === category) ?? STAR_CATEGORIES[0];
}

export function nextMilestone(totalStars: number) {
  return MILESTONES.find((milestone) => milestone.stars > totalStars) ?? null;
}

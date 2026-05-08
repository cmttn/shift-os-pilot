import { createClient } from '@/lib/supabase/server';

export interface ClubRecord {
  id: string;
  name: string;
  ethos: string | null;
  badge_url: string | null;
  primary_colour: string;
  secondary_colour: string;
  plan_tier: 'free' | 'pro' | string;
}

export interface TeamRecord {
  id: string;
  name: string;
  age_group: string | null;
  coach_name: string | null;
  player_count: number;
}

export interface FixtureRecord {
  id: string;
  fixture_date: string;
  opponent: string;
  home_away: 'home' | 'away' | string;
  team_name: string;
}

export interface ClubDashboardData {
  userId: string;
  firstName: string;
  club: ClubRecord;
  teams: TeamRecord[];
  fixtures: FixtureRecord[];
  totalPlayers: number;
  totalCoaches: number;
}

export async function getClubData(): Promise<ClubDashboardData | null> {
  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;

  if (!session) return null;

  const { data: membership } = await supabase
    .from('club_members')
    .select('club_id, clubs(id,name,ethos,badge_url,primary_colour,secondary_colour,plan_tier)')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .maybeSingle();

  const membershipClub = membership?.clubs;
  const club = (Array.isArray(membershipClub) ? membershipClub[0] : membershipClub) as ClubRecord | null;
  if (!club) return null;

  const [teamsRes, fixturesRes, playersCountRes, coachesCountRes] = await Promise.all([
    supabase
      .from('teams')
      .select('id,name,age_group,coach_name,player_count')
      .eq('club_id', club.id)
      .order('name', { ascending: true }),
    supabase
      .from('fixtures')
      .select('id,fixture_date,opponent,home_away,team_name')
      .eq('club_id', club.id)
      .order('fixture_date', { ascending: true }),
    supabase.from('players').select('*', { count: 'exact', head: true }).eq('club_id', club.id),
    supabase.from('coaches').select('*', { count: 'exact', head: true }).eq('club_id', club.id)
  ]);

  const fullName = typeof session.user.user_metadata.full_name === 'string' ? session.user.user_metadata.full_name.trim() : '';

  return {
    userId: session.user.id,
    firstName: fullName.length > 0 ? fullName.split(' ')[0] : 'Coach',
    club,
    teams: teamsRes.data ?? [],
    fixtures: fixturesRes.data ?? [],
    totalPlayers: playersCountRes.count ?? 0,
    totalCoaches: coachesCountRes.count ?? 0
  };
}

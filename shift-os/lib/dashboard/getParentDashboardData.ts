import { createClient } from '@/lib/supabase/server';
import type { ClubRecord, FixtureRecord } from '@/lib/dashboard/getClubData';

export interface ParentPlayerRecord {
  id: string;
  club_id: string;
  team_id: string | null;
  full_name: string;
  age_group: string | null;
  guardian_1_email: string | null;
  guardian_2_email: string | null;
}

export interface ParentTeamRecord {
  id: string;
  name: string;
  age_group: string | null;
  gender: string | null;
  league: string | null;
  season: string | null;
}

export interface ParentDashboardData {
  userId: string;
  firstName: string;
  email: string;
  club: ClubRecord;
  players: ParentPlayerRecord[];
  teams: ParentTeamRecord[];
  fixtures: FixtureRecord[];
}

interface RawParentProfile {
  full_name: string | null;
}

export async function getParentDashboardData(): Promise<ParentDashboardData | null> {
  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  const email = session?.user.email?.toLowerCase() ?? '';

  if (!session || !email) return null;

  const [profileRes, playersRes] = await Promise.all([
    supabase.from('users_profile').select('full_name').eq('id', session.user.id).maybeSingle(),
    supabase
      .from('players')
      .select('id,club_id,team_id,full_name,age_group,guardian_1_email,guardian_2_email')
      .or(`guardian_1_email.ilike.${email},guardian_2_email.ilike.${email}`)
      .eq('is_active', true)
      .order('full_name', { ascending: true })
  ]);

  const players = (playersRes.data ?? []) as ParentPlayerRecord[];
  const firstPlayer = players[0] ?? null;
  if (!firstPlayer) return null;

  const clubId = firstPlayer.club_id;
  const teamIds = Array.from(new Set(players.map((player) => player.team_id).filter((teamId): teamId is string => Boolean(teamId))));

  const [clubRes, teamsRes] = await Promise.all([
    supabase.from('clubs').select('id,name,ethos,badge_url,primary_colour,secondary_colour,plan_tier').eq('id', clubId).maybeSingle(),
    teamIds.length > 0
      ? supabase.from('teams').select('id,name,age_group,gender,league,season').eq('club_id', clubId).in('id', teamIds).order('name', { ascending: true })
      : Promise.resolve({ data: [] as ParentTeamRecord[] })
  ]);

  const club = clubRes.data as ClubRecord | null;
  const teams = (teamsRes.data ?? []) as ParentTeamRecord[];
  if (!club) return null;

  const teamNames = teams.map((team) => team.name);
  const { data: fixturesData } =
    teamNames.length > 0
      ? await supabase.from('fixtures').select('id,fixture_date,opponent,home_away,team_name').eq('club_id', club.id).in('team_name', teamNames).order('fixture_date', { ascending: true })
      : { data: [] as FixtureRecord[] };

  const profile = profileRes.data as RawParentProfile | null;
  const fullName = profile?.full_name?.trim() ?? '';

  return {
    userId: session.user.id,
    firstName: fullName.length > 0 ? fullName.split(' ')[0] : 'there',
    email,
    club,
    players,
    teams,
    fixtures: (fixturesData ?? []) as FixtureRecord[]
  };
}

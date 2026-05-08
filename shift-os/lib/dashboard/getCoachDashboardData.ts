import { createClient } from '@/lib/supabase/server';
import type { ClubRecord, FixtureRecord } from '@/lib/dashboard/getClubData';

export interface CoachTeamRecord {
  id: string;
  name: string;
  age_group: string | null;
  gender: string | null;
  league: string | null;
  season: string | null;
  player_count: number;
  is_lead: boolean;
}

export interface CoachPlayerRecord {
  id: string;
  team_id: string | null;
  full_name: string;
  age_group: string | null;
  date_of_birth: string | null;
  guardian_1_name: string | null;
  guardian_1_phone: string | null;
  guardian_1_email: string | null;
  guardian_2_name: string | null;
  guardian_2_phone: string | null;
  guardian_2_email: string | null;
}

export interface CoachDashboardData {
  userId: string;
  firstName: string;
  clubRole: string;
  club: ClubRecord;
  teams: CoachTeamRecord[];
  players: CoachPlayerRecord[];
  fixtures: FixtureRecord[];
}

interface TeamCoachRow {
  team_id: string;
  is_lead: boolean;
}

interface RawCoachTeamRecord {
  id: string;
  name: string;
  age_group: string | null;
  gender: string | null;
  league: string | null;
  season: string | null;
}

interface RawCoachPlayerRecord {
  id: string;
  team_id: string | null;
  full_name: string;
  age_group: string | null;
  date_of_birth: string | null;
  guardian_1_name: string | null;
  guardian_1_phone: string | null;
  guardian_1_email: string | null;
  guardian_2_name: string | null;
  guardian_2_phone: string | null;
  guardian_2_email: string | null;
}

export async function getCoachDashboardData(): Promise<CoachDashboardData | null> {
  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;

  if (!session) return null;

  const { data: membership } = await supabase
    .from('club_members')
    .select('club_id, club_role, clubs(id,name,ethos,badge_url,primary_colour,secondary_colour,plan_tier)')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .maybeSingle();

  const membershipClub = membership?.clubs;
  const club = (Array.isArray(membershipClub) ? membershipClub[0] : membershipClub) as ClubRecord | null;
  const clubRole = typeof membership?.club_role === 'string' ? membership.club_role : '';

  if (!club || clubRole !== 'coach') return null;

  const [profileRes, assignmentsRes] = await Promise.all([
    supabase.from('users_profile').select('full_name').eq('id', session.user.id).maybeSingle(),
    supabase.from('team_coaches').select('team_id,is_lead').eq('user_id', session.user.id)
  ]);

  const profile = profileRes.data as { full_name: string | null } | null;
  const fullName = profile?.full_name?.trim() ?? '';
  const assignments = (assignmentsRes.data ?? []) as TeamCoachRow[];
  const teamIds = assignments.map((assignment) => assignment.team_id);

  const [teamsRes, fixturesRes, playersRes] =
    teamIds.length > 0
      ? await Promise.all([
          supabase
            .from('teams')
            .select('id,name,age_group,gender,league,season')
            .eq('club_id', club.id)
            .eq('is_active', true)
            .in('id', teamIds)
            .order('name', { ascending: true }),
          supabase.from('fixtures').select('id,fixture_date,opponent,home_away,team_name').eq('club_id', club.id).order('fixture_date', { ascending: true }),
          supabase
            .from('players')
            .select('id,team_id,full_name,age_group,date_of_birth,guardian_1_name,guardian_1_phone,guardian_1_email,guardian_2_name,guardian_2_phone,guardian_2_email')
            .eq('club_id', club.id)
            .in('team_id', teamIds)
            .eq('is_active', true)
            .order('full_name', { ascending: true })
        ])
      : [
          { data: [] as RawCoachTeamRecord[] },
          { data: [] as FixtureRecord[] },
          { data: [] as RawCoachPlayerRecord[] }
        ];

  const players = (playersRes.data ?? []) as CoachPlayerRecord[];
  const rawTeams = (teamsRes.data ?? []) as RawCoachTeamRecord[];
  const teams = rawTeams.map((team) => {
    const assignment = assignments.find((item) => item.team_id === team.id);
    const playerCount = players.filter((player) => player.team_id === team.id).length;
    return {
      ...team,
      player_count: playerCount,
      is_lead: assignment?.is_lead ?? false
    };
  });
  const teamNames = new Set(teams.map((team) => team.name));
  const fixtures = ((fixturesRes.data ?? []) as FixtureRecord[]).filter((fixture) => teamNames.has(fixture.team_name));

  return {
    userId: session.user.id,
    firstName: fullName.length > 0 ? fullName.split(' ')[0] : 'Coach',
    clubRole,
    club,
    teams,
    players,
    fixtures
  };
}

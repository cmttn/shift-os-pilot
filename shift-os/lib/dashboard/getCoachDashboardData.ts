import { createClient } from '@/lib/supabase/server';
import type { ClubRecord, FixtureRecord } from '@/lib/dashboard/getClubData';

export interface CoachTeamRecord {
  id: string;
  name: string;
  age_group: string | null;
  gender: string | null;
  league: string | null;
  season: string | null;
  join_code: string | null;
  player_count: number;
  is_lead: boolean;
}

export interface CoachPlayerRecord {
  id: string;
  team_id: string | null;
  full_name: string;
  age_group: string | null;
  date_of_birth: string | null;
  parent_user_id: string | null;
  invite_token: string | null;
  invite_status: string | null;
}

export interface CoachDashboardData {
  userId: string;
  firstName: string;
  clubRole: string;
  club: ClubRecord;
  teams: CoachTeamRecord[];
  players: CoachPlayerRecord[];
  fixtures: FixtureRecord[];
  pendingRequests: PendingJoinRequestRecord[];
}

interface TeamCoachRow {
  team_id: string;
  is_lead: boolean;
}

interface RawCoachTeamRecord {
  id: string;
  club_id: string | null;
  name: string;
  age_group: string | null;
  gender: string | null;
  league: string | null;
  season: string | null;
  join_code: string | null;
}

interface RawCoachPlayerRecord {
  id: string;
  team_id: string | null;
  first_name: string | null;
  last_name: string | null;
  age_group: string | null;
  dob: string | null;
  parent_user_id: string | null;
  invite_token: string | null;
  invite_status: string | null;
}

export interface PendingJoinRequestRecord {
  id: string;
  team_id: string;
  full_name: string;
  dob: string;
  parent_name: string;
  parent_contact: string;
  created_at: string | null;
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

  const [profileRes, assignmentsRes] = await Promise.all([
    supabase.from('users_profile').select('full_name').eq('id', session.user.id).maybeSingle(),
    supabase.from('team_coaches').select('team_id,is_lead').eq('user_id', session.user.id)
  ]);

  const profile = profileRes.data as { full_name: string | null } | null;
  const fullName = profile?.full_name?.trim() ?? '';
  const assignments = (assignmentsRes.data ?? []) as TeamCoachRow[];
  const teamIds = assignments.map((assignment) => assignment.team_id);
  const clubRole = typeof membership?.club_role === 'string' ? membership.club_role : teamIds.length > 0 ? 'coach' : '';

  if (clubRole !== 'coach') return null;

  const [teamsRes, playersRes, requestsRes] =
    teamIds.length > 0
      ? await Promise.all([
          supabase
            .from('teams')
            .select('id,club_id,name,age_group,gender,league,season,join_code')
            .eq('is_active', true)
            .in('id', teamIds)
            .order('name', { ascending: true }),
          supabase
            .from('players')
            .select('id,team_id,first_name,last_name,age_group,dob,parent_user_id,invite_token,invite_status')
            .in('team_id', teamIds)
            .eq('is_active', true)
            .order('first_name', { ascending: true }),
          supabase
            .from('pending_join_requests')
            .select('id,team_id,full_name,dob,parent_name,parent_contact,created_at')
            .in('team_id', teamIds)
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
        ])
      : [
          { data: [] as RawCoachTeamRecord[] },
          { data: [] as RawCoachPlayerRecord[] },
          { data: [] as PendingJoinRequestRecord[] }
        ];

  const players = ((playersRes.data ?? []) as RawCoachPlayerRecord[]).map((player) => ({
    id: player.id,
    team_id: player.team_id,
    full_name: [player.first_name, player.last_name].map((part) => part?.trim()).filter(Boolean).join(' ') || 'Player',
    age_group: player.age_group,
    date_of_birth: player.dob,
    parent_user_id: player.parent_user_id,
    invite_token: player.invite_token,
    invite_status: player.invite_status
  }));
  const rawTeams = (teamsRes.data ?? []) as RawCoachTeamRecord[];
  const membershipClub = membership?.clubs;
  const memberClub = (Array.isArray(membershipClub) ? membershipClub[0] : membershipClub) as ClubRecord | null;
  const firstClubId = rawTeams.find((team) => team.club_id)?.club_id ?? null;
  const { data: teamClubData } =
    !memberClub && firstClubId
      ? await supabase.from('clubs').select('id,name,ethos,badge_url,primary_colour,secondary_colour,plan_tier').eq('id', firstClubId).maybeSingle()
      : { data: null };
  const club =
    memberClub ??
    ((teamClubData as ClubRecord | null) ?? {
      id: 'independent',
      name: 'Independent Team',
      ethos: 'Coach-led workspace.',
      badge_url: null,
      primary_colour: '#00C851',
      secondary_colour: '#080a0f',
      plan_tier: 'free'
    });
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
  const clubIds = Array.from(new Set(rawTeams.map((team) => team.club_id).filter((clubId): clubId is string => Boolean(clubId))));
  const { data: fixturesData } =
    clubIds.length > 0
      ? await supabase.from('fixtures').select('id,fixture_date,opponent,home_away,team_name').in('club_id', clubIds).order('fixture_date', { ascending: true })
      : { data: [] as FixtureRecord[] };
  return {
    userId: session.user.id,
    firstName: fullName.length > 0 ? fullName.split(' ')[0] : 'Coach',
    clubRole,
    club,
    teams,
    players,
    fixtures: ((fixturesData ?? []) as FixtureRecord[]).filter((fixture) => teamNames.has(fixture.team_name)),
    pendingRequests: (requestsRes.data ?? []) as PendingJoinRequestRecord[]
  };
}

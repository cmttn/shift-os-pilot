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
  gender: string | null;
  league: string | null;
  season: string | null;
  join_code: string | null;
  coach_name: string | null;
  coach_user_id: string | null;
  pending_invite: PendingCoachInvite | null;
  player_count: number;
  players: TeamPlayerSummary[];
  coach_email: string | null;
  coach_status: 'assigned' | 'pending' | 'unassigned';
}

export interface TeamPlayerSummary {
  first_name: string;
  last_name: string;
}

export interface PendingCoachInvite {
  invite_token: string;
  invitee_name: string | null;
  invitee_email: string;
  expires_at: string | null;
}

export interface FixtureRecord {
  id: string;
  fixture_date: string;
  opponent: string;
  home_away: 'home' | 'away' | string;
  team_name: string;
  type: string;
  title: string | null;
  location: string | null;
  available_count: number;
  unavailable_count: number;
  pending_count: number;
}

interface RawTeamRecord {
  id: string;
  name: string;
  age_group: string | null;
  gender: string | null;
  league: string | null;
  season: string | null;
  join_code: string | null;
}

interface LeadCoachRecord {
  team_id: string;
  user_id: string;
}

interface UserProfileRecord {
  id: string;
  full_name: string | null;
  email?: string | null;
}

interface PendingInviteRecord {
  team_id: string;
  invite_token: string;
  invitee_name: string | null;
  invitee_email: string;
  expires_at: string | null;
}

interface PlayerSummaryRecord {
  team_id: string | null;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean | null;
}

interface SessionRecord {
  id: string;
  team_id: string;
  session_date: string;
  opponent: string | null;
  title: string | null;
  type: string;
  location: string | null;
}

interface PollResponseCountRecord {
  session_id: string;
  status: 'available' | 'unavailable' | 'week_off' | 'pending' | string | null;
}

export interface ClubDashboardData {
  userId: string;
  firstName: string;
  clubRole: string;
  club: ClubRecord;
  teams: TeamRecord[];
  fixtures: FixtureRecord[];
  totalPlayers: number;
  totalCoaches: number;
  totalFixtures: number;
}

export async function getClubData(): Promise<ClubDashboardData | null> {
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
  if (!club) return null;

  const [teamsRes, profileRes] = await Promise.all([
    supabase
      .from('teams')
      .select('id,name,age_group,gender,league,season,join_code')
      .eq('club_id', club.id)
      .eq('is_active', true)
      .order('name', { ascending: true }),
    supabase.from('users_profile').select('full_name').eq('id', session.user.id).single()
  ]);

  const rawProfile = profileRes.data as { full_name: string | null } | null;
  const fullName = rawProfile?.full_name?.trim() ?? '';
  const rawTeams = (teamsRes.data ?? []) as RawTeamRecord[];
  const teamIds = rawTeams.map((team) => team.id);
  const [leadCoachesRes, pendingInvitesRes, playersRes, sessionsRes, playerCountRes, coachCountRes, fixtureCountRes] =
    teamIds.length > 0
      ? await Promise.all([
          supabase.from('team_coaches').select('team_id,user_id').in('team_id', teamIds).eq('is_lead', true),
          supabase.from('pending_invites').select('team_id,invite_token,invitee_name,invitee_email,expires_at').in('team_id', teamIds).eq('role', 'coach').eq('is_lead', true).eq('status', 'pending'),
          supabase.from('players').select('team_id,first_name,last_name,is_active').in('team_id', teamIds).eq('is_active', true),
          supabase.from('sessions').select('id,team_id,session_date,opponent,title,type,location').in('team_id', teamIds).eq('is_active', true).gt('session_date', new Date().toISOString()).order('session_date', { ascending: true }),
          supabase.from('players').select('*', { count: 'exact', head: true }).eq('is_active', true).in('team_id', teamIds),
          supabase.from('team_coaches').select('*', { count: 'exact', head: true }).in('team_id', teamIds),
          supabase.from('sessions').select('*', { count: 'exact', head: true }).in('team_id', teamIds).eq('is_active', true).gt('session_date', new Date().toISOString())
        ])
      : [
          { data: [] as LeadCoachRecord[] },
          { data: [] as PendingInviteRecord[] },
          { data: [] as PlayerSummaryRecord[] },
          { data: [] as SessionRecord[] },
          { count: 0 },
          { count: 0 },
          { count: 0 }
        ];
  const leadCoaches = (leadCoachesRes.data ?? []) as LeadCoachRecord[];
  const pendingInvites = (pendingInvitesRes.data ?? []) as PendingInviteRecord[];
  const players = (playersRes.data ?? []) as PlayerSummaryRecord[];
  const sessions = (sessionsRes.data ?? []) as SessionRecord[];
  const sessionIds = sessions.map((item) => item.id);
  const { data: pollResponseData } =
    sessionIds.length > 0
      ? await supabase.from('poll_responses').select('session_id,status').in('session_id', sessionIds)
      : { data: [] as PollResponseCountRecord[] };
  const pollResponses = (pollResponseData ?? []) as PollResponseCountRecord[];
  const coachIds = Array.from(new Set(leadCoaches.map((coach) => coach.user_id)));
  console.log('getClubData raw counts', {
    club_id: club.id,
    teams: rawTeams.length,
    players: playerCountRes.count ?? 0,
    coaches: coachCountRes.count ?? 0,
    upcoming_sessions: fixtureCountRes.count ?? 0
  });
  const { data: coachProfilesData } =
    coachIds.length > 0
      ? await supabase.from('users_profile').select('id,full_name').in('id', coachIds)
      : { data: [] as UserProfileRecord[] };
  const coachProfiles = (coachProfilesData ?? []) as UserProfileRecord[];
  const getLeadCoach = (teamId: string): LeadCoachRecord | null => leadCoaches.find((coach) => coach.team_id === teamId) ?? null;
  const getPendingInvite = (teamId: string): PendingCoachInvite | null => {
    const pendingInvite = pendingInvites.find((invite) => invite.team_id === teamId);
    if (!pendingInvite) return null;
    return {
      invite_token: pendingInvite.invite_token,
      invitee_name: pendingInvite.invitee_name,
      invitee_email: pendingInvite.invitee_email,
      expires_at: pendingInvite.expires_at
    };
  };
  const getCoachName = (teamId: string): string | null => {
    const leadCoach = leadCoaches.find((coach) => coach.team_id === teamId);
    const profile = leadCoach ? coachProfiles.find((coachProfile) => coachProfile.id === leadCoach.user_id) : null;
    const existingCoachName = profile?.full_name?.trim();
    if (existingCoachName) return existingCoachName;

    const pendingInvite = pendingInvites.find((invite) => invite.team_id === teamId);
    const invitedCoachName = pendingInvite?.invitee_name?.trim();
    if (invitedCoachName) return `${invitedCoachName} (invite pending)`;
    if (pendingInvite?.invitee_email) return `${pendingInvite.invitee_email} (invite pending)`;

    return null;
  };
  const getCoachEmail = (teamId: string): string | null => pendingInvites.find((invite) => invite.team_id === teamId)?.invitee_email ?? null;
  const getCoachStatus = (teamId: string): 'assigned' | 'pending' | 'unassigned' => {
    if (getLeadCoach(teamId)) return 'assigned';
    if (pendingInvites.some((invite) => invite.team_id === teamId)) return 'pending';
    return 'unassigned';
  };

  const emailPrefix = session.user.email?.split('@')[0]?.trim() ?? '';

  return {
    userId: session.user.id,
    firstName: fullName.length > 0 ? fullName.split(' ')[0] : emailPrefix || 'there',
    clubRole: typeof membership?.club_role === 'string' ? membership.club_role : '',
    club,
    teams: rawTeams.map((team) => ({
      ...team,
      coach_name: getCoachName(team.id),
      coach_user_id: getLeadCoach(team.id)?.user_id ?? null,
      pending_invite: getPendingInvite(team.id),
      coach_email: getCoachEmail(team.id),
      coach_status: getCoachStatus(team.id),
      player_count: players.filter((player) => player.team_id === team.id).length,
      players: players
        .filter((player) => player.team_id === team.id)
        .map((player) => ({ first_name: player.first_name ?? '', last_name: player.last_name ?? '' }))
    })),
    fixtures: sessions.map((item) => ({
      id: item.id,
      fixture_date: item.session_date,
      opponent: item.opponent ?? item.title ?? item.type,
      home_away: 'home',
      team_name: rawTeams.find((team) => team.id === item.team_id)?.name ?? '',
      type: item.type,
      title: item.title,
      location: item.location,
      available_count: pollResponses.filter((response) => response.session_id === item.id && response.status === 'available').length,
      unavailable_count: pollResponses.filter((response) => response.session_id === item.id && response.status === 'unavailable').length,
      pending_count: pollResponses.filter((response) => response.session_id === item.id && response.status === 'pending').length
    })),
    totalPlayers: playerCountRes.count ?? 0,
    totalCoaches: coachCountRes.count ?? 0,
    totalFixtures: fixtureCountRes.count ?? 0
  };
}

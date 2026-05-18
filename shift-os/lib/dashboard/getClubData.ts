import { createClient } from '@/lib/supabase/server';
import { resolveTeamBranding } from '@/lib/utils/teamBranding';

export interface ClubRecord {
  id: string;
  name: string;
  ethos: string | null;
  badge_url: string | null;
  primary_colour: string;
  secondary_colour: string;
  allow_team_colours: boolean;
  allow_team_badges: boolean;
  allow_coach_fixture_imports: boolean;
  coach_join_code: string | null;
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
  primary_colour: string;
  secondary_colour: string;
  badge_url: string | null;
  team_primary_colour: string | null;
  team_secondary_colour: string | null;
  team_badge_url: string | null;
  club_import_token: string | null;
  club_import_status: string | null;
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
  primary_colour: string | null;
  secondary_colour: string | null;
  badge_url: string | null;
  club_import_token: string | null;
  club_import_status: string | null;
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
  stats: {
    teamCount: number;
    playerCount: number;
    coachCount: number;
    upcomingFixtureCount: number;
  };
}

export async function getClubData(): Promise<ClubDashboardData | null> {
  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;

  if (!session) return null;

  const { data: membership } = await supabase
    .from('club_members')
    .select('club_id, club_role, clubs(*)')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .maybeSingle();

  const membershipClub = membership?.clubs;
  const rawClub = (Array.isArray(membershipClub) ? membershipClub[0] : membershipClub) as ClubRecord | null;
  if (!rawClub) return null;
  const club: ClubRecord = {
    ...rawClub,
    allow_team_colours: rawClub.allow_team_colours ?? false,
    allow_team_badges: rawClub.allow_team_badges ?? false,
    allow_coach_fixture_imports: rawClub.allow_coach_fixture_imports ?? false
  };
  const clubId = club.id;
  if (!clubId) return null;
  console.log('getClubData clubId:', clubId, 'userId:', session.user.id);

  const [teamsRes, profileRes, statTeamsRes] = await Promise.all([
    supabase
      .from('teams')
      .select('id,name,age_group,gender,league,season,join_code,primary_colour,secondary_colour,badge_url,club_import_token,club_import_status')
      .eq('club_id', clubId)
      .eq('is_active', true)
      .order('name', { ascending: true }),
    supabase.from('users_profile').select('full_name').eq('id', session.user.id).single(),
    supabase
      .from('teams')
      .select('id')
      .eq('club_id', clubId)
      .eq('is_active', true)
  ]);
  console.log('teamRows:', statTeamsRes.data, 'teamError:', statTeamsRes.error);

  const rawProfile = profileRes.data as { full_name: string | null } | null;
  const fullName = rawProfile?.full_name?.trim() ?? '';
  const rawTeams = (teamsRes.data ?? []) as RawTeamRecord[];
  const statTeamRows = (statTeamsRes.data ?? []) as Array<{ id: string }>;
  const teamIds = statTeamRows.map((team) => team.id);
  console.log('teamIds:', teamIds);

  const stats = {
    teamCount: teamIds.length,
    playerCount: 0,
    coachCount: 0,
    upcomingFixtureCount: 0
  };

  if (teamIds.length > 0) {
    const { count: playerCount, error: playerError } = await supabase
      .from('players')
      .select('id', { count: 'exact', head: true })
      .in('team_id', teamIds)
      .eq('is_active', true);
    console.log('playerCount:', playerCount, 'playerError:', playerError);

    const { count: coachCount, error: coachError } = await supabase
      .from('team_coaches')
      .select('id', { count: 'exact', head: true })
      .in('team_id', teamIds);
    console.log('coachCount:', coachCount, 'coachError:', coachError);

    const now = new Date().toISOString();
    const { count: fixtureCount, error: fixtureError } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .in('team_id', teamIds)
      .eq('is_active', true)
      .gt('session_date', now);
    console.log('fixtureCount:', fixtureCount, 'fixtureError:', fixtureError);

    stats.playerCount = playerCount ?? 0;
    stats.coachCount = coachCount ?? 0;
    stats.upcomingFixtureCount = fixtureCount ?? 0;
  } else {
    console.log('getClubData stats skipped: no active teams for clubId', clubId);
  }

  const [leadCoachesRes, pendingInvitesRes, playersRes, sessionsRes] =
    teamIds.length > 0
      ? await Promise.all([
          supabase.from('team_coaches').select('team_id,user_id').in('team_id', teamIds).eq('is_lead', true),
          supabase.from('pending_invites').select('team_id,invite_token,invitee_name,invitee_email,expires_at').in('team_id', teamIds).eq('role', 'coach').eq('is_lead', true).eq('status', 'pending'),
          supabase.from('players').select('team_id,first_name,last_name,is_active').in('team_id', teamIds).eq('is_active', true),
          supabase.from('sessions').select('id,team_id,session_date,opponent,title,type,location').in('team_id', teamIds).eq('is_active', true).gt('session_date', new Date().toISOString()).order('session_date', { ascending: true })
        ])
      : [
          { data: [] as LeadCoachRecord[] },
          { data: [] as PendingInviteRecord[] },
          { data: [] as PlayerSummaryRecord[] },
          { data: [] as SessionRecord[] }
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
    club_id: clubId,
    teams: stats.teamCount,
    players: stats.playerCount,
    coaches: stats.coachCount,
    upcoming_sessions: stats.upcomingFixtureCount
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

  return {
    userId: session.user.id,
    firstName: fullName.length > 0 ? fullName.split(' ')[0] : 'there',
    clubRole: typeof membership?.club_role === 'string' ? membership.club_role : '',
    club,
    teams: rawTeams.map((team) => {
      const branding = resolveTeamBranding({ team, club });
      return {
        ...team,
        primary_colour: branding.primary_colour,
        secondary_colour: branding.secondary_colour,
        badge_url: branding.badge_url,
        team_primary_colour: team.primary_colour,
        team_secondary_colour: team.secondary_colour,
        team_badge_url: team.badge_url,
        club_import_token: team.club_import_token,
        club_import_status: team.club_import_status,
        coach_name: getCoachName(team.id),
        coach_user_id: getLeadCoach(team.id)?.user_id ?? null,
        pending_invite: getPendingInvite(team.id),
        coach_email: getCoachEmail(team.id),
        coach_status: getCoachStatus(team.id),
        player_count: players.filter((player) => player.team_id === team.id).length,
        players: players
          .filter((player) => player.team_id === team.id)
          .map((player) => ({ first_name: player.first_name ?? '', last_name: player.last_name ?? '' }))
      };
    }),
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
    totalPlayers: stats.playerCount,
    totalCoaches: stats.coachCount,
    totalFixtures: stats.upcomingFixtureCount,
    stats
  };
}

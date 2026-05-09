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
}

interface PendingInviteRecord {
  team_id: string;
  invite_token: string;
  invitee_name: string | null;
  invitee_email: string;
  expires_at: string | null;
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

  const [teamsRes, fixturesRes, playersCountRes, coachesCountRes, profileRes] = await Promise.all([
    supabase
      .from('teams')
      .select('id,name,age_group,gender,league,season,join_code')
      .eq('club_id', club.id)
      .eq('is_active', true)
      .order('name', { ascending: true }),
    supabase
      .from('fixtures')
      .select('id,fixture_date,opponent,home_away,team_name')
      .eq('club_id', club.id)
      .order('fixture_date', { ascending: true }),
    supabase.from('players').select('*', { count: 'exact', head: true }).eq('club_id', club.id),
    supabase.from('coaches').select('*', { count: 'exact', head: true }).eq('club_id', club.id),
    supabase.from('users_profile').select('full_name').eq('id', session.user.id).maybeSingle()
  ]);

  const rawProfile = profileRes.data as { full_name: string | null } | null;
  const fullName = rawProfile?.full_name?.trim() ?? '';
  const rawTeams = (teamsRes.data ?? []) as RawTeamRecord[];
  const teamIds = rawTeams.map((team) => team.id);
  const [leadCoachesRes, pendingInvitesRes] =
    teamIds.length > 0
      ? await Promise.all([
          supabase.from('team_coaches').select('team_id,user_id').in('team_id', teamIds).eq('is_lead', true),
          supabase.from('pending_invites').select('team_id,invite_token,invitee_name,invitee_email,expires_at').in('team_id', teamIds).eq('role', 'coach').eq('is_lead', true).eq('status', 'pending')
        ])
      : [
          { data: [] as LeadCoachRecord[] },
          { data: [] as PendingInviteRecord[] }
        ];
  const leadCoaches = (leadCoachesRes.data ?? []) as LeadCoachRecord[];
  const pendingInvites = (pendingInvitesRes.data ?? []) as PendingInviteRecord[];
  const coachIds = Array.from(new Set(leadCoaches.map((coach) => coach.user_id)));
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
      player_count: 0
    })),
    fixtures: fixturesRes.data ?? [],
    totalPlayers: playersCountRes.count ?? 0,
    totalCoaches: coachesCountRes.count ?? 0
  };
}

import { createClient } from '@/lib/supabase/server';
import { resolveTeamBranding } from '@/lib/utils/teamBranding';

export interface CoachDashboardData {
  coach: { id: string; full_name: string; email: string };
  teams: Array<{
    id: string;
    name: string;
    age_group: string | null;
    gender: string | null;
    join_code: string | null;
    club_id: string | null;
    club_name: string | null;
    club_primary_colour: string | null;
    club_secondary_colour: string | null;
    club_badge_url: string | null;
    club_import_token: string | null;
    club_import_status: string | null;
    team_primary_colour: string | null;
    team_secondary_colour: string | null;
    team_badge_url: string | null;
    allow_team_colours: boolean;
    allow_team_badges: boolean;
    is_lead: boolean;
    plan_tier: string;
    is_club_managed: boolean;
  }>;
  activeTeamId: string;
  players: Array<{
    id: string;
    team_id: string | null;
    first_name: string;
    last_name: string;
    full_name: string;
    dob: string | null;
    is_active: boolean;
    parent_user_id: string | null;
    invite_token: string | null;
    invite_status: string | null;
    fa_fan_number: string | null;
    fa_fan_verified: boolean;
  }>;
  upcomingSessions: Array<{
    id: string;
    team_id: string;
    type: string;
    title: string | null;
    opponent: string | null;
    session_date: string;
    location: string | null;
    opposition_contact_name: string | null;
    opposition_contact_phone: string | null;
    full_address: string | null;
    postcode: string | null;
    coach_notes: string | null;
    tournify_link: string | null;
    is_home: boolean;
    poll_sent: boolean;
    available_count: number;
    unavailable_count: number;
    pending_count: number;
    week_off_count: number;
  }>;
  enabledFeatures: string[];
  isClubManaged: boolean;
}

interface TeamCoachRow {
  team_id: string;
  is_lead: boolean | null;
}

interface RawCoachTeam {
  id: string;
  name: string;
  age_group: string | null;
  gender: string | null;
  join_code: string | null;
  club_id: string | null;
  primary_colour: string | null;
  secondary_colour: string | null;
  badge_url: string | null;
  club_import_token: string | null;
  club_import_status: string | null;
  clubs?: {
    name: string | null;
    primary_colour: string | null;
    secondary_colour: string | null;
    badge_url: string | null;
    allow_team_colours: boolean | null;
    allow_team_badges: boolean | null;
    plan_tier: string | null;
  } | Array<{
    name: string | null;
    primary_colour: string | null;
    secondary_colour: string | null;
    badge_url: string | null;
    allow_team_colours: boolean | null;
    allow_team_badges: boolean | null;
    plan_tier: string | null;
  }> | null;
}

interface RawPlayer {
  id: string;
  team_id: string | null;
  first_name: string | null;
  last_name: string | null;
  dob: string | null;
  is_active: boolean | null;
  parent_user_id: string | null;
  invite_token: string | null;
  invite_status: string | null;
  fa_fan_number: string | null;
  fa_fan_verified: boolean | null;
}

interface RawSession {
  id: string;
  team_id: string;
  type: string;
  title: string | null;
  opponent: string | null;
  session_date: string;
  location: string | null;
  opposition_contact_name: string | null;
  opposition_contact_phone: string | null;
  full_address: string | null;
  postcode: string | null;
  coach_notes: string | null;
  tournify_link: string | null;
  is_home: boolean | null;
  poll_sent: boolean | null;
}

interface PollResponseCount {
  session_id: string;
  status: string | null;
}

const FREE_FEATURE_KEYS = ['game_time_tracker', 'availability_manager', 'announcement_builder'] as const;
const COACH_FEATURE_KEYS = [
  'game_time_tracker',
  'availability_manager',
  'announcement_builder',
  'fair_play_reports',
  'structured_conversations',
  'parent_engagement'
] as const;

function getFirstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function splitName(player: RawPlayer): { firstName: string; lastName: string; fullName: string } {
  const firstName = player.first_name?.trim() || 'Player';
  const lastName = player.last_name?.trim() || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  return { firstName, lastName, fullName };
}

export async function getCoachData(): Promise<CoachDashboardData | null> {
  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session) return null;

  const [profileRes, assignmentsRes] = await Promise.all([
    supabase.from('users_profile').select('full_name').eq('id', session.user.id).maybeSingle<{ full_name: string | null }>(),
    supabase.from('team_coaches').select('team_id,is_lead').eq('user_id', session.user.id)
  ]);

  const assignments = (assignmentsRes.data ?? []) as TeamCoachRow[];
  const teamIds = assignments.map((assignment) => assignment.team_id);
  const fullName = profileRes.data?.full_name?.trim() || String(session.user.user_metadata.full_name ?? '').trim() || 'Coach';

  if (teamIds.length === 0) {
    return {
      coach: { id: session.user.id, full_name: fullName, email: session.user.email ?? '' },
      teams: [],
      activeTeamId: '',
      players: [],
      upcomingSessions: [],
      enabledFeatures: ['game_time_tracker', 'availability_manager', 'announcement_builder'],
      isClubManaged: false
    };
  }

  const [teamsRes, playersRes, sessionsRes] = await Promise.all([
    supabase
      .from('teams')
      .select('id,name,age_group,gender,join_code,club_id,primary_colour,secondary_colour,badge_url,club_import_token,club_import_status,clubs(name,primary_colour,secondary_colour,badge_url,allow_team_colours,allow_team_badges,plan_tier)')
      .in('id', teamIds)
      .eq('is_active', true)
      .order('name', { ascending: true }),
    supabase
      .from('players')
      .select('id,team_id,first_name,last_name,dob,is_active,parent_user_id,invite_token,invite_status,fa_fan_number,fa_fan_verified')
      .in('team_id', teamIds)
      .order('first_name', { ascending: true }),
    supabase
      .from('sessions')
      .select('id,team_id,type,title,opponent,session_date,location,opposition_contact_name,opposition_contact_phone,full_address,postcode,coach_notes,tournify_link,is_home,poll_sent')
      .in('team_id', teamIds)
      .eq('is_active', true)
      .gte('session_date', new Date().toISOString())
      .order('session_date', { ascending: true })
  ]);

  const rawTeams = (teamsRes.data ?? []) as RawCoachTeam[];
  const teams = rawTeams.map((team) => {
    const club = getFirstRelation(team.clubs);
    const branding = resolveTeamBranding({ team, club });
    const assignment = assignments.find((item) => item.team_id === team.id);
    return {
      id: team.id,
      name: team.name,
      age_group: team.age_group,
      gender: team.gender,
      join_code: team.join_code,
      club_id: team.club_id,
      club_name: club?.name ?? null,
      club_primary_colour: branding.primary_colour,
      club_secondary_colour: branding.secondary_colour,
      club_badge_url: branding.badge_url,
      club_import_token: team.club_import_token ?? null,
      club_import_status: team.club_import_status ?? null,
      team_primary_colour: team.primary_colour ?? null,
      team_secondary_colour: team.secondary_colour ?? null,
      team_badge_url: team.badge_url ?? null,
      allow_team_colours: club?.allow_team_colours ?? false,
      allow_team_badges: club?.allow_team_badges ?? false,
      plan_tier: club?.plan_tier ?? 'free',
      is_club_managed: Boolean(team.club_id),
      is_lead: assignment?.is_lead ?? false
    };
  }).sort((first, second) => {
    if (first.is_lead !== second.is_lead) return first.is_lead ? -1 : 1;
    return first.name.localeCompare(second.name);
  });

  const players = ((playersRes.data ?? []) as RawPlayer[]).map((player) => {
    const names = splitName(player);
    return {
      id: player.id,
      team_id: player.team_id,
      first_name: names.firstName,
      last_name: names.lastName,
      full_name: names.fullName,
      dob: player.dob ?? null,
      is_active: player.is_active ?? true,
      parent_user_id: player.parent_user_id ?? null,
      invite_token: player.invite_token ?? null,
      invite_status: player.invite_status ?? null,
      fa_fan_number: player.fa_fan_number ?? null,
      fa_fan_verified: player.fa_fan_verified ?? false
    };
  });

  const rawSessions = (sessionsRes.data ?? []) as RawSession[];
  const sessionIds = rawSessions.map((item) => item.id);
  const { data: responseCountsData } =
    sessionIds.length > 0
      ? await supabase.from('poll_responses').select('session_id,status').in('session_id', sessionIds)
      : { data: [] as PollResponseCount[] };
  const responseCounts = (responseCountsData ?? []) as PollResponseCount[];

  const upcomingSessions = rawSessions.map((item) => {
    const responses = responseCounts.filter((response) => response.session_id === item.id);
    return {
      id: item.id,
      team_id: item.team_id,
      type: item.type,
      title: item.title,
      opponent: item.opponent,
      session_date: item.session_date,
      location: item.location,
      opposition_contact_name: item.opposition_contact_name,
      opposition_contact_phone: item.opposition_contact_phone,
      full_address: item.full_address,
      postcode: item.postcode,
      coach_notes: item.coach_notes,
      tournify_link: item.tournify_link,
      is_home: item.is_home ?? true,
      poll_sent: item.poll_sent ?? false,
      available_count: responses.filter((response) => response.status === 'available').length,
      unavailable_count: responses.filter((response) => response.status === 'unavailable').length,
      pending_count: responses.filter((response) => response.status === 'pending').length,
      week_off_count: responses.filter((response) => response.status === 'week_off').length
    };
  });

  const activeTeam = teams[0];
  const isClubManaged = activeTeam?.is_club_managed ?? false;
  const managedClubId = activeTeam?.club_id ?? null;
  const { data: featuresData } =
    managedClubId
      ? await supabase.from('feature_toggles').select('feature_key,is_enabled').eq('club_id', managedClubId)
      : { data: [] as Array<{ feature_key: string | null; is_enabled: boolean | null }> };
  const featureRows = featuresData ?? [];
  const enabledFeatures = isClubManaged
    ? COACH_FEATURE_KEYS.filter((featureKey) => {
        const toggle = featureRows.find((feature) => feature.feature_key === featureKey);
        if (toggle) return Boolean(toggle.is_enabled);
        return (FREE_FEATURE_KEYS as readonly string[]).includes(featureKey);
      })
    : [...COACH_FEATURE_KEYS];

  return {
    coach: { id: session.user.id, full_name: fullName, email: session.user.email ?? '' },
    teams,
    activeTeamId: activeTeam?.id ?? '',
    players,
    upcomingSessions,
    enabledFeatures,
    isClubManaged
  };
}

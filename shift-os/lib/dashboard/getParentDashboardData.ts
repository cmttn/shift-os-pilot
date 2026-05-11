import { createClient } from '@/lib/supabase/server';

export type ParentAvailabilityStatus = 'available' | 'unavailable' | 'week_off' | 'pending';

export interface ParentSession {
  id: string;
  type: string;
  opponent: string | null;
  title: string | null;
  session_date: string;
  location: string | null;
  full_address: string | null;
  postcode: string | null;
  opposition_contact_name: string | null;
  opposition_contact_phone: string | null;
  coach_notes: string | null;
  tournify_link: string | null;
  poll_sent: boolean;
  session_token: string;
  my_availability: ParentAvailabilityStatus;
  player_token: string | null;
  poll_response_id: string | null;
}

export interface ParentPlayerTeam {
  team_id: string;
  team_name: string;
  age_group: string | null;
  gender: string | null;
  club_id: string | null;
  club_name: string | null;
  club_badge_url: string | null;
  club_primary_colour: string;
  club_secondary_colour: string;
  upcoming_sessions: ParentSession[];
}

export interface ParentPlayer {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  dob: string | null;
  age: number | null;
  is_active: boolean;
  teams: ParentPlayerTeam[];
}

export interface ParentDashboardData {
  userId: string;
  firstName: string;
  parentFirstName: string;
  email: string;
  players: ParentPlayer[];
  allSameClub: boolean;
  globalPrimaryColour: string;
  globalClubBadge: string | null;
  globalClubName: string | null;
}

interface RawProfile {
  full_name: string | null;
}

interface RawPlayer {
  id: string;
  team_id: string | null;
  first_name: string | null;
  last_name: string | null;
  dob: string | null;
  is_active: boolean | null;
}

interface RawTeam {
  id: string;
  name: string;
  age_group: string | null;
  gender: string | null;
  club_id: string | null;
}

interface RawClub {
  id: string;
  name: string;
  badge_url: string | null;
  primary_colour: string | null;
  secondary_colour: string | null;
}

interface RawSession {
  id: string;
  team_id: string;
  type: string;
  opponent: string | null;
  title: string | null;
  session_date: string;
  location: string | null;
  full_address: string | null;
  postcode: string | null;
  opposition_contact_name: string | null;
  opposition_contact_phone: string | null;
  coach_notes: string | null;
  tournify_link: string | null;
  poll_sent: boolean | null;
  session_token: string;
}

interface RawPollResponse {
  id: string;
  session_id: string;
  player_id: string;
  player_token: string | null;
  status: ParentAvailabilityStatus | null;
}

interface RawPollResponseWithoutPlayer {
  id: string;
  session_id: string;
  player_token: string | null;
  status: ParentAvailabilityStatus | null;
  responded_at: string | null;
}

function calculateAge(dob: string | null): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.valueOf())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
}

function fullName(firstName: string | null, lastName: string | null): string {
  return [firstName, lastName].map((part) => part?.trim()).filter(Boolean).join(' ') || 'Player';
}

function buildSession(session: RawSession, responses: RawPollResponse[], playerId: string): ParentSession {
  const response = responses.find((item) => item.session_id === session.id && item.player_id === playerId);
  return {
    id: session.id,
    type: session.type,
    opponent: session.opponent,
    title: session.title,
    session_date: session.session_date,
    location: session.location,
    full_address: session.full_address,
    postcode: session.postcode,
    opposition_contact_name: session.opposition_contact_name,
    opposition_contact_phone: session.opposition_contact_phone,
    coach_notes: session.coach_notes,
    tournify_link: session.tournify_link,
    poll_sent: Boolean(session.poll_sent),
    session_token: session.session_token,
    my_availability: response?.status ?? 'pending',
    player_token: response?.player_token ?? null,
    poll_response_id: response?.id ?? null
  };
}

export async function getParentDashboardData(): Promise<ParentDashboardData | null> {
  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session) return null;

  const userId = session.user.id;
  const [profileRes, playersRes] = await Promise.all([
    supabase.from('users_profile').select('full_name').eq('id', userId).single(),
    supabase.from('players').select('id,team_id,first_name,last_name,dob,is_active').eq('parent_user_id', session.user.id).eq('is_active', true).order('first_name', { ascending: true })
  ]);

  const playerRows = (playersRes.data ?? []) as RawPlayer[];
  const profile = profileRes.data as RawProfile | null;
  const profileName = profile?.full_name?.trim() ?? '';
  const parentFirstName = profileName.length > 0 ? profileName.split(' ')[0] : 'there';

  const teamIds = Array.from(new Set(playerRows.map((player) => player.team_id).filter((teamId): teamId is string => Boolean(teamId))));
  const { data: teamRowsData } = teamIds.length > 0
    ? await supabase.from('teams').select('id,name,age_group,gender,club_id').in('id', teamIds)
    : { data: [] as RawTeam[] };

  const teamRows = (teamRowsData ?? []) as RawTeam[];
  const sessionResults = await Promise.all(
    teamRows.map((team) =>
      supabase
        .from('sessions')
        .select('*')
        .eq('team_id', team.id)
        .eq('is_active', true)
        .gt('session_date', new Date().toISOString())
        .order('session_date', { ascending: true })
    )
  );
  const sessionRows = sessionResults.flatMap((result) => (result.data ?? []) as RawSession[]);
  const clubIds = Array.from(new Set(teamRows.map((team) => team.club_id).filter((clubId): clubId is string => Boolean(clubId))));

  const responseResults = await Promise.all(
    playerRows.map(async (player) => {
      const playerSessionIds = sessionRows.filter((sessionRow) => sessionRow.team_id === player.team_id).map((sessionRow) => sessionRow.id);
      if (playerSessionIds.length === 0) return [] as RawPollResponse[];
      const { data: pollResponses } = await supabase
        .from('poll_responses')
        .select('session_id, player_token, status, responded_at, id')
        .eq('player_id', player.id)
        .in('session_id', playerSessionIds);
      return ((pollResponses ?? []) as RawPollResponseWithoutPlayer[]).map((pollResponse) => ({
        id: pollResponse.id,
        session_id: pollResponse.session_id,
        player_id: player.id,
        player_token: pollResponse.player_token,
        status: pollResponse.status
      }));
    })
  );

  const { data: clubRowsData } = clubIds.length > 0
    ? await supabase.from('clubs').select('id,name,badge_url,primary_colour,secondary_colour').in('id', clubIds)
    : { data: [] as RawClub[] };

  const clubRows = (clubRowsData ?? []) as RawClub[];
  const responseRows = responseResults.flat();
  const players = playerRows.map((player): ParentPlayer => {
    const playerTeamRows = teamRows.filter((team) => team.id === player.team_id);
    return {
      id: player.id,
      first_name: player.first_name ?? '',
      last_name: player.last_name ?? '',
      full_name: fullName(player.first_name, player.last_name),
      dob: player.dob,
      age: calculateAge(player.dob),
      is_active: Boolean(player.is_active),
      teams: playerTeamRows.map((team) => {
        const club = clubRows.find((item) => item.id === team.club_id) ?? null;
        return {
          team_id: team.id,
          team_name: team.name,
          age_group: team.age_group,
          gender: team.gender,
          club_id: team.club_id,
          club_name: club?.name ?? null,
          club_badge_url: club?.badge_url ?? null,
          club_primary_colour: club?.primary_colour ?? '#00C851',
          club_secondary_colour: club?.secondary_colour ?? '#080a0f',
          upcoming_sessions: sessionRows
            .filter((item) => item.team_id === team.id)
            .map((item) => buildSession(item, responseRows, player.id))
        };
      })
    };
  });

  const uniqueClubIds = Array.from(new Set(players.flatMap((player) => player.teams.map((team) => team.club_id ?? team.team_id))));
  const allSameClub = uniqueClubIds.length === 1;
  const firstTeam = players.flatMap((player) => player.teams)[0] ?? null;

  return {
    userId,
    firstName: parentFirstName,
    parentFirstName,
    email: session.user.email ?? '',
    players,
    allSameClub,
    globalPrimaryColour: allSameClub ? firstTeam?.club_primary_colour ?? '#00C851' : '#080a0f',
    globalClubBadge: allSameClub ? firstTeam?.club_badge_url ?? null : null,
    globalClubName: allSameClub ? firstTeam?.club_name ?? null : null
  };
}

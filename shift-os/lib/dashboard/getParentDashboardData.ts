import { createClient } from '@/lib/supabase/server';
import { resolveTeamBranding } from '@/lib/utils/teamBranding';

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
  invite_token: string | null;
  fa_fan_number: string | null;
  fa_fan_verified: boolean;
  access: {
    parents: Array<{ id: string; name: string; detail: string }>;
    familyMembers: Array<{ id: string; name: string; detail: string; status: string }>;
    pendingFamilyInvites: Array<{ id: string; name: string; detail: string; status: string }>;
  };
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
  parent_user_id: string | null;
  co_parent_user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  dob: string | null;
  is_active: boolean | null;
  invite_token: string | null;
  fa_fan_number: string | null;
  fa_fan_verified: boolean | null;
}

interface AccessProfile {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface FamilyAccessRow {
  id: string;
  player_id: string;
  family_user_id: string;
  relationship: string | null;
  status: string | null;
}

interface FamilyInviteRow {
  id: string;
  player_id: string;
  invitee_name: string | null;
  relationship: string | null;
  status: string | null;
}

interface RawTeam {
  id: string;
  name: string;
  age_group: string | null;
  gender: string | null;
  club_id: string | null;
  primary_colour: string | null;
  secondary_colour: string | null;
  badge_url: string | null;
}

interface RawClub {
  id: string;
  name: string;
  badge_url: string | null;
  primary_colour: string | null;
  secondary_colour: string | null;
  allow_team_colours: boolean | null;
  allow_team_badges: boolean | null;
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
    supabase.from('players').select('id,team_id,parent_user_id,co_parent_user_id,first_name,last_name,dob,is_active,invite_token,fa_fan_number,fa_fan_verified').or(`parent_user_id.eq.${session.user.id},co_parent_user_id.eq.${session.user.id}`).eq('is_active', true).order('first_name', { ascending: true })
  ]);

  const playerRows = (playersRes.data ?? []) as RawPlayer[];
  const profile = profileRes.data as RawProfile | null;
  const profileName = profile?.full_name?.trim() ?? '';
  const parentFirstName = profileName.length > 0 ? profileName.split(' ')[0] : 'there';

  const teamIds = Array.from(new Set(playerRows.map((player) => player.team_id).filter((teamId): teamId is string => Boolean(teamId))));
  const { data: teamRowsData } = teamIds.length > 0
    ? await supabase.from('teams').select('id,name,age_group,gender,club_id,primary_colour,secondary_colour,badge_url').in('id', teamIds)
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
    ? await supabase.from('clubs').select('id,name,badge_url,primary_colour,secondary_colour,allow_team_colours,allow_team_badges').in('id', clubIds)
    : { data: [] as RawClub[] };

  const clubRows = (clubRowsData ?? []) as RawClub[];
  const responseRows = responseResults.flat();
  const playerIds = playerRows.map((player) => player.id);
  const parentUserIds = Array.from(new Set(playerRows.flatMap((player) => [player.parent_user_id, player.co_parent_user_id]).filter((id): id is string => Boolean(id))));
  const [{ data: parentProfilesData }, { data: familyRowsData }, { data: inviteRowsData }] = await Promise.all([
    parentUserIds.length > 0 ? supabase.from('users_profile').select('id,full_name,email').in('id', parentUserIds) : Promise.resolve({ data: [] as AccessProfile[] }),
    playerIds.length > 0 ? supabase.from('football_family').select('id,player_id,family_user_id,relationship,status').in('player_id', playerIds).eq('status', 'active') : Promise.resolve({ data: [] as FamilyAccessRow[] }),
    playerIds.length > 0 ? supabase.from('football_family_invites').select('id,player_id,invitee_name,relationship,status').in('player_id', playerIds).eq('status', 'pending') : Promise.resolve({ data: [] as FamilyInviteRow[] })
  ]);
  const familyRows = (familyRowsData ?? []) as FamilyAccessRow[];
  const familyUserIds = Array.from(new Set(familyRows.map((row) => row.family_user_id)));
  const { data: familyProfilesData } = familyUserIds.length > 0
    ? await supabase.from('users_profile').select('id,full_name,email').in('id', familyUserIds)
    : { data: [] as AccessProfile[] };
  const parentProfiles = (parentProfilesData ?? []) as AccessProfile[];
  const familyProfiles = (familyProfilesData ?? []) as AccessProfile[];
  const inviteRows = (inviteRowsData ?? []) as FamilyInviteRow[];

  const players = playerRows.map((player): ParentPlayer => {
    const playerTeamRows = teamRows.filter((team) => team.id === player.team_id);
    const parentIds = [player.parent_user_id, player.co_parent_user_id].filter((id): id is string => Boolean(id));
    const parents = parentIds.map((parentId, index) => {
      const parentProfile = parentProfiles.find((profileItem) => profileItem.id === parentId);
      return {
        id: parentId,
        name: parentProfile?.full_name?.trim() || parentProfile?.email || (index === 0 ? 'Primary parent' : 'Connected parent'),
        detail: index === 0 ? 'Primary parent' : 'Co-parent'
      };
    });
    const activeFamily = familyRows.filter((row) => row.player_id === player.id).map((row) => {
      const familyProfile = familyProfiles.find((profileItem) => profileItem.id === row.family_user_id);
      return {
        id: row.id,
        name: familyProfile?.full_name?.trim() || familyProfile?.email || 'Family member',
        detail: row.relationship ?? 'Football Family',
        status: 'View only'
      };
    });
    const pendingFamilyInvites = inviteRows.filter((row) => row.player_id === player.id && row.relationship !== 'Co-parent').map((row) => ({
      id: row.id,
      name: row.invitee_name?.trim() || 'Pending invite',
      detail: row.relationship ?? 'Football Family',
      status: 'Pending'
    }));

    return {
      id: player.id,
      first_name: player.first_name ?? '',
      last_name: player.last_name ?? '',
      full_name: fullName(player.first_name, player.last_name),
      dob: player.dob,
      age: calculateAge(player.dob),
      is_active: Boolean(player.is_active),
      invite_token: player.invite_token,
      fa_fan_number: player.fa_fan_number,
      fa_fan_verified: player.fa_fan_verified ?? false,
      access: {
        parents,
        familyMembers: activeFamily,
        pendingFamilyInvites
      },
      teams: playerTeamRows.map((team) => {
        const club = clubRows.find((item) => item.id === team.club_id) ?? null;
        const branding = resolveTeamBranding({ team, club });
        return {
          team_id: team.id,
          team_name: team.name,
          age_group: team.age_group,
          gender: team.gender,
          club_id: team.club_id,
          club_name: club?.name ?? null,
          club_badge_url: branding.badge_url,
          club_primary_colour: branding.primary_colour,
          club_secondary_colour: branding.secondary_colour,
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

import { createClient } from '@/lib/supabase/server';
import { resolveTeamBranding } from '@/lib/utils/teamBranding';

export interface FamilySession {
  id: string;
  type: string;
  title: string | null;
  opponent: string | null;
  session_date: string;
  location: string | null;
  full_address: string | null;
  postcode: string | null;
  coach_notes: string | null;
  my_availability: string | null;
}

export interface FamilyMilestone {
  milestone_id: string;
  opponent: string | null;
  session_date: string | null;
  achieved_at: string | null;
}

export interface FamilyPlayer {
  id: string;
  first_name: string;
  full_name: string;
  relationship: string | null;
  team_id: string;
  team_name: string;
  club_name: string | null;
  badge_url: string | null;
  primary_colour: string;
  secondary_colour: string;
  goals_total: number;
  access: {
    parents: Array<{ id: string; name: string; detail: string }>;
    familyMembers: Array<{ id: string; name: string; detail: string; status: string }>;
    pendingFamilyInvites: Array<{ id: string; name: string; detail: string; status: string }>;
  };
  sessions: FamilySession[];
  milestones: FamilyMilestone[];
}

export interface FamilyDashboardData {
  userId: string;
  players: FamilyPlayer[];
}

interface FamilyRow {
  player_id: string;
  relationship: string | null;
}

interface PlayerRow {
  id: string;
  parent_user_id: string | null;
  co_parent_user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  team_id: string | null;
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

interface TeamRow {
  id: string;
  name: string;
  club_id: string | null;
  primary_colour: string | null;
  secondary_colour: string | null;
  badge_url: string | null;
}

interface ClubRow {
  id: string;
  name: string | null;
  badge_url: string | null;
  primary_colour: string | null;
  secondary_colour: string | null;
  allow_team_colours: boolean | null;
  allow_team_badges: boolean | null;
}

interface SessionRow {
  id: string;
  team_id: string;
  type: string;
  title: string | null;
  opponent: string | null;
  session_date: string;
  location: string | null;
  full_address: string | null;
  postcode: string | null;
  coach_notes: string | null;
}

interface PollResponseRow {
  session_id: string;
  player_id: string;
  status: string | null;
}

interface GoalTotalRow {
  player_id: string;
  total_stars: number | null;
}

function fullName(firstName: string | null, lastName: string | null): string {
  return [firstName, lastName].map((part) => part?.trim()).filter(Boolean).join(' ') || 'Player';
}

export async function getFamilyDashboardData(): Promise<FamilyDashboardData | null> {
  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session) return null;

  const { data: familyRowsData } = await supabase
    .from('football_family')
    .select('player_id,relationship')
    .eq('family_user_id', session.user.id)
    .eq('status', 'active');
  const familyRows = (familyRowsData ?? []) as FamilyRow[];
  const playerIds = familyRows.map((row) => row.player_id);

  if (playerIds.length === 0) return { userId: session.user.id, players: [] };

  const { data: playerRowsData } = await supabase
    .from('players')
    .select('id,parent_user_id,co_parent_user_id,first_name,last_name,team_id')
    .in('id', playerIds)
    .eq('is_active', true);
  const playerRows = (playerRowsData ?? []) as PlayerRow[];
  const teamIds = Array.from(new Set(playerRows.map((player) => player.team_id).filter((teamId): teamId is string => Boolean(teamId))));

  const { data: teamRowsData } = teamIds.length > 0
    ? await supabase.from('teams').select('id,name,club_id,primary_colour,secondary_colour,badge_url').in('id', teamIds)
    : { data: [] as TeamRow[] };
  const teamRows = (teamRowsData ?? []) as TeamRow[];
  const clubIds = Array.from(new Set(teamRows.map((team) => team.club_id).filter((clubId): clubId is string => Boolean(clubId))));

  const [{ data: clubRowsData }, { data: sessionRowsData }, { data: goalRowsData }, { data: milestoneRowsData }] = await Promise.all([
    clubIds.length > 0 ? supabase.from('clubs').select('id,name,badge_url,primary_colour,secondary_colour,allow_team_colours,allow_team_badges').in('id', clubIds) : Promise.resolve({ data: [] as ClubRow[] }),
    teamIds.length > 0 ? supabase.from('sessions').select('id,team_id,type,title,opponent,session_date,location,full_address,postcode,coach_notes').in('team_id', teamIds).eq('is_active', true).gt('session_date', new Date().toISOString()).order('session_date', { ascending: true }) : Promise.resolve({ data: [] as SessionRow[] }),
    supabase.from('player_star_totals').select('player_id,total_stars').in('player_id', playerIds),
    supabase.from('player_milestone_achievements').select('player_id,milestone_id,opponent,session_date,achieved_at').in('player_id', playerIds).order('achieved_at', { ascending: false })
  ]);

  const sessionRows = (sessionRowsData ?? []) as SessionRow[];
  const sessionIds = sessionRows.map((item) => item.id);
  const { data: responseRowsData } = sessionIds.length > 0
    ? await supabase.from('poll_responses').select('session_id,player_id,status').in('session_id', sessionIds).in('player_id', playerIds)
    : { data: [] as PollResponseRow[] };
  const responseRows = (responseRowsData ?? []) as PollResponseRow[];
  const clubRows = (clubRowsData ?? []) as ClubRow[];
  const goalRows = (goalRowsData ?? []) as GoalTotalRow[];
  const milestoneRows = (milestoneRowsData ?? []) as Array<FamilyMilestone & { player_id: string }>;
  const parentUserIds = Array.from(new Set(playerRows.flatMap((player) => [player.parent_user_id, player.co_parent_user_id]).filter((id): id is string => Boolean(id))));
  const [{ data: parentProfilesData }, { data: familyAccessData }, { data: inviteRowsData }] = await Promise.all([
    parentUserIds.length > 0 ? supabase.from('users_profile').select('id,full_name,email').in('id', parentUserIds) : Promise.resolve({ data: [] as AccessProfile[] }),
    supabase.from('football_family').select('id,player_id,family_user_id,relationship,status').in('player_id', playerIds).eq('status', 'active'),
    supabase.from('football_family_invites').select('id,player_id,invitee_name,relationship,status').in('player_id', playerIds).eq('status', 'pending')
  ]);
  const familyAccessRows = (familyAccessData ?? []) as FamilyAccessRow[];
  const familyUserIds = Array.from(new Set(familyAccessRows.map((row) => row.family_user_id)));
  const { data: familyProfilesData } = familyUserIds.length > 0
    ? await supabase.from('users_profile').select('id,full_name,email').in('id', familyUserIds)
    : { data: [] as AccessProfile[] };
  const parentProfiles = (parentProfilesData ?? []) as AccessProfile[];
  const familyProfiles = (familyProfilesData ?? []) as AccessProfile[];
  const inviteRows = (inviteRowsData ?? []) as FamilyInviteRow[];

  return {
    userId: session.user.id,
    players: playerRows.flatMap((player) => {
      const team = teamRows.find((item) => item.id === player.team_id);
      if (!team) return [];
      const club = clubRows.find((item) => item.id === team.club_id) ?? null;
      const branding = resolveTeamBranding({ team, club });
      const parentIds = [player.parent_user_id, player.co_parent_user_id].filter((id): id is string => Boolean(id));
      const parents = parentIds.map((parentId, index) => {
        const profile = parentProfiles.find((item) => item.id === parentId);
        return {
          id: parentId,
          name: profile?.full_name?.trim() || profile?.email || (index === 0 ? 'Primary parent' : 'Connected parent'),
          detail: index === 0 ? 'Primary parent' : 'Co-parent'
        };
      });
      const familyMembers = familyAccessRows.filter((row) => row.player_id === player.id).map((row) => {
        const profile = familyProfiles.find((item) => item.id === row.family_user_id);
        return {
          id: row.id,
          name: profile?.full_name?.trim() || profile?.email || 'Family member',
          detail: row.relationship ?? 'Football Family',
          status: 'View only'
        };
      });
      return [{
        id: player.id,
        first_name: player.first_name ?? 'Player',
        full_name: fullName(player.first_name, player.last_name),
        relationship: familyRows.find((row) => row.player_id === player.id)?.relationship ?? null,
        team_id: team.id,
        team_name: team.name,
        club_name: club?.name ?? null,
        badge_url: branding.badge_url,
        primary_colour: branding.primary_colour,
        secondary_colour: branding.secondary_colour,
        goals_total: goalRows.find((row) => row.player_id === player.id)?.total_stars ?? 0,
        access: {
          parents,
          familyMembers,
          pendingFamilyInvites: inviteRows.filter((row) => row.player_id === player.id && row.relationship !== 'Co-parent').map((row) => ({
            id: row.id,
            name: row.invitee_name?.trim() || 'Pending invite',
            detail: row.relationship ?? 'Football Family',
            status: 'Pending'
          }))
        },
        sessions: sessionRows
          .filter((item) => item.team_id === team.id)
          .map((item) => ({
            ...item,
            my_availability: responseRows.find((response) => response.session_id === item.id && response.player_id === player.id)?.status ?? null
          })),
        milestones: milestoneRows.filter((milestone) => milestone.player_id === player.id)
      }];
    })
  };
}

import { createClient } from '@/lib/supabase/server';
import type { ClubRecord } from '@/lib/dashboard/getClubData';

export interface ParentPlayerRecord {
  id: string;
  team_id: string | null;
  full_name: string;
  dob: string | null;
}

export interface ParentTeamRecord {
  id: string;
  name: string;
  age_group: string | null;
  gender: string | null;
  club_id: string | null;
}

export interface ParentSessionRecord {
  id: string;
  team_id: string;
  team_name: string;
  type: string;
  title: string | null;
  opponent: string | null;
  session_date: string;
  location: string | null;
  coach_notes: string | null;
  tournify_link: string | null;
  player_id: string | null;
  response_status: 'available' | 'unavailable' | 'week_off' | 'pending' | null;
}

export interface ParentDashboardData {
  userId: string;
  firstName: string;
  email: string;
  club: ClubRecord;
  players: ParentPlayerRecord[];
  teams: ParentTeamRecord[];
  sessions: ParentSessionRecord[];
}

interface RawParentProfile {
  full_name: string | null;
}

interface RawPlayer {
  id: string;
  team_id: string | null;
  first_name: string | null;
  last_name: string | null;
  dob: string | null;
}

interface RawTeam {
  id: string;
  name: string;
  age_group: string | null;
  gender: string | null;
  club_id: string | null;
}

interface RawSession {
  id: string;
  team_id: string;
  type: string;
  title: string | null;
  opponent: string | null;
  session_date: string;
  location: string | null;
  coach_notes: string | null;
  tournify_link: string | null;
}

interface RawResponse {
  session_id: string;
  player_id: string;
  status: 'available' | 'unavailable' | 'week_off' | 'pending' | null;
}

export async function getParentDashboardData(): Promise<ParentDashboardData | null> {
  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session) return null;

  const [profileRes, playersRes] = await Promise.all([
    supabase.from('users_profile').select('full_name').eq('id', session.user.id).maybeSingle(),
    supabase.from('players').select('id,team_id,first_name,last_name,dob').eq('parent_user_id', session.user.id).eq('is_active', true).order('first_name', { ascending: true })
  ]);
  const players = ((playersRes.data ?? []) as RawPlayer[]).map((player) => ({
    id: player.id,
    team_id: player.team_id,
    full_name: [player.first_name, player.last_name].filter(Boolean).join(' ') || 'Player',
    dob: player.dob
  }));
  if (players.length === 0) return null;

  const teamIds = Array.from(new Set(players.map((player) => player.team_id).filter((teamId): teamId is string => Boolean(teamId))));
  const [{ data: teamsData }, { data: sessionsData }] = await Promise.all([
    teamIds.length > 0 ? supabase.from('teams').select('id,name,age_group,gender,club_id').in('id', teamIds) : Promise.resolve({ data: [] as RawTeam[] }),
    teamIds.length > 0 ? supabase.from('sessions').select('id,team_id,type,title,opponent,session_date,location,coach_notes,tournify_link').in('team_id', teamIds).eq('is_active', true).gte('session_date', new Date().toISOString()).order('session_date', { ascending: true }) : Promise.resolve({ data: [] as RawSession[] })
  ]);
  const teams = (teamsData ?? []) as RawTeam[];
  const clubId = teams.find((team) => team.club_id)?.club_id;
  if (!clubId) return null;
  const sessionRows = (sessionsData ?? []) as RawSession[];
  const sessionIds = sessionRows.map((item) => item.id);
  const [{ data: clubData }, { data: responsesData }] = await Promise.all([
    supabase.from('clubs').select('id,name,ethos,badge_url,primary_colour,secondary_colour,plan_tier').eq('id', clubId).maybeSingle(),
    sessionIds.length > 0 ? supabase.from('poll_responses').select('session_id,player_id,status').in('session_id', sessionIds).in('player_id', players.map((player) => player.id)) : Promise.resolve({ data: [] as RawResponse[] })
  ]);
  const club = clubData as ClubRecord | null;
  if (!club) return null;
  const responses = (responsesData ?? []) as RawResponse[];
  const profile = profileRes.data as RawParentProfile | null;
  const fullName = profile?.full_name?.trim() ?? '';

  return {
    userId: session.user.id,
    firstName: fullName.length > 0 ? fullName.split(' ')[0] : 'there',
    email: session.user.email ?? '',
    club,
    players,
    teams,
    sessions: sessionRows.map((item) => {
      const player = players.find((candidate) => candidate.team_id === item.team_id) ?? null;
      const response = responses.find((candidate) => candidate.session_id === item.id && candidate.player_id === player?.id);
      return {
        ...item,
        team_name: teams.find((team) => team.id === item.team_id)?.name ?? 'Team',
        player_id: player?.id ?? null,
        response_status: response?.status ?? null
      };
    })
  };
}

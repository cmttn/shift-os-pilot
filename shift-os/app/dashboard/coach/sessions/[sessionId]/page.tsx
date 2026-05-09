import { notFound, redirect } from 'next/navigation';
import SessionDetailClient, { SessionDetailData, SessionDetailResponse } from '@/components/dashboard/SessionDetailClient';
import { getCoachData } from '@/lib/dashboard/getCoachData';
import { createClient } from '@/lib/supabase/server';

interface SessionPageProps {
  params: {
    sessionId: string;
  };
}

interface RawSession {
  id: string;
  team_id: string;
  type: string;
  title: string | null;
  opponent: string | null;
  session_date: string;
  location: string | null;
  is_home: boolean | null;
  poll_sent: boolean | null;
  poll_sent_at: string | null;
  session_token: string;
}

interface RawPlayer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  dob: string | null;
}

export default async function CoachSessionPage({ params }: SessionPageProps) {
  const coachData = await getCoachData();
  if (!coachData) redirect('/dashboard/coach/welcome');
  const supabase = await createClient();
  const { data: sessionData } = await supabase.from('sessions').select('id,team_id,type,title,opponent,session_date,location,is_home,poll_sent,poll_sent_at,session_token').eq('id', params.sessionId).maybeSingle<RawSession>();
  if (!sessionData || !coachData.teams.some((team) => team.id === sessionData.team_id)) notFound();
  const team = coachData.teams.find((item) => item.id === sessionData.team_id);
  if (!team) notFound();
  const [{ data: playersData }, { data: responsesData }] = await Promise.all([
    supabase.from('players').select('id,first_name,last_name,dob').eq('team_id', sessionData.team_id).eq('is_active', true).order('first_name', { ascending: true }),
    supabase.from('poll_responses').select('player_id,player_token,status').eq('session_id', sessionData.id)
  ]);
  const players = ((playersData ?? []) as RawPlayer[]).map((player) => ({
    id: player.id,
    full_name: [player.first_name, player.last_name].filter(Boolean).join(' ') || 'Player',
    dob: player.dob
  }));
  const data: SessionDetailData = {
    session: {
      ...sessionData,
      is_home: sessionData.is_home ?? true,
      poll_sent: sessionData.poll_sent ?? false
    },
    team: { id: team.id, name: team.name, join_code: team.join_code, primaryColour: team.club_primary_colour ?? '#00C851' },
    players,
    responses: (responsesData ?? []) as SessionDetailResponse[]
  };
  return <SessionDetailClient data={data} />;
}

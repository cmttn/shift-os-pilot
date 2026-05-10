import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { calculatePotmWinner, resolvePotmMessage, type ClubPotmSettings, type CoachPotmSettings, type PotmVote } from '@/lib/tools/potmCalculator';

interface ClosePayload {
  pollId: string;
}

interface PollRow {
  id: string;
  session_id: string;
  team_id: string;
  created_by: string | null;
}

interface PlayerRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface SessionRow {
  id: string;
  opponent: string | null;
  title: string | null;
}

interface TeamRow {
  id: string;
  name: string;
  club_id: string | null;
}

interface StatRow {
  id: string;
  potm_count: number | null;
}

function isClosePayload(value: unknown): value is ClosePayload {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.pollId === 'string';
}

function fullName(player: PlayerRow): string {
  return [player.first_name, player.last_name].map((part) => part?.trim()).filter(Boolean).join(' ') || 'Player';
}

export async function POST(request: Request) {
  const payload = await request.json();
  if (!isClosePayload(payload)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const supabase = createServiceClient();
  const { data: poll } = await supabase.from('potm_polls').select('id,session_id,team_id,created_by').eq('id', payload.pollId).maybeSingle<PollRow>();
  if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });

  const { data: votesData } = await supabase.from('potm_votes').select('voted_for_player_id,vote_weight').eq('poll_id', poll.id);
  const votes = (votesData ?? []) as PotmVote[];
  if (votes.length === 0) return NextResponse.json({ error: 'No votes have been cast' }, { status: 400 });

  const winner = calculatePotmWinner(votes);
  if (!winner.winner_player_id) return NextResponse.json({ error: 'Unable to calculate winner' }, { status: 400 });

  const [{ data: player }, { data: session }, { data: team }] = await Promise.all([
    supabase.from('players').select('id,first_name,last_name').eq('id', winner.winner_player_id).maybeSingle<PlayerRow>(),
    supabase.from('sessions').select('id,opponent,title').eq('id', poll.session_id).maybeSingle<SessionRow>(),
    supabase.from('teams').select('id,name,club_id').eq('id', poll.team_id).maybeSingle<TeamRow>()
  ]);
  if (!player || !session || !team) return NextResponse.json({ error: 'Missing poll context' }, { status: 400 });

  const [{ data: clubSettings }, { data: coachSettings }] = await Promise.all([
    team.club_id ? supabase.from('potm_settings').select('message_mode,club_message').eq('club_id', team.club_id).maybeSingle<ClubPotmSettings>() : Promise.resolve({ data: null }),
    poll.created_by ? supabase.from('potm_coach_settings').select('coach_message').eq('user_id', poll.created_by).maybeSingle<CoachPotmSettings>() : Promise.resolve({ data: null })
  ]);
  const winnerName = fullName(player);
  const message = resolvePotmMessage(clubSettings ?? null, coachSettings ?? null, winnerName);

  await supabase.from('potm_polls').update({ status: 'closed', winner_player_id: winner.winner_player_id, coach_message_used: message }).eq('id', poll.id);

  const { data: existingStat } = await supabase.from('potm_stats').select('id,potm_count').eq('player_id', winner.winner_player_id).eq('team_id', poll.team_id).maybeSingle<StatRow>();
  if (existingStat) {
    await supabase.from('potm_stats').update({ potm_count: (existingStat.potm_count ?? 0) + 1, last_won_at: new Date().toISOString(), last_session_id: poll.session_id, updated_at: new Date().toISOString() }).eq('id', existingStat.id);
  } else {
    await supabase.from('potm_stats').insert({ player_id: winner.winner_player_id, team_id: poll.team_id, club_id: team.club_id, potm_count: 1, last_won_at: new Date().toISOString(), last_session_id: poll.session_id });
  }

  const cardResponse = await fetch(new URL('/api/potm-card', request.url), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pollId: poll.id })
  });
  const cardData = cardResponse.ok ? await cardResponse.json() as { card_url?: string } : {};
  if (cardData.card_url) {
    await supabase.from('potm_polls').update({ social_card_url: cardData.card_url }).eq('id', poll.id);
  }

  await fetch(new URL('/api/notify', request.url), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: poll.session_id,
      team_id: poll.team_id,
      title: '🏆 Player of the Match Result!',
      message: `${winnerName} wins POTM for ${team.name} vs ${session.opponent ?? session.title ?? 'today'}!`,
      audience: 'team'
    })
  });
  await supabase.from('tool_usage').insert({ club_id: team.club_id, team_id: team.id, user_id: poll.created_by, tool_name: 'potm', session_id: poll.session_id });

  return NextResponse.json({ winner_player_id: winner.winner_player_id, winner_name: winnerName, social_card_url: cardData.card_url ?? null, was_tie: winner.was_tie });
}

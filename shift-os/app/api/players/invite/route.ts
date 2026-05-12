import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface InvitePayload {
  playerId: string;
}

interface PlayerRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  parent_user_id: string | null;
  team_id: string;
  invite_token: string | null;
  invite_status: string | null;
}

interface TeamRow {
  id: string;
  name: string | null;
}

interface CoachTeamRow {
  id: string;
}

function isInvitePayload(value: unknown): value is InvitePayload {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.playerId === 'string' && record.playerId.length > 0;
}

function getSiteUrl(request: Request): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (configuredUrl) return configuredUrl;
  return new URL(request.url).origin;
}

function buildInviteMessage(playerFirstName: string, teamName: string, inviteUrl: string): string {
  return `We would like to invite ${playerFirstName} to join ${teamName} on SHIFT OS.\n\nFollow this link to get connected:\n${inviteUrl}`;
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid invite request' }, { status: 400 });
  }

  if (!isInvitePayload(payload)) {
    return NextResponse.json({ error: 'Invalid invite request' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('id,first_name,last_name,parent_user_id,team_id,invite_token,invite_status')
    .eq('id', payload.playerId)
    .maybeSingle<PlayerRow>();

  if (playerError) {
    return NextResponse.json({ error: playerError.message }, { status: 500 });
  }

  if (!player) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  }

  const { data: coachTeam } = await supabase
    .from('team_coaches')
    .select('id')
    .eq('team_id', player.team_id)
    .eq('user_id', session.user.id)
    .maybeSingle<CoachTeamRow>();

  if (!coachTeam) {
    return NextResponse.json({ error: 'Not allowed to invite this player' }, { status: 403 });
  }

  const { data: team } = await supabase
    .from('teams')
    .select('id,name')
    .eq('id', player.team_id)
    .maybeSingle<TeamRow>();

  if (player.parent_user_id || player.invite_status === 'accepted') {
    return NextResponse.json({ error: 'This player already has a linked parent' }, { status: 409 });
  }

  const inviteToken = player.invite_token ?? crypto.randomUUID();
  const { error: updateError } = await supabase
    .from('players')
    .update({
      invite_token: inviteToken,
      invite_status: 'sent',
      invite_sent_at: new Date().toISOString()
    })
    .eq('id', player.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const playerFirstName = player.first_name?.trim() || 'Player';
  const teamName = team?.name?.trim() || 'the team';
  const inviteUrl = `${getSiteUrl(request)}/invite/player/${inviteToken}`;

  return NextResponse.json({
    invite_url: inviteUrl,
    invite_message: buildInviteMessage(playerFirstName, teamName, inviteUrl)
  });
}

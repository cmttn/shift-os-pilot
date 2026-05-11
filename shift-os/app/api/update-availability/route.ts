import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type AvailabilityStatus = 'available' | 'unavailable';

interface UpdateAvailabilityPayload {
  sessionId: string;
  playerId: string;
  status: AvailabilityStatus;
}

interface PlayerRow {
  id: string;
  team_id: string | null;
}

interface SessionRow {
  id: string;
  team_id: string;
}

interface PollResponseRow {
  status: string | null;
}

function isAvailabilityStatus(value: unknown): value is AvailabilityStatus {
  return value === 'available' || value === 'unavailable';
}

function isPayload(value: unknown): value is UpdateAvailabilityPayload {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.sessionId === 'string'
    && typeof record.playerId === 'string'
    && isAvailabilityStatus(record.status);
}

export async function POST(request: Request) {
  const payload: unknown = await request.json();
  if (!isPayload(payload)) {
    return NextResponse.json({ error: 'Invalid availability update' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [{ data: player }, { data: activity }, { data: existingResponse }] = await Promise.all([
    supabase
      .from('players')
      .select('id,team_id')
      .eq('id', payload.playerId)
      .eq('parent_user_id', session.user.id)
      .maybeSingle<PlayerRow>(),
    supabase
      .from('sessions')
      .select('id,team_id')
      .eq('id', payload.sessionId)
      .eq('is_active', true)
      .maybeSingle<SessionRow>(),
    supabase
      .from('poll_responses')
      .select('status')
      .eq('session_id', payload.sessionId)
      .eq('player_id', payload.playerId)
      .maybeSingle<PollResponseRow>()
  ]);

  if (!player || !activity || player.team_id !== activity.team_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (existingResponse?.status === 'week_off') {
    return NextResponse.json({ error: 'Availability is locked for this activity' }, { status: 403 });
  }

  const { error } = await supabase.from('poll_responses').upsert(
    {
      session_id: payload.sessionId,
      player_id: payload.playerId,
      status: payload.status,
      responded_at: new Date().toISOString()
    },
    { onConflict: 'session_id,player_id' }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

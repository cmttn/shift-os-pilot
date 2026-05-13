import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server';

interface CreateRequestPayload {
  action: 'create';
  coach_join_code: string;
  team_id: string | null;
}

interface ReviewRequestPayload {
  action: 'approve' | 'reject';
  request_id: string;
}

interface ClubLookupRow {
  id: string;
  name: string;
  badge_url: string | null;
  plan_tier: string | null;
}

interface ClubJoinRequestRow {
  id: string;
  club_id: string;
  coach_user_id: string;
  team_id: string | null;
  status: string | null;
}

interface TeamCoachRow {
  user_id: string;
}

function isCreatePayload(value: unknown): value is CreateRequestPayload {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return record.action === 'create' && typeof record.coach_join_code === 'string' && (typeof record.team_id === 'string' || record.team_id === null);
}

function isReviewPayload(value: unknown): value is ReviewRequestPayload {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (record.action === 'approve' || record.action === 'reject') && typeof record.request_id === 'string';
}

async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  return sessionData.session?.user.id ?? null;
}

async function isClubAdmin(clubId: string, userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('club_members')
    .select('id')
    .eq('club_id', clubId)
    .eq('user_id', userId)
    .in('club_role', ['admin', 'club_admin', 'shift_admin'])
    .maybeSingle<{ id: string }>();
  return Boolean(data);
}

export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const code = new URL(request.url).searchParams.get('code')?.trim().toUpperCase();
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });

  const supabase = createServiceClient();
  const { data: club } = await supabase
    .from('clubs')
    .select('id,name,badge_url,plan_tier')
    .eq('coach_join_code', code)
    .maybeSingle<ClubLookupRow>();

  if (!club) return NextResponse.json({ error: 'No club found with that code' }, { status: 404 });

  const [{ count: teamCount }, { count: coachCount }] = await Promise.all([
    supabase.from('teams').select('id', { count: 'exact', head: true }).eq('club_id', club.id).eq('is_active', true),
    supabase.from('club_members').select('id', { count: 'exact', head: true }).eq('club_id', club.id).eq('club_role', 'coach').eq('is_active', true)
  ]);

  return NextResponse.json({ club, team_count: teamCount ?? 0, coach_count: coachCount ?? 0 });
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const payload: unknown = await request.json();
  const supabase = createServiceClient();

  if (isCreatePayload(payload)) {
    const cleanCode = payload.coach_join_code.trim().toUpperCase();
    const { data: club } = await supabase
      .from('clubs')
      .select('id,name')
      .eq('coach_join_code', cleanCode)
      .maybeSingle<{ id: string; name: string }>();

    if (!club) return NextResponse.json({ error: 'No club found with that code' }, { status: 404 });

    const { data: existing } = await supabase
      .from('club_join_requests')
      .select('id,status')
      .eq('club_id', club.id)
      .eq('coach_user_id', userId)
      .maybeSingle<{ id: string; status: string | null }>();

    if (existing?.status === 'pending') return NextResponse.json({ success: true, status: 'pending', club_name: club.name });

    const { error } = await supabase.from('club_join_requests').upsert({
      club_id: club.id,
      coach_user_id: userId,
      team_id: payload.team_id,
      status: 'pending',
      requested_at: new Date().toISOString(),
      reviewed_at: null,
      reviewed_by: null
    }, { onConflict: 'club_id,coach_user_id' });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await fetch(new URL('/api/notify', request.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: club.id,
        team_id: payload.team_id ?? club.id,
        club_id: club.id,
        audience: 'club_admins',
        title: 'New coach join request',
        message: 'A coach has requested to join your club on SHIFT OS.'
      })
    }).catch(() => undefined);

    return NextResponse.json({ success: true, status: 'pending', club_name: club.name });
  }

  if (!isReviewPayload(payload)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const { data: joinRequest } = await supabase
    .from('club_join_requests')
    .select('id,club_id,coach_user_id,team_id,status')
    .eq('id', payload.request_id)
    .maybeSingle<ClubJoinRequestRow>();

  if (!joinRequest) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  if (!(await isClubAdmin(joinRequest.club_id, userId))) return NextResponse.json({ error: 'Not authorised' }, { status: 403 });

  const nextStatus = payload.action === 'approve' ? 'approved' : 'rejected';
  const { error: reviewError } = await supabase
    .from('club_join_requests')
    .update({ status: nextStatus, reviewed_at: new Date().toISOString(), reviewed_by: userId })
    .eq('id', joinRequest.id);

  if (reviewError) return NextResponse.json({ error: reviewError.message }, { status: 500 });

  if (payload.action === 'approve') {
    const { data: existingMembership } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', joinRequest.club_id)
      .eq('user_id', joinRequest.coach_user_id)
      .maybeSingle<{ id: string }>();

    if (!existingMembership) {
      await supabase.from('club_members').insert({
        club_id: joinRequest.club_id,
        user_id: joinRequest.coach_user_id,
        club_role: 'coach',
        is_active: true
      });
    }

    if (joinRequest.team_id) {
      await supabase.from('teams').update({ club_id: joinRequest.club_id, club_import_status: 'linked' }).eq('id', joinRequest.team_id);
      const { data: coaches } = await supabase.from('team_coaches').select('user_id').eq('team_id', joinRequest.team_id);
      const coachIds = ((coaches ?? []) as TeamCoachRow[]).map((coach) => coach.user_id).filter((coachId) => coachId !== joinRequest.coach_user_id);
      if (coachIds.length > 0) {
        const rows = coachIds.map((coachId) => ({ club_id: joinRequest.club_id, user_id: coachId, club_role: 'coach', is_active: true }));
        await supabase.from('club_members').insert(rows);
      }
    }
  }

  return NextResponse.json({ success: true, status: nextStatus });
}

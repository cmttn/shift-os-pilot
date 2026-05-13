import { NextResponse } from 'next/server';
import { acceptFamilyInvite, type FamilyInviteMode } from '@/lib/auth/acceptFamilyInvite';
import { createClient } from '@/lib/supabase/server';

interface AcceptInvitePayload {
  token: string;
  mode: FamilyInviteMode;
}

function isPayload(value: unknown): value is AcceptInvitePayload {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.token === 'string' && (record.mode === 'family' || record.mode === 'coparent');
}

export async function POST(request: Request) {
  const payload: unknown = await request.json();
  if (!isPayload(payload)) {
    return NextResponse.json({ error: 'Invalid invite payload' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const redirectTo = await acceptFamilyInvite(user.id, payload.token, payload.mode);
    return NextResponse.json({ redirectTo });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invite could not be accepted' }, { status: 500 });
  }
}

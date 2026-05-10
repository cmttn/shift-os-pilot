import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

function isPushSubscriptionPayload(value: unknown): value is PushSubscriptionPayload {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  const keys = record.keys;
  if (!keys || typeof keys !== 'object') return false;
  const keyRecord = keys as Record<string, unknown>;
  return typeof record.endpoint === 'string' && typeof keyRecord.p256dh === 'string' && typeof keyRecord.auth === 'string';
}

export async function POST(request: Request) {
  const payload = await request.json();
  if (!isPushSubscriptionPayload(payload)) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: session.user.id,
      endpoint: payload.endpoint,
      p256dh: payload.keys.p256dh,
      auth: payload.keys.auth
    },
    { onConflict: 'user_id,endpoint', ignoreDuplicates: true }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ saved: true });
}

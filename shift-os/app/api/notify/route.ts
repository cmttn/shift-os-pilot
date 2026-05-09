import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createServiceClient } from '@/lib/supabase/service';

interface NotifyPayload {
  session_id: string;
  team_id: string;
  message: string;
  title: string;
}

interface TeamCoachRow {
  user_id: string;
}

interface PushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

function isNotifyPayload(value: unknown): value is NotifyPayload {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.session_id === 'string' && typeof record.team_id === 'string' && typeof record.message === 'string' && typeof record.title === 'string';
}

export async function POST(request: Request) {
  const payload = await request.json();
  if (!isNotifyPayload(payload)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? 'mailto:admin@shiftos.co.uk';
  if (!publicKey || !privateKey) {
    return NextResponse.json({ error: 'Missing VAPID keys' }, { status: 500 });
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  const supabase = createServiceClient();
  const { data: coachesData } = await supabase.from('team_coaches').select('user_id').eq('team_id', payload.team_id);
  const coachIds = ((coachesData ?? []) as TeamCoachRow[]).map((coach) => coach.user_id);
  const { data: subscriptionsData } =
    coachIds.length > 0
      ? await supabase.from('push_subscriptions').select('endpoint,p256dh,auth').in('user_id', coachIds)
      : { data: [] as PushSubscriptionRow[] };

  const subscriptions = (subscriptionsData ?? []) as PushSubscriptionRow[];
  await Promise.allSettled(
    subscriptions.map((subscription) =>
      webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        },
        JSON.stringify({ title: payload.title, body: payload.message, session_id: payload.session_id })
      )
    )
  );

  return NextResponse.json({ sent: subscriptions.length });
}

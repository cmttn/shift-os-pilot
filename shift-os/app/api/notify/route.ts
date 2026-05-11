import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createServiceClient } from '@/lib/supabase/service';

interface NotifyPayload {
  session_id: string;
  team_id: string;
  club_id?: string;
  message: string;
  title: string;
  audience?: 'coaches' | 'team' | 'club_admins' | 'ticket_raiser';
}

interface TeamCoachRow {
  user_id: string;
}

interface PushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface ParentUserRow {
  parent_user_id: string | null;
}

interface ClubAdminRow {
  user_id: string;
}

interface TicketRaiserRow {
  raised_by: string;
}

function isNotifyPayload(value: unknown): value is NotifyPayload {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  const audience = record.audience;
  return typeof record.session_id === 'string'
    && typeof record.team_id === 'string'
    && typeof record.message === 'string'
    && typeof record.title === 'string'
    && (record.club_id === undefined || typeof record.club_id === 'string')
    && (audience === undefined || audience === 'coaches' || audience === 'team' || audience === 'club_admins' || audience === 'ticket_raiser');
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
  const { data: coachesData } = payload.team_id
    ? await supabase.from('team_coaches').select('user_id').eq('team_id', payload.team_id)
    : { data: [] as TeamCoachRow[] };
  const coachIds = ((coachesData ?? []) as TeamCoachRow[]).map((coach) => coach.user_id);
  const { data: parentData } = payload.audience === 'team'
    ? await supabase.from('players').select('parent_user_id').eq('team_id', payload.team_id).eq('is_active', true)
    : { data: [] as ParentUserRow[] };
  const parentIds = ((parentData ?? []) as ParentUserRow[]).map((parent) => parent.parent_user_id).filter((id): id is string => Boolean(id));
  const { data: adminData } = payload.audience === 'club_admins' && payload.club_id
    ? await supabase.from('club_members').select('user_id').eq('club_id', payload.club_id).eq('club_role', 'admin').eq('is_active', true)
    : { data: [] as ClubAdminRow[] };
  const adminIds = ((adminData ?? []) as ClubAdminRow[]).map((admin) => admin.user_id);
  const { data: ticketData } = payload.audience === 'ticket_raiser'
    ? await supabase.from('tickets').select('raised_by').eq('id', payload.session_id).maybeSingle<TicketRaiserRow>()
    : { data: null };
  const ticketRaiserIds = ticketData?.raised_by ? [ticketData.raised_by] : [];
  const targetIds = Array.from(new Set(
    payload.audience === 'team' ? [...coachIds, ...parentIds]
      : payload.audience === 'club_admins' ? adminIds
        : payload.audience === 'ticket_raiser' ? ticketRaiserIds
          : coachIds
  ));
  const { data: subscriptionsData } =
    targetIds.length > 0
      ? await supabase.from('push_subscriptions').select('endpoint,p256dh,auth').in('user_id', targetIds)
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

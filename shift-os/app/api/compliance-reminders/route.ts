import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

interface ExpiryRow {
  id: string;
  user_id: string;
  expiry_date: string | null;
}

interface SubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

function reminderType(days: number): '90day' | '30day' | '7day' | 'expired' | null {
  if (days === 90) return '90day';
  if (days === 30) return '30day';
  if (days === 7) return '7day';
  if (days === 0) return 'expired';
  return null;
}

async function sendPush(userId: string, title: string, message: string) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? 'mailto:admin@shiftos.co.uk';
  if (!publicKey || !privateKey) return;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  const supabase = createServiceClient();
  const { data } = await supabase.from('push_subscriptions').select('endpoint,p256dh,auth').eq('user_id', userId);
  const subscriptions = (data ?? []) as SubscriptionRow[];
  await Promise.allSettled(subscriptions.map((subscription) => webpush.sendNotification({
    endpoint: subscription.endpoint,
    keys: { p256dh: subscription.p256dh, auth: subscription.auth }
  }, JSON.stringify({ title, body: message }))));
}

export async function GET() {
  const supabase = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: qualificationsData }, { data: dbsData }] = await Promise.all([
    supabase.from('coach_qualifications').select('id,user_id,expiry_date').not('expiry_date', 'is', null),
    supabase.from('coach_dbs').select('id,user_id,expiry_date').not('expiry_date', 'is', null)
  ]);
  const reminders = [
    ...((qualificationsData ?? []) as ExpiryRow[]).map((row) => ({ ...row, type: 'qualification' })),
    ...((dbsData ?? []) as ExpiryRow[]).map((row) => ({ ...row, type: 'dbs' }))
  ];
  let sent = 0;
  for (const reminder of reminders) {
    if (!reminder.expiry_date) continue;
    const days = Math.ceil((new Date(reminder.expiry_date).valueOf() - new Date(today).valueOf()) / 86400000);
    const notificationType = reminderType(days);
    if (!notificationType) continue;
    const { data: existing } = await supabase
      .from('compliance_notifications')
      .select('id')
      .eq('user_id', reminder.user_id)
      .eq('reference_id', reminder.id)
      .eq('notification_type', notificationType)
      .gte('sent_at', `${today}T00:00:00`)
      .maybeSingle<{ id: string }>();
    if (existing) continue;
    await supabase.from('compliance_notifications').insert({
      user_id: reminder.user_id,
      type: reminder.type,
      reference_id: reminder.id,
      days_until_expiry: days,
      notification_type: notificationType
    });
    await sendPush(reminder.user_id, 'Compliance reminder', `${reminder.type.toUpperCase()} expires in ${days} days.`);
    sent += 1;
  }
  return NextResponse.json({ sent });
}

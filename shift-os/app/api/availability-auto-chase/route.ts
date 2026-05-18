import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

interface DueSessionRow {
  id: string;
  team_id: string;
  title: string | null;
  opponent: string | null;
  type: string;
  session_token: string | null;
}

interface PlayerRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  parent_user_id: string | null;
  co_parent_user_id: string | null;
}

interface PollResponseRow {
  player_id: string;
  status: string | null;
}

interface PushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string;
}

function sessionTitle(session: DueSessionRow): string {
  if (session.opponent?.trim()) return session.opponent.trim();
  if (session.title?.trim()) return session.title.trim();
  return session.type === 'match' ? 'the match' : session.type === 'training' ? 'training' : 'the session';
}

function playerName(player: PlayerRow): string {
  return [player.first_name, player.last_name].map((part) => part?.trim()).filter(Boolean).join(' ') || 'your child';
}

function pollUrl(session: DueSessionRow): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://shiftos.co.uk';
  return session.session_token ? `${siteUrl}/poll/${session.session_token}` : `${siteUrl}/dashboard/parent`;
}

async function sendPush(subscription: PushSubscriptionRow, payload: { title: string; body: string; url: string }) {
  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth
      }
    },
    JSON.stringify(payload)
  );
}

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? 'mailto:admin@shiftos.co.uk';
  if (!publicKey || !privateKey) {
    return NextResponse.json({ error: 'Missing VAPID keys' }, { status: 500 });
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  const supabase = createServiceClient();
  const now = new Date().toISOString();
  const { data: dueSessionsData, error: dueSessionsError } = await supabase
    .from('sessions')
    .select('id,team_id,title,opponent,type,session_token')
    .eq('poll_sent', true)
    .eq('auto_chase_enabled', true)
    .is('auto_chase_sent_at', null)
    .lte('auto_chase_due_at', now);

  if (dueSessionsError) {
    return NextResponse.json({ error: dueSessionsError.message }, { status: 500 });
  }

  const dueSessions = (dueSessionsData ?? []) as DueSessionRow[];
  let sent = 0;
  const processed: string[] = [];
  const errors: Array<{ sessionId: string; message: string }> = [];

  for (const session of dueSessions) {
    try {
      const [{ data: playersData }, { data: responsesData }] = await Promise.all([
        supabase.from('players').select('id,first_name,last_name,parent_user_id,co_parent_user_id').eq('team_id', session.team_id).eq('is_active', true),
        supabase.from('poll_responses').select('player_id,status').eq('session_id', session.id)
      ]);

      const players = (playersData ?? []) as PlayerRow[];
      const responses = (responsesData ?? []) as PollResponseRow[];
      const pendingPlayers = players.filter((player) => {
        const response = responses.find((item) => item.player_id === player.id);
        return !response || response.status === 'pending';
      });

      if (pendingPlayers.length === 0) {
        await supabase.from('sessions').update({ auto_chase_sent_at: new Date().toISOString() }).eq('id', session.id);
        processed.push(session.id);
        continue;
      }

      const parentIds = Array.from(new Set(pendingPlayers.flatMap((player) => [player.parent_user_id, player.co_parent_user_id]).filter((id): id is string => Boolean(id))));
      const { data: subscriptionsData } = parentIds.length > 0
        ? await supabase.from('push_subscriptions').select('user_id,endpoint,p256dh,auth').in('user_id', parentIds)
        : { data: [] as PushSubscriptionRow[] };
      const subscriptions = (subscriptionsData ?? []) as PushSubscriptionRow[];
      const url = pollUrl(session);
      const title = sessionTitle(session);

      const sends = pendingPlayers.flatMap((player) => {
        const targetIds = [player.parent_user_id, player.co_parent_user_id].filter((id): id is string => Boolean(id));
        return subscriptions
          .filter((subscription) => targetIds.includes(subscription.user_id))
          .map((subscription) => sendPush(subscription, {
            title: 'Availability reminder',
            body: `Availability reminder: please confirm if ${playerName(player)} is available for ${title}.`,
            url
          }));
      });

      const results = await Promise.allSettled(sends);
      sent += results.filter((result) => result.status === 'fulfilled').length;
      await supabase.from('sessions').update({ auto_chase_sent_at: new Date().toISOString() }).eq('id', session.id);
      processed.push(session.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Auto Chase error';
      console.error('Availability Auto Chase failed', { sessionId: session.id, message });
      errors.push({ sessionId: session.id, message });
    }
  }

  return NextResponse.json({ processed: processed.length, sent, errors });
}

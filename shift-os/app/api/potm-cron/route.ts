import { NextResponse } from 'next/server';

export async function GET() {
  // Future Pro cron logic:
  // 1. Find polls WHERE status='scheduled' AND poll_opens_at <= now()
  //    UPDATE status='open', send push notifications.
  // 2. Find polls WHERE status='open' AND poll_closes_at <= now()
  //    POST /api/potm-close for each.
  return NextResponse.json({ status: 'ok', message: 'Cron placeholder - activate on Vercel Pro' });
}

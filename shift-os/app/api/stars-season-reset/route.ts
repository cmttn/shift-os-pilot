import { NextResponse } from 'next/server';

export async function GET() {
  // Future Pro cron logic:
  // 1. Archive the completed season on 1 July.
  // 2. Generate end-of-season star cards with @vercel/og.
  // 3. Save cards to the star-cards bucket at [player_id]/[season]/end-of-season.png.
  // 4. Push a private celebration notification to each parent.
  return NextResponse.json({ status: 'ok', message: 'Season reset placeholder - activate on Vercel Pro' });
}

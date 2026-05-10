import React from 'react';
import { ImageResponse } from 'next/og';
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

interface CardPayload {
  pollId: string;
}

interface PollRow {
  id: string;
  session_id: string;
  team_id: string;
  winner_player_id: string | null;
  coach_message_used: string | null;
}

interface PlayerRow {
  first_name: string | null;
  last_name: string | null;
}

interface SessionRow {
  opponent: string | null;
  title: string | null;
  session_date: string;
}

interface TeamRow {
  name: string;
  club_id: string | null;
}

interface ClubRow {
  name: string;
  badge_url: string | null;
  primary_colour: string | null;
}

function isCardPayload(value: unknown): value is CardPayload {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.pollId === 'string';
}

function fullName(player: PlayerRow | null): string {
  return [player?.first_name, player?.last_name].map((part) => part?.trim()).filter(Boolean).join(' ') || 'Player';
}

function darkenHex(hex: string, percent: number): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  const r = Math.max(0, (num >> 16) - Math.round((255 * percent) / 100));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round((255 * percent) / 100));
  const b = Math.max(0, (num & 0xff) - Math.round((255 * percent) / 100));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export async function POST(request: Request) {
  const payload = await request.json();
  if (!isCardPayload(payload)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  const supabase = createServiceClient();
  const { data: poll } = await supabase.from('potm_polls').select('id,session_id,team_id,winner_player_id,coach_message_used').eq('id', payload.pollId).maybeSingle<PollRow>();
  if (!poll?.winner_player_id) return NextResponse.json({ error: 'Poll winner not found' }, { status: 404 });

  const [{ data: player }, { data: session }, { data: team }] = await Promise.all([
    supabase.from('players').select('first_name,last_name').eq('id', poll.winner_player_id).maybeSingle<PlayerRow>(),
    supabase.from('sessions').select('opponent,title,session_date').eq('id', poll.session_id).maybeSingle<SessionRow>(),
    supabase.from('teams').select('name,club_id').eq('id', poll.team_id).maybeSingle<TeamRow>()
  ]);
  if (!player || !session || !team) return NextResponse.json({ error: 'Missing card data' }, { status: 400 });
  const { data: club } = team.club_id ? await supabase.from('clubs').select('name,badge_url,primary_colour').eq('id', team.club_id).maybeSingle<ClubRow>() : { data: null };
  const primary = club?.primary_colour ?? '#00C851';
  const opponent = session.opponent ?? session.title ?? 'Match Day';
  const date = new Date(session.session_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const message = poll.coach_message_used ?? 'Outstanding performance today - you were brilliant from start to finish!';

  const image = new ImageResponse(
    React.createElement('div', {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        color: 'white',
        background: `linear-gradient(135deg, ${primary} 0%, ${darkenHex(primary, 40)} 100%)`,
        fontFamily: 'Arial, sans-serif',
        position: 'relative'
      }
    }, [
      React.createElement('div', { key: 'left', style: { width: '40%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px' } }, [
        club?.badge_url
          ? React.createElement('img', { key: 'badge', src: club.badge_url, width: 140, height: 140, style: { borderRadius: '9999px', border: '3px solid white', objectFit: 'cover' } })
          : React.createElement('div', { key: 'badge-fallback', style: { width: 140, height: 140, borderRadius: 9999, border: '3px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 900 } }, 'S'),
        React.createElement('div', { key: 'club', style: { marginTop: 24, fontSize: 24, fontWeight: 800, textAlign: 'center' } }, club?.name ?? team.name)
      ]),
      React.createElement('div', { key: 'right', style: { width: '60%', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingRight: 72 } }, [
        React.createElement('div', { key: 'label', style: { fontSize: 16, opacity: 0.7, letterSpacing: 4, fontWeight: 800 } }, '🏆 PLAYER OF THE MATCH'),
        React.createElement('div', { key: 'name', style: { marginTop: 18, fontSize: 64, lineHeight: 1.05, fontWeight: 900 } }, fullName(player)),
        React.createElement('div', { key: 'fixture', style: { marginTop: 18, fontSize: 24, opacity: 0.82 } }, `${team.name} vs ${opponent}`),
        React.createElement('div', { key: 'date', style: { marginTop: 8, fontSize: 18, opacity: 0.62 } }, date),
        React.createElement('div', { key: 'divider', style: { marginTop: 28, marginBottom: 24, height: 1, width: '100%', background: 'rgba(255,255,255,0.2)' } }),
        React.createElement('div', { key: 'message', style: { fontSize: 22, fontStyle: 'italic', opacity: 0.9, lineHeight: 1.35 } }, message)
      ]),
      React.createElement('div', { key: 'bottom', style: { position: 'absolute', bottom: 26, left: 42, right: 42, display: 'flex', justifyContent: 'space-between', fontSize: 16 } }, [
        React.createElement('span', { key: 'club-name', style: { fontWeight: 700 } }, club?.name ?? team.name),
        React.createElement('span', { key: 'powered', style: { opacity: 0.3, fontSize: 14 } }, 'Powered by Shift OS')
      ])
    ]),
    { width: 1200, height: 630 }
  );
  const buffer = await image.arrayBuffer();
  const path = `${poll.id}/card.png`;
  const { error: uploadError } = await supabase.storage.from('potm-cards').upload(path, buffer, { contentType: 'image/png', upsert: true });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });
  const { data: publicUrlData } = supabase.storage.from('potm-cards').getPublicUrl(path);
  await supabase.from('potm_polls').update({ social_card_url: publicUrlData.publicUrl }).eq('id', poll.id);
  return NextResponse.json({ card_url: publicUrlData.publicUrl });
}

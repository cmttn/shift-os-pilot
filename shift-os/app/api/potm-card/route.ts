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
}

interface TeamRow {
  name: string;
  club_id: string | null;
  secondary_colour: string | null;
}

interface ClubRow {
  name: string;
  badge_url: string | null;
  primary_colour: string | null;
  secondary_colour: string | null;
}

function isCardPayload(value: unknown): value is CardPayload {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.pollId === 'string';
}

function fullName(player: PlayerRow | null): string {
  return [player?.first_name, player?.last_name].map((part) => part?.trim()).filter(Boolean).join(' ') || 'Player';
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'SO';
}

function darkenHex(hex: string, percent: number): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean.length === 6 ? clean : 'fff200', 16);
  const amount = Math.round((255 * percent) / 100);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function fitNameSize(name: string): number {
  if (name.length > 24) return 76;
  if (name.length > 17) return 88;
  return 104;
}

export async function POST(request: Request) {
  const payload = await request.json();
  if (!isCardPayload(payload)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  const supabase = createServiceClient();
  const { data: poll } = await supabase.from('potm_polls').select('id,session_id,team_id,winner_player_id,coach_message_used').eq('id', payload.pollId).maybeSingle<PollRow>();
  if (!poll?.winner_player_id) return NextResponse.json({ error: 'Poll winner not found' }, { status: 404 });

  const [{ data: player }, { data: session }, { data: team }] = await Promise.all([
    supabase.from('players').select('first_name,last_name').eq('id', poll.winner_player_id).maybeSingle<PlayerRow>(),
    supabase.from('sessions').select('opponent,title').eq('id', poll.session_id).maybeSingle<SessionRow>(),
    supabase.from('teams').select('name,club_id,secondary_colour').eq('id', poll.team_id).maybeSingle<TeamRow>()
  ]);
  if (!player || !session || !team) return NextResponse.json({ error: 'Missing card data' }, { status: 400 });

  const { data: club } = team.club_id
    ? await supabase.from('clubs').select('name,badge_url,primary_colour,secondary_colour').eq('id', team.club_id).maybeSingle<ClubRow>()
    : { data: null };

  const primary = club?.primary_colour ?? '#fff200';
  const secondary = club?.secondary_colour ?? team.secondary_colour ?? darkenHex(primary, 46);
  const deep = '#08090d';
  const opponent = session.opponent ?? session.title ?? 'Match Day';
  const message = poll.coach_message_used ?? 'Outstanding effort today - keep it up.';
  const winnerName = fullName(player);
  const displayClub = club?.name ?? team.name;
  const nameSize = fitNameSize(winnerName);

  const image = new ImageResponse(
    React.createElement('div', {
      style: {
        width: '1080px',
        height: '1080px',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        color: 'white',
        backgroundColor: deep,
        fontFamily: 'Arial, sans-serif'
      }
    }, [
      React.createElement('div', { key: 'gradient', style: { position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 48%, ${deep} 100%)` } }),
      React.createElement('div', { key: 'top-glow', style: { position: 'absolute', right: -210, top: -210, width: 560, height: 560, borderRadius: 9999, backgroundColor: `${primary}55` } }),
      React.createElement('div', { key: 'bottom-glow', style: { position: 'absolute', left: -220, bottom: -240, width: 680, height: 680, borderRadius: 9999, backgroundColor: `${secondary}66` } }),
      React.createElement('div', { key: 'shade', style: { position: 'absolute', inset: 0, background: 'linear-gradient(145deg, rgba(0,0,0,0.04), rgba(0,0,0,0.74))' } }),
      React.createElement('div', { key: 'texture', style: { position: 'absolute', top: 88, left: -80, right: -80, transform: 'rotate(-12deg)', textAlign: 'center', fontSize: 98, letterSpacing: 34, fontWeight: 900, color: 'rgba(255,255,255,0.045)' } }, 'POTM POTM POTM'),
      React.createElement('div', { key: 'angle', style: { position: 'absolute', top: -80, bottom: -80, right: 116, width: 150, transform: 'rotate(18deg)', backgroundColor: 'rgba(255,255,255,0.07)' } }),
      React.createElement('svg', { key: 'trophy', viewBox: '0 0 180 220', style: { position: 'absolute', right: -86, top: 218, width: 500, height: 610, color: 'rgba(255,255,255,0.055)' } },
        React.createElement('path', {
          fill: 'currentColor',
          d: 'M57 23h66v28h31c-1 29-14 49-38 58-5 14-14 24-26 29v24h34v18H56v-18h34v-24c-12-5-21-15-26-29-24-9-37-29-38-58h31V23Zm0 46H43c3 14 9 24 19 30-3-10-5-20-5-30Zm61 30c10-6 16-16 19-30h-14c0 10-2 20-5 30Z'
        })
      ),
      React.createElement('div', { key: 'content', style: { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%', padding: 62 } }, [
        React.createElement('div', { key: 'label', style: { width: '100%', textAlign: 'center', fontSize: 43, lineHeight: 1, letterSpacing: 8, fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,0.94)' } }, 'PLAYER OF THE MATCH'),
        React.createElement('div', { key: 'badge-wrap', style: { marginTop: 28, width: 324, height: 324, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
          club?.badge_url
            ? React.createElement('img', { key: 'badge', src: club.badge_url, width: 324, height: 324, style: { objectFit: 'contain' } })
            : React.createElement('div', { key: 'badge-fallback', style: { width: 300, height: 300, borderRadius: 52, backgroundColor: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 82, fontWeight: 900 } }, initials(displayClub))
        ),
        React.createElement('div', { key: 'parents', style: { marginTop: 18, border: '1px solid rgba(255,255,255,0.18)', backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 9999, padding: '10px 18px', fontSize: 18, letterSpacing: 3, fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.78)' } }, 'Awarded by parents'),
        React.createElement('div', { key: 'main', style: { marginTop: 34, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' } }, [
          React.createElement('div', { key: 'name', style: { maxWidth: 890, textAlign: 'center', fontSize: nameSize, lineHeight: 0.95, fontWeight: 900, letterSpacing: -3 } }, winnerName),
          React.createElement('div', { key: 'fixture', style: { marginTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' } }, [
            React.createElement('div', { key: 'team', style: { fontSize: 31, fontWeight: 900, color: 'rgba(255,255,255,0.92)' } }, team.name),
            React.createElement('div', { key: 'opponent', style: { marginTop: 7, fontSize: 24, color: 'rgba(255,255,255,0.64)' } }, `vs ${opponent}`)
          ])
        ]),
        React.createElement('div', { key: 'quote', style: { marginTop: 30, border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'rgba(0,0,0,0.28)', borderRadius: 30, padding: '22px 30px', width: 824 } },
          React.createElement('div', { style: { fontSize: 26, fontStyle: 'italic', lineHeight: 1.28, color: 'rgba(255,255,255,0.88)' } }, `"${message}"`)
        ),
        React.createElement('div', { key: 'footer', style: { marginTop: 'auto', paddingTop: 24, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 28, fontSize: 14, letterSpacing: 4, fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)' } }, [
          React.createElement('span', { key: 'club', style: { maxWidth: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, displayClub),
          React.createElement('span', { key: 'powered', style: { color: 'rgba(255,255,255,0.24)', fontSize: 12 } }, 'Powered by SHIFT/OS')
        ])
      ])
    ]),
    { width: 1080, height: 1080 }
  );

  const buffer = await image.arrayBuffer();
  const path = `${poll.id}/card.png`;
  const { error: uploadError } = await supabase.storage.from('potm-cards').upload(path, buffer, { contentType: 'image/png', upsert: true });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });
  const { data: publicUrlData } = supabase.storage.from('potm-cards').getPublicUrl(path);
  await supabase.from('potm_polls').update({ social_card_url: publicUrlData.publicUrl }).eq('id', poll.id);
  return NextResponse.json({ card_url: publicUrlData.publicUrl });
}

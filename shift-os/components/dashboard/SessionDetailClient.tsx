'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export interface SessionDetailPlayer {
  id: string;
  full_name: string;
  dob: string | null;
}

export interface SessionDetailResponse {
  player_id: string;
  player_token: string;
  status: 'available' | 'unavailable' | 'week_off' | 'pending';
}

export interface SessionDetailData {
  session: {
    id: string;
    team_id: string;
    type: string;
    title: string | null;
    opponent: string | null;
    session_date: string;
    location: string | null;
    is_home: boolean;
    poll_sent: boolean;
    poll_sent_at: string | null;
    session_token: string;
  };
  team: { id: string; name: string; join_code: string | null; primaryColour: string };
  players: SessionDetailPlayer[];
  responses: SessionDetailResponse[];
}

interface SessionDetailClientProps {
  data: SessionDetailData;
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'P';
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return `${date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} at ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

function statusLabel(status: string): string {
  if (status === 'available') return '✅ Available';
  if (status === 'unavailable') return '❌ Not Available';
  if (status === 'week_off') return '🏖️ Week Off';
  return '⏳ Pending';
}

function statusColour(status: string): string {
  if (status === 'available') return '#10b981';
  if (status === 'unavailable') return '#ef4444';
  if (status === 'week_off') return 'rgba(255,255,255,0.25)';
  return '#f59e0b';
}

export default function SessionDetailClient({ data }: SessionDetailClientProps) {
  const [responses, setResponses] = useState(data.responses);
  const [weekOffIds, setWeekOffIds] = useState<string[]>(data.responses.filter((response) => response.status === 'week_off').map((response) => response.player_id));
  const [pollSent, setPollSent] = useState(data.session.poll_sent);
  const [pollSentAt, setPollSentAt] = useState(data.session.poll_sent_at);
  const [shareMessage, setShareMessage] = useState('');
  const [error, setError] = useState('');
  const primaryColour = data.team.primaryColour;

  const counts = useMemo(() => ({
    available: responses.filter((response) => response.status === 'available').length,
    unavailable: responses.filter((response) => response.status === 'unavailable').length,
    pending: responses.filter((response) => response.status === 'pending').length,
    weekOff: responses.filter((response) => response.status === 'week_off').length
  }), [responses]);
  const confirmedPercent = data.players.length > 0 ? Math.round(((counts.available + counts.unavailable) / data.players.length) * 100) : 0;

  function buildMessage(nextResponses: SessionDetailResponse[]): string {
    const origin = window.location.origin;
    const responseByPlayer = new Map(nextResponses.map((response) => [response.player_id, response]));
    const activePlayers = data.players.filter((player) => !weekOffIds.includes(player.id));
    const weekOffPlayers = data.players.filter((player) => weekOffIds.includes(player.id));
    const header = [
      `📋 *Availability Check — ${data.team.name}*`,
      '',
      `*${data.session.type}* ${data.session.opponent ? `vs ${data.session.opponent}` : data.session.title ?? ''}`,
      `📅 ${formatDate(data.session.session_date)}`,
      `📍 ${data.session.location ?? 'Location TBC'}`,
      '',
      'Please confirm availability for each player:',
      ''
    ];
    const playerLines = activePlayers.flatMap((player) => {
      const response = responseByPlayer.get(player.id);
      const token = response?.player_token ?? '';
      return [
        `👤 *${player.full_name}*`,
        `✅ Available → ${origin}/poll/${data.session.session_token}/${token}/available`,
        `❌ Not Available → ${origin}/poll/${data.session.session_token}/${token}/unavailable`,
        ''
      ];
    });
    const weekOffLines = weekOffPlayers.length > 0 ? ['', ...weekOffPlayers.map((player) => `🏖️ ${player.full_name} — Week Off (no response needed)`), ''] : [];
    return [...header, ...playerLines, ...weekOffLines, 'Powered by Shift OS'].join('\n');
  }

  async function sendPoll() {
    setError('');
    const rows = data.players.map((player) => ({
      session_id: data.session.id,
      player_id: player.id,
      status: weekOffIds.includes(player.id) ? 'week_off' : 'pending'
    }));

    const supabase = createClient();
    const { data: inserted, error: insertError } = await supabase
      .from('poll_responses')
      .upsert(rows, { onConflict: 'session_id,player_id' })
      .select('player_id,player_token,status');
    if (insertError) {
      setError(insertError.message);
      return;
    }

    const nextResponses = (inserted ?? []) as SessionDetailResponse[];
    const { error: updateError } = await supabase.from('sessions').update({ poll_sent: true, poll_sent_at: new Date().toISOString() }).eq('id', data.session.id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setResponses(nextResponses);
    setPollSent(true);
    setPollSentAt(new Date().toISOString());
    setShareMessage(buildMessage(nextResponses));
  }

  async function overrideStatus(playerId: string, status: SessionDetailResponse['status']) {
    setResponses((current) => current.map((response) => response.player_id === playerId ? { ...response, status } : response));
    if (status === 'week_off') setWeekOffIds((current) => Array.from(new Set([...current, playerId])));
    const existing = responses.find((response) => response.player_id === playerId);
    if (existing) {
      await createClient().from('poll_responses').update({ status }).eq('session_id', data.session.id).eq('player_id', playerId);
    }
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(shareMessage);
  }

  return (
    <main className="min-h-screen px-5 pb-[112px] pt-8 text-white" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[480px]">
        <Link href="/dashboard/coach" className="text-sm text-white/40 transition-all duration-300 ease-out hover:text-white">← back</Link>
        <section className="mt-5 rounded-2xl border p-5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <span className="rounded-full px-3 py-1 text-xs font-semibold uppercase" style={{ backgroundColor: `${primaryColour}26`, color: primaryColour }}>{data.session.type}</span>
          <h1 className="mt-4 text-3xl font-black">{data.session.opponent ? `vs ${data.session.opponent}` : data.session.title ?? data.session.type}</h1>
          <p className="mt-2 text-sm text-white/40">{formatDate(data.session.session_date)}</p>
          <p className="mt-1 text-sm text-white/40">{data.session.location ?? 'Location TBC'}</p>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-sm text-white/55">✅{counts.available} ❌{counts.unavailable} ⏳{counts.pending} 🏖️{counts.weekOff}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full" style={{ width: `${confirmedPercent}%`, backgroundColor: primaryColour }} /></div>
        </section>

        <section className="mt-5">
          {data.players.map((player) => {
            const response = responses.find((item) => item.player_id === player.id);
            const status = response?.status ?? (weekOffIds.includes(player.id) ? 'week_off' : 'pending');
            return (
              <article key={player.id} className={`mb-2 rounded-xl border p-4 ${status === 'week_off' ? 'opacity-45' : ''}`} style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: primaryColour }}>{initials(player.full_name)}</span>
                    <p className="font-medium">{player.full_name}</p>
                  </div>
                  <select value={status} onChange={(event) => overrideStatus(player.id, event.target.value as SessionDetailResponse['status'])} className="rounded-full border border-white/10 bg-[#0d1117] px-3 py-2 text-xs" style={{ color: statusColour(status) }}>
                    <option value="available">Available</option>
                    <option value="unavailable">Not Available</option>
                    <option value="pending">Pending</option>
                    <option value="week_off">Week Off</option>
                  </select>
                </div>
                <button type="button" disabled={pollSent} onClick={() => setWeekOffIds((current) => current.includes(player.id) ? current.filter((id) => id !== player.id) : [...current, player.id])} className="mt-3 text-xs text-white/35 disabled:opacity-40">
                  {weekOffIds.includes(player.id) ? 'Remove week off' : 'Mark week off'}
                </button>
              </article>
            );
          })}
        </section>
        {error ? <p className="mt-4 text-sm text-red-200">{error}</p> : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t p-4 backdrop-blur-xl" style={{ backgroundColor: 'rgba(8,10,15,0.95)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="mx-auto flex max-w-[480px] items-center gap-2">
          {!pollSent ? (
            <button type="button" onClick={sendPoll} className="w-full rounded-full px-6 py-3 font-semibold text-white" style={{ backgroundColor: primaryColour }}>Send Availability Poll →</button>
          ) : (
            <>
              <span className="flex-1 text-xs text-white/40">Poll sent {pollSentAt ? formatDate(pollSentAt) : ''}</span>
              <button type="button" onClick={sendPoll} className="rounded-full border border-white/10 px-4 py-3 text-sm text-white">Resend Poll</button>
              <button type="button" onClick={() => setShareMessage(buildMessage(responses))} className="rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-black">WhatsApp Share</button>
            </>
          )}
        </div>
      </div>

      {shareMessage ? (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
          <section className="fixed inset-x-0 bottom-0 rounded-t-[20px] p-5" style={{ backgroundColor: 'rgba(8,10,15,0.98)' }}>
            <button type="button" onClick={() => setShareMessage('')} className="absolute right-5 top-4 text-2xl text-white/45">×</button>
            <h2 className="text-xl font-bold">Share poll</h2>
            <pre className="mt-4 max-h-[320px] overflow-auto rounded-xl border border-white/[0.08] bg-black/30 p-4 whitespace-pre-wrap text-xs text-white/70">{shareMessage}</pre>
            <button type="button" onClick={copyMessage} className="mt-4 w-full rounded-full px-6 py-3 font-semibold text-white" style={{ backgroundColor: primaryColour }}>Copy Full Message</button>
            <a href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`} className="mt-3 block w-full rounded-full bg-[#25D366] px-6 py-3 text-center font-semibold text-black">Open WhatsApp</a>
          </section>
        </div>
      ) : null}
    </main>
  );
}

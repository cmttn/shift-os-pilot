'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type PollState = 'select_player' | 'confirm_response' | 'success';
type AvailabilityStatus = 'available' | 'unavailable' | 'week_off' | 'pending';

export interface GroupPollPlayer {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

export interface GroupPollResponse {
  id: string;
  player_id: string;
  player_token: string | null;
  status: AvailabilityStatus;
  note: string | null;
}

export interface GroupPollSession {
  id: string;
  team_id: string;
  type: string;
  title: string | null;
  opponent: string | null;
  session_date: string;
  location: string | null;
  full_address: string | null;
  coach_notes: string | null;
}

interface GroupPollClientProps {
  session: GroupPollSession;
  team: {
    name: string;
  };
  club: {
    name: string;
    badge_url: string | null;
    primary_colour: string;
  } | null;
  players: GroupPollPlayer[];
  responses: GroupPollResponse[];
}

function getContrastText(hexColour: string): string {
  const hex = hexColour.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'P';
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '';
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function sessionType(type: string): string {
  if (type === 'match') return 'MATCH';
  if (type === 'tournament') return 'TOURNAMENT';
  return 'TRAINING';
}

function titleForSession(teamName: string, session: GroupPollSession): string {
  if (session.type === 'match') return `${teamName} v ${session.opponent ?? 'Opponent TBC'}`;
  if (session.type === 'tournament') return session.title ?? session.opponent ?? 'Tournament';
  return session.title ?? 'Training Session';
}

function statusText(status: AvailabilityStatus): string {
  if (status === 'available') return 'Available';
  if (status === 'unavailable') return 'Not Available';
  if (status === 'week_off') return 'Week Off';
  return 'Not responded';
}

export default function GroupPollClient({ session, team, club, players, responses: initialResponses }: GroupPollClientProps) {
  const primaryColour = club?.primary_colour ?? '#00C851';
  const contrastText = getContrastText(primaryColour);
  const [state, setState] = useState<PollState>('select_player');
  const [selectedPlayer, setSelectedPlayer] = useState<GroupPollPlayer | null>(null);
  const [responses, setResponses] = useState<GroupPollResponse[]>(initialResponses);
  const [responseGiven, setResponseGiven] = useState<'available' | 'unavailable' | null>(null);
  const [note, setNote] = useState('');
  const [loadingStatus, setLoadingStatus] = useState<'available' | 'unavailable' | null>(null);
  const selectedFirstName = selectedPlayer?.first_name || selectedPlayer?.full_name.split(' ')[0] || 'Player';

  const responseByPlayer = useMemo(() => new Map(responses.map((response) => [response.player_id, response])), [responses]);

  function selectPlayer(player: GroupPollPlayer) {
    const response = responseByPlayer.get(player.id);
    if (response?.status === 'week_off') return;
    setSelectedPlayer(player);
    setNote(response?.note ?? '');
    setState('confirm_response');
  }

  async function submitResponse(status: 'available' | 'unavailable') {
    if (!selectedPlayer) return;
    setLoadingStatus(status);
    const supabase = createClient();
    const existing = responseByPlayer.get(selectedPlayer.id);
    const payload = {
      session_id: session.id,
      player_id: selectedPlayer.id,
      status,
      responded_at: new Date().toISOString(),
      note: note.trim() || null
    };
    const result = existing
      ? await supabase.from('poll_responses').update(payload).eq('id', existing.id).select('id,player_id,player_token,status,note').maybeSingle()
      : await supabase.from('poll_responses').insert({ ...payload, player_token: crypto.randomUUID() }).select('id,player_id,player_token,status,note').maybeSingle();
    setLoadingStatus(null);
    if (result.error || !result.data) return;
    const nextResponse = result.data as GroupPollResponse;
    setResponses((current) => {
      const withoutCurrent = current.filter((response) => response.player_id !== nextResponse.player_id);
      return [...withoutCurrent, nextResponse];
    });
    setResponseGiven(status);
    setState('success');
  }

  return (
    <main className="min-h-screen px-5 pb-10 pt-8 text-white" style={{ background: `radial-gradient(ellipse at top, ${primaryColour}12 0%, transparent 50%), #080a0f` }}>
      <div className="mx-auto max-w-[480px]">
        <header className="text-center">
          {club?.badge_url ? <img src={club.badge_url} alt="" className="mx-auto h-[72px] w-[72px] rounded-full object-cover drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)]" /> : <span className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full text-2xl font-black" style={{ backgroundColor: primaryColour, color: contrastText }}>{initials(club?.name ?? team.name)}</span>}
          <h1 className="mt-3 text-xl font-bold text-white">{club?.name ?? team.name}</h1>
          <p className="mt-1 text-xs uppercase tracking-widest text-white/40">Availability Check</p>
        </header>

        <section className="mt-4 rounded-2xl border p-5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <span className="rounded-full px-3 py-1 text-xs font-bold" style={session.type === 'match' ? { backgroundColor: primaryColour, color: contrastText } : session.type === 'tournament' ? { backgroundColor: 'rgba(245,158,11,0.16)', color: '#f59e0b' } : { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)' }}>{sessionType(session.type)}</span>
          <h2 className="mt-4 text-xl font-black text-white">{titleForSession(team.name, session)}</h2>
          <p className="mt-2 text-sm text-white/50">📅 {formatDate(session.session_date)} · ⏰ {formatTime(session.session_date)} · 📍 {session.full_address ?? session.location ?? 'TBC'}</p>
          {session.coach_notes ? <p className="mt-2 text-sm italic text-white/40">📝 {session.coach_notes}</p> : null}
        </section>

        {state === 'select_player' ? (
          <section className="mt-6">
            <h3 className="mb-3 text-center text-lg font-semibold text-white">Who are you responding for?</h3>
            {players.map((player) => {
              const response = responseByPlayer.get(player.id);
              const status = response?.status ?? 'pending';
              const disabled = status === 'week_off';
              return (
                <button key={player.id} type="button" disabled={disabled} onClick={() => selectPlayer(player)} className="mb-2 flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all duration-300 ease-out hover:translate-x-1 hover:bg-white/[0.06] disabled:cursor-default disabled:opacity-40" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-black" style={status === 'available' ? { backgroundColor: '#10b981', color: '#ffffff' } : status === 'unavailable' ? { backgroundColor: '#ef4444', color: '#ffffff' } : status === 'week_off' ? { backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffffff' } : { backgroundColor: primaryColour, color: contrastText }}>
                    {status === 'available' ? '✓' : status === 'unavailable' ? '×' : status === 'week_off' ? '○' : initials(player.full_name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-white">{player.full_name}</span>
                    {status !== 'pending' ? <span className="mt-1 block text-sm" style={{ color: status === 'available' ? '#10b981' : status === 'unavailable' ? '#ef4444' : 'rgba(255,255,255,0.4)' }}>{statusText(status)}</span> : null}
                  </span>
                  <span className="text-xs text-white/35">{status === 'pending' ? '→' : 'Change →'}</span>
                </button>
              );
            })}
          </section>
        ) : null}

        {state === 'confirm_response' && selectedPlayer ? (
          <section className="mt-6">
            <button type="button" onClick={() => setState('select_player')} className="text-sm text-white/45 transition-all duration-300 ease-out hover:text-white">← Back</button>
            <h3 className="mt-4 text-center text-2xl font-black text-white">{selectedPlayer.full_name}</h3>
            <p className="mt-2 text-center text-sm text-white/40">Confirm availability for {selectedFirstName}</p>
            <p className="mt-4 text-center text-sm text-white/35">{sessionType(session.type)}{session.opponent ? ` vs ${session.opponent}` : ''} — {formatDate(session.session_date)} at {formatTime(session.session_date)}</p>
            <button type="button" disabled={loadingStatus !== null} onClick={() => submitResponse('available')} className="mt-6 w-full rounded-full px-5 py-[18px] text-lg font-bold text-white shadow-[0_4px_20px_rgba(16,185,129,0.35)] transition-all duration-300 ease-out hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>{loadingStatus === 'available' ? 'Saving...' : '✓ Available'}</button>
            <button type="button" disabled={loadingStatus !== null} onClick={() => submitResponse('unavailable')} className="mt-3 w-full rounded-full px-5 py-[18px] text-lg font-bold text-white shadow-[0_4px_20px_rgba(239,68,68,0.35)] transition-all duration-300 ease-out hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>{loadingStatus === 'unavailable' ? 'Saving...' : '× Not Available'}</button>
            <label className="mt-4 block">
              <span className="mb-2 block text-xs text-white/40">Add a note (optional)</span>
              <textarea value={note} onChange={(event) => setNote(event.target.value.slice(0, 200))} maxLength={200} placeholder="e.g. Running late, will arrive at 10:15" className="min-h-[96px] w-full rounded-xl border bg-white/[0.04] p-3 text-sm text-white outline-none placeholder:text-white/25" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
            </label>
          </section>
        ) : null}

        {state === 'success' && selectedPlayer && responseGiven ? (
          <section className="mt-8 text-center">
            <p className="text-6xl">{responseGiven === 'available' ? '✓' : '×'}</p>
            <h3 className="mt-4 text-2xl font-black" style={{ color: responseGiven === 'available' ? '#10b981' : '#ef4444' }}>{selectedFirstName} is {responseGiven === 'available' ? 'Available' : 'Not Available'}!</h3>
            <p className="mt-2 text-sm text-white/40">{team.name} has been notified.</p>
            <button type="button" onClick={() => { setSelectedPlayer(null); setResponseGiven(null); setNote(''); setState('select_player'); }} className="mt-6 text-sm text-white/60 transition-all duration-300 ease-out hover:text-white">Respond for another player →</button>
            <Link href="/" className="mt-8 block text-xs text-white/20 transition-all duration-300 ease-out hover:text-white/50">Manage your child&apos;s football on Shift OS →</Link>
          </section>
        ) : null}
      </div>
    </main>
  );
}

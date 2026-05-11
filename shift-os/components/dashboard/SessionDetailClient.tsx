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
  note?: string | null;
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
    opposition_contact_name: string | null;
    opposition_contact_phone: string | null;
    full_address: string | null;
    postcode: string | null;
    coach_notes: string | null;
    tournify_link: string | null;
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

function statusColour(status: string): string {
  if (status === 'available') return '#10b981';
  if (status === 'unavailable') return '#ef4444';
  if (status === 'week_off') return 'rgba(255,255,255,0.25)';
  return '#f59e0b';
}

function displayAddress(session: { full_address: string | null; postcode: string | null; location: string | null }): string {
  if (session.full_address) {
    return session.postcode && !session.full_address.includes(session.postcode)
      ? `${session.full_address}, ${session.postcode}`
      : session.full_address;
  }
  return session.location ?? 'TBC';
}

export default function SessionDetailClient({ data }: SessionDetailClientProps) {
  const [responses, setResponses] = useState(data.responses);
  const [weekOffIds, setWeekOffIds] = useState<string[]>(data.responses.filter((response) => response.status === 'week_off').map((response) => response.player_id));
  const [pollSent, setPollSent] = useState(data.session.poll_sent);
  const [pollSentAt, setPollSentAt] = useState(data.session.poll_sent_at);
  const [shareMessage, setShareMessage] = useState('');
  const [copied, setCopied] = useState('');
  const [coachNotes, setCoachNotes] = useState(data.session.coach_notes ?? '');
  const [error, setError] = useState('');
  const primaryColour = data.team.primaryColour;
  const groupPollUrl = typeof window === 'undefined' ? '' : `${window.location.origin}/poll/${data.session.session_token}`;

  const counts = useMemo(() => ({
    available: responses.filter((response) => response.status === 'available').length,
    unavailable: responses.filter((response) => response.status === 'unavailable').length,
    pending: responses.filter((response) => response.status === 'pending').length,
    weekOff: responses.filter((response) => response.status === 'week_off').length
  }), [responses]);
  const confirmedPercent = data.players.length > 0 ? Math.round(((counts.available + counts.unavailable) / data.players.length) * 100) : 0;

  function buildMessage(): string {
    const sessionType = data.session.type === 'match' ? 'Match' : data.session.type === 'training' ? 'Training' : 'Tournament';
    const formattedDate = new Date(data.session.session_date).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    const formattedTime = new Date(data.session.session_date).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const location = displayAddress(data.session);

    return `📋 *Availability Check — ${data.team.name}*

*${sessionType}*${data.session.opponent ? ` vs ${data.session.opponent}` : ''}
📅 ${formattedDate} at ${formattedTime}
📍 ${location}${data.session.coach_notes ? `\n\n📝 ${data.session.coach_notes}` : ''}

Please confirm your child's availability:
👇 ${groupPollUrl}

_Powered by Shift OS_`;
  }

  async function sendPoll() {
    setError('');
    const supabase = createClient();
    const playerIds = data.players.map((player) => player.id);
    const today = new Date().toISOString().slice(0, 10);
    const [{ data: suspensions }, { data: subscriptions }] = await Promise.all([
      playerIds.length > 0 ? supabase.from('player_suspensions').select('player_id').in('player_id', playerIds).eq('is_active', true).lte('start_date', today).or(`end_date.is.null,end_date.gte.${today}`) : Promise.resolve({ data: [] as Array<{ player_id: string }> }),
      playerIds.length > 0 ? supabase.from('player_subscriptions').select('player_id').in('player_id', playerIds).eq('status', 'overdue') : Promise.resolve({ data: [] as Array<{ player_id: string }> })
    ]);
    const restrictedIds = new Set([...(suspensions ?? []).map((item) => item.player_id), ...(subscriptions ?? []).map((item) => item.player_id)]);
    const rows = data.players.map((player) => ({
      session_id: data.session.id,
      player_id: player.id,
      status: restrictedIds.has(player.id) || weekOffIds.includes(player.id) ? 'week_off' : 'pending',
      note: restrictedIds.has(player.id) ? 'restricted_by_club' : null
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('poll_responses')
      .upsert(rows, { onConflict: 'session_id,player_id' })
      .select('player_id,player_token,status,note');
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
    setShareMessage(buildMessage());
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
    setCopied('message');
  }

  async function copyGroupPollUrl() {
    await navigator.clipboard.writeText(groupPollUrl);
    setCopied('link');
  }

  async function saveCoachNotes() {
    setError('');
    const { error: updateError } = await createClient().from('sessions').update({ coach_notes: coachNotes.trim() || null }).eq('id', data.session.id);
    if (updateError) setError(updateError.message);
  }

  return (
    <main className="min-h-screen px-5 pb-[112px] pt-8 text-white md:ml-[260px] md:pb-10" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[480px] md:max-w-[1040px]">
        <Link href="/dashboard/coach" className="text-sm text-white/40 transition-all duration-300 ease-out hover:text-white">Back</Link>
        <section className="mt-5 rounded-2xl border p-5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <span className="rounded-full px-3 py-1 text-xs font-semibold uppercase" style={{ backgroundColor: `${primaryColour}26`, color: primaryColour }}>{data.session.type}</span>
          <h1 className="mt-4 text-3xl font-black">{data.session.opponent ? `vs ${data.session.opponent}` : data.session.title ?? data.session.type}</h1>
          <p className="mt-2 text-sm text-white/40">{formatDate(data.session.session_date)}</p>
          <p className="mt-1 text-sm text-white/40">{displayAddress(data.session)}</p>
          {data.session.opposition_contact_name || data.session.opposition_contact_phone ? <p className="mt-1 text-sm text-white/40">Contact: {[data.session.opposition_contact_name, data.session.opposition_contact_phone].filter(Boolean).join(' - ')}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {data.session.tournify_link ? <a href={data.session.tournify_link} target="_blank" rel="noreferrer" className="inline-block rounded-full border border-white/10 px-4 py-2 text-sm text-white">View Bracket</a> : null}
            <Link href={`/dashboard/coach/sessions/${data.session.id}/playtime`} className="inline-block rounded-full px-4 py-2 text-sm font-semibold text-black" style={{ backgroundColor: primaryColour }}>Playtime Calculator</Link>
            {data.session.type === 'match' ? <Link href={`/dashboard/coach/sessions/${data.session.id}/potm`} className="inline-block rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-200">POTM Poll</Link> : null}
          </div>
        </section>

        <div className="md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] md:gap-5">
        <section className="mt-5 rounded-2xl border p-5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold">Coach notes</h2>
            <button type="button" onClick={saveCoachNotes} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white">Save</button>
          </div>
          <textarea value={coachNotes} onChange={(event) => setCoachNotes(event.target.value)} className="mt-3 min-h-[96px] w-full rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 text-sm text-white outline-none" placeholder="Add notes for this fixture" />
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-sm text-white/55">Available {counts.available} / Not available {counts.unavailable} / Pending {counts.pending} / Week off {counts.weekOff}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full" style={{ width: `${confirmedPercent}%`, backgroundColor: primaryColour }} /></div>
        </section>

        <section className="mt-5">
          {data.players.map((player) => {
            const response = responses.find((item) => item.player_id === player.id);
            const status = response?.status ?? (weekOffIds.includes(player.id) ? 'week_off' : 'pending');
            const restricted = response?.note === 'restricted_by_club';
            return (
              <article key={player.id} className={`mb-2 rounded-xl border p-4 ${status === 'week_off' ? 'opacity-45' : ''}`} style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: primaryColour }}>{initials(player.full_name)}</span>
                    <div>
                      <p className="font-medium">{player.full_name}</p>
                      {restricted ? <p className="text-xs text-white/35">Player restricted by club admin</p> : null}
                    </div>
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
        </div>
        {error ? <p className="mt-4 text-sm text-red-200">{error}</p> : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t p-4 backdrop-blur-xl md:left-[260px]" style={{ backgroundColor: 'rgba(8,10,15,0.95)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="mx-auto flex max-w-[1040px] items-center gap-2">
          {!pollSent ? (
            <button type="button" onClick={sendPoll} className="w-full rounded-full px-6 py-3 font-semibold text-white" style={{ backgroundColor: primaryColour }}>Send Availability Poll</button>
          ) : (
            <>
              <span className="flex-1 text-xs text-white/40">Poll sent {pollSentAt ? formatDate(pollSentAt) : ''}</span>
              <button type="button" onClick={sendPoll} className="rounded-full border border-white/10 px-4 py-3 text-sm text-white">Resend Poll</button>
              <button type="button" onClick={() => setShareMessage(buildMessage())} className="rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-black">WhatsApp Share</button>
            </>
          )}
        </div>
      </div>

      {shareMessage ? (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
          <section className="fixed inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-[20px] p-5" style={{ backgroundColor: 'rgba(8,10,15,0.98)' }}>
            <button type="button" onClick={() => { setShareMessage(''); setCopied(''); }} className="absolute right-5 top-4 text-2xl text-white/45">x</button>
            <h2 className="text-xl font-bold text-white">Poll Ready to Share</h2>

            <p className="mb-2 mt-5 text-xs uppercase tracking-widest text-white/35">Group Poll Link</p>
            <div className="select-all break-all rounded-xl border bg-white/[0.04] p-3 font-mono text-sm text-white" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>{groupPollUrl}</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={copyGroupPollUrl} className="rounded-full border border-white/10 px-4 py-3 text-sm text-white">{copied === 'link' ? 'Copied! ✓' : '📋 Copy Link'}</button>
              <a href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`} className="rounded-full bg-[#25D366] px-4 py-3 text-center text-sm font-semibold text-white">📱 Open WhatsApp</a>
            </div>

            <p className="mb-2 mt-5 text-xs uppercase tracking-widest text-white/35">Preview</p>
            <p className="text-xs text-white/35">How it looks in WhatsApp:</p>
            <div className="mt-3 whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-[#dcf8c6] p-4 font-sans text-sm text-[#111111]">{shareMessage}</div>
            <button type="button" onClick={copyMessage} className="mt-3 rounded-full border border-white/10 px-4 py-2 text-sm text-white">{copied === 'message' ? 'Copied! ✓' : 'Copy Full Message'}</button>

            <p className="mt-5 text-xs uppercase tracking-widest text-white/35">App Users</p>
            <p className="mt-2 text-sm text-white/40">Players/parents with Shift OS installed receive push notifications directly</p>
          </section>
        </div>
      ) : null}
    </main>
  );
}

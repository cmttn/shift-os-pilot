'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ParentAvailabilityStatus, ParentPlayerTeam, ParentSession } from '@/lib/dashboard/getParentDashboardData';

interface ParentFixturesClientProps {
  playerId: string;
  playerName: string;
  team: ParentPlayerTeam;
  heroSessionId: string | null;
}

function formatDay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '';
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function sessionTitle(teamName: string, session: ParentSession): string {
  if (session.type === 'match') return `${teamName} v ${session.opponent ?? 'Opponent TBC'}`;
  if (session.type === 'tournament') return session.title ?? session.opponent ?? 'Tournament';
  return session.title ?? 'Training Session';
}

function statusLabel(status: ParentAvailabilityStatus): string {
  if (status === 'available') return 'Available';
  if (status === 'unavailable') return 'Not Available';
  if (status === 'week_off') return 'Week Off';
  return 'Pending';
}

function statusStyles(status: ParentAvailabilityStatus): { label: string; colour: string; icon: string } {
  if (status === 'available') return { label: 'Available', colour: '#10b981', icon: '✓' };
  if (status === 'unavailable') return { label: 'Not Available', colour: '#ef4444', icon: '×' };
  if (status === 'week_off') return { label: 'Week Off', colour: 'rgba(255,255,255,0.25)', icon: '○' };
  return { label: 'Confirm', colour: '#f59e0b', icon: '?' };
}

export default function ParentFixturesClient({ playerId, playerName, team, heroSessionId }: ParentFixturesClientProps) {
  const [sessions, setSessions] = useState<ParentSession[]>(team.upcoming_sessions);
  const heroSession = useMemo(() => sessions.find((session) => session.id === heroSessionId) ?? sessions[0] ?? null, [heroSessionId, sessions]);
  const visibleSessions = useMemo(() => sessions.filter((session) => session.id !== heroSessionId), [heroSessionId, sessions]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`parent-notes-${team.team_id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `team_id=eq.${team.team_id}` }, (payload) => {
        const next = payload.new as { id?: string; coach_notes?: string | null };
        setSessions((current) => current.map((item) => item.id === next.id ? { ...item, coach_notes: next.coach_notes ?? null } : item));
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [team.team_id]);

  async function updateAvailability(session: ParentSession, status: 'available' | 'unavailable') {
    if (session.my_availability === 'week_off') return;
    const supabase = createClient();
    const previous = session.my_availability;
    const payload = {
      session_id: session.id,
      player_id: playerId,
      status,
      responded_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from('poll_responses').upsert(payload, { onConflict: 'session_id,player_id' }).select('id,player_token,status').maybeSingle();
    if (error) return;

    const nextStatus = (data?.status ?? status) as ParentAvailabilityStatus;
    setSessions((current) => current.map((item) => item.id === session.id ? { ...item, my_availability: nextStatus, poll_response_id: data?.id ?? item.poll_response_id, player_token: data?.player_token ?? item.player_token } : item));
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: session.id,
        team_id: team.team_id,
        title: 'Availability Update',
        message: `${playerName} changed from ${statusLabel(previous)} to ${statusLabel(nextStatus)} - ${team.team_name} ${session.type} ${formatDay(session.session_date)}`
      })
    });
  }

  return (
    <>
      {heroSession ? (
        <section className="relative mt-8 overflow-hidden rounded-2xl p-5 md:p-6" style={{ background: `linear-gradient(135deg, ${team.club_primary_colour} 0%, #102015 52%, #080a0f 100%)` }}>
          <div className="absolute inset-x-0 bottom-0 h-full" style={{ background: 'linear-gradient(to bottom, transparent 60%, #080a0f 100%)' }} />
          <div className="relative md:grid md:grid-cols-[minmax(0,1.25fr)_minmax(220px,0.75fr)] md:gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/55">Next {heroSession.type}</p>
              <h2 className="mt-3 text-2xl font-black text-white md:text-3xl">{sessionTitle(team.team_name, heroSession)}</h2>
              <div className="mt-4 space-y-2 text-sm text-white/70 md:text-base">
                <p>📅 {formatDay(heroSession.session_date)} | ⏰ KO {formatTime(heroSession.session_date)}</p>
                <p>📍 {heroSession.full_address ?? heroSession.location ?? 'Location TBC'}{heroSession.postcode ? `, ${heroSession.postcode}` : ''}</p>
                {heroSession.opposition_contact_name || heroSession.opposition_contact_phone ? <p className="hidden md:block">☎ {[heroSession.opposition_contact_name, heroSession.opposition_contact_phone].filter(Boolean).join(' - ')}</p> : null}
                {heroSession.coach_notes ? <p className="italic text-white/55">📝 {heroSession.coach_notes}</p> : null}
              </div>
              {heroSession.tournify_link ? <a href={heroSession.tournify_link} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white">🏆 View Tournament →</a> : null}
            </div>

            <div className="mt-6 md:mt-0 md:flex md:flex-col md:justify-center">
              {heroSession.my_availability === 'week_off' ? (
                <div className="flex min-h-14 items-center justify-center rounded-full bg-white/10 px-4 text-sm font-semibold text-white/65">Week Off - set by coach</div>
              ) : heroSession.my_availability === 'available' || heroSession.my_availability === 'unavailable' ? (
                <button
                  type="button"
                  onClick={() => updateAvailability(heroSession, heroSession.my_availability === 'available' ? 'unavailable' : 'available')}
                  className="min-h-14 w-full rounded-full px-5 text-sm font-bold text-white transition-all duration-300 ease-out"
                  style={{ backgroundColor: heroSession.my_availability === 'available' ? '#10b981' : '#ef4444' }}
                >
                  {heroSession.my_availability === 'available' ? "✓ You're Available" : '× Not Available'}
                </button>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <button type="button" onClick={() => updateAvailability(heroSession, 'available')} className="min-h-14 rounded-full px-4 text-sm font-bold text-black transition-all duration-300 ease-out" style={{ backgroundColor: team.club_primary_colour }}>✓ Available</button>
                  <button type="button" onClick={() => updateAvailability(heroSession, 'unavailable')} className="min-h-14 rounded-full bg-[#ef4444] px-4 text-sm font-bold text-white transition-all duration-300 ease-out">× Not Available</button>
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="mt-8 rounded-2xl border border-white/[0.06] p-5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)' }}>
          <h2 className="text-xl font-bold text-white">No sessions yet</h2>
          <p className="mt-2 text-sm text-white/40">Your coach has not posted a fixture, training session or tournament yet.</p>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-xl font-bold text-white md:text-2xl">Upcoming Schedule</h2>
        <div className="mt-4 space-y-3 md:space-y-4">
          {visibleSessions.length === 0 ? (
            <p className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-sm text-white/35">No other sessions are posted yet.</p>
          ) : visibleSessions.map((session) => {
            const status = statusStyles(session.my_availability);
            const accent = session.type === 'match' ? team.club_primary_colour : 'rgba(255,255,255,0.15)';
            return (
              <article key={session.id} className="rounded-xl border p-4 md:p-5" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)', borderLeft: `3px solid ${accent}` }}>
                <div className="flex gap-3">
                  <span className="mt-1 text-lg">{session.type === 'match' ? '⚽' : session.type === 'tournament' ? '🏆' : '🏃'}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-white md:text-lg">{sessionTitle(team.team_name, session)}</h3>
                    <p className="mt-1 text-sm text-white/40">{formatDay(session.session_date)} at {formatTime(session.session_date)}</p>
                    <p className="mt-1 text-xs text-white/30 md:text-sm">{session.full_address ?? session.location ?? 'Location TBC'}</p>
                    {session.opposition_contact_name || session.opposition_contact_phone ? <p className="mt-1 hidden text-xs text-white/30 md:block">Contact: {[session.opposition_contact_name, session.opposition_contact_phone].filter(Boolean).join(' - ')}</p> : null}
                    {session.coach_notes ? <p className="mt-3 line-clamp-2 text-sm italic text-white/35">{session.coach_notes}</p> : null}
                  </div>
                  <button
                    type="button"
                    disabled={session.my_availability === 'week_off'}
                    onClick={() => updateAvailability(session, session.my_availability === 'available' ? 'unavailable' : 'available')}
                    className="h-9 shrink-0 rounded-full px-3 text-xs font-semibold text-white transition-all duration-300 ease-out disabled:cursor-not-allowed"
                    style={{ backgroundColor: status.colour }}
                  >
                    {status.icon} {status.label}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}

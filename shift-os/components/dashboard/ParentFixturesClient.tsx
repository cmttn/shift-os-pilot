'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ParentSessionRecord } from '@/lib/dashboard/getParentDashboardData';

interface ParentFixturesClientProps {
  sessions: ParentSessionRecord[];
  primaryColour: string;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return `${date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} / KO ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

export default function ParentFixturesClient({ sessions, primaryColour }: ParentFixturesClientProps) {
  const [items, setItems] = useState(sessions);

  useEffect(() => {
    const supabase = createClient();
    const channels = sessions.map((session) =>
      supabase
        .channel(`session-notes-${session.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${session.id}` }, (payload) => {
          const next = payload.new as { id?: string; coach_notes?: string | null };
          setItems((current) => current.map((item) => item.id === next.id ? { ...item, coach_notes: next.coach_notes ?? null } : item));
        })
        .subscribe()
    );
    return () => {
      channels.forEach((channel) => {
        void supabase.removeChannel(channel);
      });
    };
  }, [sessions]);

  async function updateAvailability(session: ParentSessionRecord, status: 'available' | 'unavailable' | 'pending') {
    if (!session.player_id) return;
    const supabase = createClient();
    const previous = session.response_status ?? 'pending';
    await supabase.from('poll_responses').upsert({ session_id: session.id, player_id: session.player_id, status }, { onConflict: 'session_id,player_id' });
    setItems((current) => current.map((item) => item.id === session.id ? { ...item, response_status: status } : item));
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: session.id,
        team_id: session.team_id,
        title: 'Availability changed',
        message: `${session.team_name} changed from ${previous} to ${status} - ${session.opponent ?? session.title ?? session.type}`
      })
    });
  }

  return (
    <div className="space-y-3">
      {items.length === 0 ? <p className="rounded-[10px] border border-white/[0.06] bg-white/[0.02] p-5 text-sm text-white/35">No upcoming fixtures have been posted yet.</p> : items.map((session) => (
        <article key={session.id} className="rounded-2xl border p-5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <h3 className="text-lg font-bold text-white">{session.team_name} v {session.opponent ?? session.title ?? session.type}</h3>
          <p className="mt-2 text-sm text-white/40">{formatDate(session.session_date)} | {session.location ?? 'Location TBC'}</p>
          {session.coach_notes ? <p className="mt-3 text-sm italic text-white/45">{session.coach_notes}</p> : null}
          {session.tournify_link ? <a href={session.tournify_link} target="_blank" rel="noreferrer" className="mt-3 inline-block rounded-full border border-white/10 px-3 py-1 text-xs text-white">View Tournament</a> : null}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              ['available', "I'm Available", '#10b981'],
              ['unavailable', 'Not Available', '#ef4444'],
              ['pending', 'Confirm', '#f59e0b']
            ].map(([status, label, colour]) => (
              <button key={status} type="button" onClick={() => updateAvailability(session, status as 'available' | 'unavailable' | 'pending')} className="rounded-full px-3 py-2 text-xs font-semibold text-white transition-all duration-300 ease-out" style={{ backgroundColor: session.response_status === status ? colour : 'rgba(255,255,255,0.06)', border: `1px solid ${session.response_status === status ? colour : 'rgba(255,255,255,0.08)'}` }}>{label}</button>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

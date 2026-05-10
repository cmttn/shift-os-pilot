'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { CoachDashboardData } from '@/lib/dashboard/getCoachData';

interface CoachScheduleClientProps {
  data: CoachDashboardData;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return `${date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} at ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

export default function CoachScheduleClient({ data }: CoachScheduleClientProps) {
  const [sessions, setSessions] = useState(data.upcomingSessions);
  const [draftLinks, setDraftLinks] = useState<Record<string, string>>({});
  const primaryColour = data.teams[0]?.club_primary_colour ?? '#00C851';

  async function saveLink(sessionId: string) {
    const link = draftLinks[sessionId]?.trim();
    if (!link) return;
    const { error } = await createClient().from('sessions').update({ tournify_link: link }).eq('id', sessionId);
    if (!error) setSessions((current) => current.map((session) => session.id === sessionId ? { ...session, tournify_link: link } : session));
  }

  return (
    <main className="min-h-screen px-5 pb-[92px] pt-8 text-white md:ml-[260px] md:px-8" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[900px]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/30">Coach Schedule</p>
            <h1 className="mt-3 text-3xl font-black">Schedule</h1>
          </div>
          <Link href="/dashboard/coach/sessions/new" className="rounded-full px-5 py-2 text-sm font-semibold text-black" style={{ backgroundColor: primaryColour }}>Add Session +</Link>
        </div>
        <div className="mt-8 space-y-4">
          {sessions.map((session) => (
            <article key={session.id} className="rounded-2xl border p-5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em]" style={{ color: primaryColour }}>{session.type}</p>
                  <h2 className="mt-2 text-xl font-bold">{session.opponent ?? session.title ?? session.type}</h2>
                  <p className="mt-1 text-sm text-white/40">{formatDate(session.session_date)} / {session.location ?? 'Location TBC'}</p>
                </div>
                <Link href={`/dashboard/coach/sessions/${session.id}`} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white">Open</Link>
              </div>
              {session.type === 'tournament' ? (
                session.tournify_link ? <a href={session.tournify_link} target="_blank" rel="noreferrer" className="mt-4 inline-block rounded-full border border-white/10 px-4 py-2 text-sm text-white">View Tournament Bracket</a> : (
                  <div className="mt-4 rounded-2xl border border-dashed border-white/15 p-4">
                    <p className="font-semibold">Add Tournament Link</p>
                    <p className="mt-1 text-sm text-white/35">Paste your Tournify link to share the bracket with parents.</p>
                    <div className="mt-3 flex gap-2">
                      <input value={draftLinks[session.id] ?? ''} onChange={(event) => setDraftLinks((current) => ({ ...current, [session.id]: event.target.value }))} className="min-w-0 flex-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-white outline-none" placeholder="https://..." />
                      <button type="button" onClick={() => saveLink(session.id)} className="rounded-full px-4 py-2 text-sm font-semibold text-black" style={{ backgroundColor: primaryColour }}>Save</button>
                    </div>
                  </div>
                )
              ) : null}
            </article>
          ))}
        </div>
        <details className="group fixed bottom-8 right-8 z-50">
          <summary className="flex h-14 w-14 cursor-pointer list-none items-center justify-center rounded-full text-2xl font-semibold text-black shadow-2xl [&::-webkit-details-marker]:hidden" style={{ backgroundColor: primaryColour }}>+</summary>
          <div className="absolute bottom-16 right-0 flex flex-col items-end gap-2">
            {['match', 'training', 'tournament'].map((type) => <Link key={type} href={`/dashboard/coach/sessions/new?type=${type}`} className="whitespace-nowrap rounded-full border border-white/10 bg-[#161b27] px-4 py-2 text-sm capitalize text-white">{type}</Link>)}
          </div>
        </details>
      </div>
    </main>
  );
}

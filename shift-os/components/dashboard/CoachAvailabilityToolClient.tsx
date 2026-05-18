'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { CoachDashboardData } from '@/lib/dashboard/getCoachData';
import { contrastText } from '@/lib/utils/contrastText';

type AvailabilitySession = CoachDashboardData['upcomingSessions'][number] & {
  teamName: string;
  teamPrimaryColour: string;
  activePlayerCount: number;
};

interface CoachAvailabilityToolClientProps {
  sessions: AvailabilitySession[];
  primaryColour: string;
}

type PollState = 'poll_not_sent' | 'poll_sent' | 'poll_complete' | 'poll_incomplete';

function formatDateTime(value: string): { date: string; time: string } {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return { date: value, time: '' };
  return {
    date: date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
    time: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  };
}

function getPollState(session: AvailabilitySession): PollState {
  if (!session.poll_sent) return 'poll_not_sent';
  if (session.activePlayerCount <= 0) return 'poll_sent';
  if (session.pending_count === 0) return 'poll_complete';
  return 'poll_incomplete';
}

function getPollLabel(state: PollState): string {
  if (state === 'poll_not_sent') return 'Poll not sent';
  if (state === 'poll_complete') return 'Poll complete';
  if (state === 'poll_incomplete') return 'Poll incomplete';
  return 'Poll sent';
}

function getCtaLabel(state: PollState): string {
  if (state === 'poll_not_sent') return 'Send poll';
  if (state === 'poll_complete') return 'View availability';
  if (state === 'poll_incomplete') return 'Follow up';
  return 'View responses';
}

function getPollUrl(token: string | null): string {
  if (!token || typeof window === 'undefined') return '';
  return `${window.location.origin}/poll/${token}`;
}

function formatChaseStatus(session: AvailabilitySession, state: PollState): string | null {
  if (state === 'poll_not_sent') return null;
  if (state === 'poll_complete') return 'Poll complete';
  if (session.auto_chase_sent_at) return 'Auto Chase sent';
  if (session.auto_chase_enabled && session.auto_chase_due_at) {
    const due = new Date(session.auto_chase_due_at);
    if (Number.isNaN(due.valueOf())) return session.auto_chase_delay_hours ? `Auto Chase set: ${session.auto_chase_delay_hours}h` : 'Auto Chase set';
    const minutes = Math.round((due.valueOf() - Date.now()) / 60000);
    if (minutes <= 0) return 'Auto Chase due now';
    if (minutes < 60) return `Reminder due in ${minutes}m`;
    const hours = Math.round(minutes / 60);
    return `Reminder due in ${hours}h`;
  }
  return null;
}

function buildReminder(session: AvailabilitySession): string {
  const title = session.opponent ? `${session.teamName} vs ${session.opponent}` : `${session.teamName} ${session.title ?? session.type}`;
  const pollUrl = getPollUrl(session.session_token);
  return `Quick reminder: please confirm availability for ${title} if you have not already.${pollUrl ? `\n\n${pollUrl}` : ''}`;
}

export default function CoachAvailabilityToolClient({ sessions, primaryColour }: CoachAvailabilityToolClientProps) {
  const [copiedSessionId, setCopiedSessionId] = useState('');
  const primaryText = contrastText(primaryColour);

  const copyReminder = async (session: AvailabilitySession) => {
    await navigator.clipboard.writeText(buildReminder(session));
    setCopiedSessionId(session.id);
    window.setTimeout(() => setCopiedSessionId(''), 2000);
  };

  return (
    <section className="mt-6 grid gap-4 lg:grid-cols-2">
      {sessions.length === 0 ? (
        <div className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-xl font-bold text-white">No upcoming sessions</h2>
          <p className="mt-2 text-sm text-white/40">Create a match or training session to manage availability.</p>
          <Link href="/dashboard/coach/sessions/new" className="mt-5 inline-flex rounded-full px-5 py-3 text-sm font-semibold" style={{ backgroundColor: primaryColour, color: primaryText }}>
            Create session
          </Link>
        </div>
      ) : sessions.map((session) => {
        const state = getPollState(session);
        const formatted = formatDateTime(session.session_date);
        const ctaHref = `/dashboard/coach/sessions/${session.id}`;
        const badgeColour = state === 'poll_complete' ? '#10b981' : state === 'poll_incomplete' ? '#f59e0b' : state === 'poll_not_sent' ? 'rgba(255,255,255,0.35)' : primaryColour;
        const chaseStatus = formatChaseStatus(session, state);
        return (
          <article key={session.id} className="rounded-2xl border p-5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/30">{session.teamName}</p>
                <h2 className="mt-2 text-xl font-bold text-white">{session.opponent ? `vs ${session.opponent}` : session.title ?? session.type}</h2>
              </div>
              <span className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: `${badgeColour}24`, color: badgeColour }}>
                {getPollLabel(state)}
              </span>
            </div>

            <div className="mt-4 space-y-1 text-sm text-white/40">
              <p>{formatted.date}{formatted.time ? ` at ${formatted.time}` : ''}</p>
              <p>{session.full_address || session.location || 'Location TBC'}</p>
            </div>

            {chaseStatus ? (
              <p className={`mt-3 rounded-xl border px-3 py-2 text-xs ${state === 'poll_complete' ? 'border-emerald-500/10 bg-emerald-500/5 text-emerald-300/80' : 'border-white/[0.06] bg-white/[0.03] text-white/45'}`}>
                {chaseStatus}
              </p>
            ) : null}

            <div className="mt-4 grid grid-cols-4 gap-2">
              {[
                ['Available', session.available_count],
                ['Not', session.unavailable_count],
                ['Pending', session.pending_count],
                ['Week off', session.week_off_count]
              ].map(([label, count]) => (
                <div key={String(label)} className="rounded-xl bg-white/[0.04] p-3 text-center">
                  <p className="text-lg font-black text-white">{count}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-white/30">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link href={ctaHref} className="inline-flex flex-1 justify-center rounded-full px-5 py-3 text-sm font-semibold" style={{ backgroundColor: session.teamPrimaryColour, color: contrastText(session.teamPrimaryColour) }}>
                {getCtaLabel(state)}
              </Link>
              {state === 'poll_incomplete' || state === 'poll_sent' ? (
                <button type="button" onClick={() => copyReminder(session)} className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]">
                  {copiedSessionId === session.id ? 'Copied' : 'Copy reminder'}
                </button>
              ) : null}
            </div>
          </article>
        );
      })}
    </section>
  );
}

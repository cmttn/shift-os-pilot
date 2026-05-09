'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import NotificationPermission from '@/components/NotificationPermission';
import BottomNav from '@/components/mobile/BottomNav';
import type { CoachDashboardData } from '@/lib/dashboard/getCoachData';

const tools = [
  ['game_time_tracker', 'Game Time Tracker', 'Free'],
  ['availability_manager', 'Availability Manager', 'Free'],
  ['announcement_builder', 'Announcement Builder', 'Free'],
  ['fair_play_reports', 'Fair Play Reports', 'Pro'],
  ['structured_conversations', 'Structured Conversations', 'Pro'],
  ['parent_engagement', 'Parent Engagement', 'Pro']
] as const;

interface CoachDashboardClientProps {
  data: CoachDashboardData;
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
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'CO';
}

function formatDate(value: string | null): string {
  if (!value) return 'DOB not set';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function calculateAge(value: string | null): string {
  if (!value) return '';
  const dob = new Date(value);
  if (Number.isNaN(dob.valueOf())) return '';
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
  return String(age);
}

function formatSessionDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return `${date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} at ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

export default function CoachDashboardClient({ data }: CoachDashboardClientProps) {
  const [activeTeamId, setActiveTeamId] = useState(data.activeTeamId);
  const activeTeam = data.teams.find((team) => team.id === activeTeamId) ?? data.teams[0] ?? null;
  const primaryColour = activeTeam?.club_primary_colour ?? '#00C851';
  const contrastText = getContrastText(primaryColour);
  const teamPlayers = data.players.filter((player) => player.team_id === activeTeam?.id);
  const teamSessions = data.upcomingSessions.filter((session) => session.team_id === activeTeam?.id);
  const nextFixture = teamSessions.find((session) => new Date(session.session_date).valueOf() <= Date.now() + 14 * 86400000);
  const isClubManaged = Boolean(activeTeam?.is_club_managed);
  const clubName = activeTeam?.club_name ?? 'your club';
  const groupedSessions = useMemo(() => ({
    match: teamSessions.filter((session) => session.type === 'match'),
    training: teamSessions.filter((session) => session.type === 'training'),
    tournament: teamSessions.filter((session) => session.type === 'tournament')
  }), [teamSessions]);

  return (
    <main className="min-h-screen text-white" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto min-h-screen max-w-[480px] pb-[84px]">
        <header className="fixed inset-x-0 top-0 z-40 h-14 border-b backdrop-blur-xl" style={{ backgroundColor: 'rgba(8,10,15,0.9)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="mx-auto flex h-full max-w-[480px] items-center justify-between gap-3 px-4">
            <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
              {data.teams.length === 0 ? <span className="rounded-full bg-white/[0.08] px-4 py-2 text-sm text-white/45">No team</span> : data.teams.map((team) => (
                <button key={team.id} type="button" onClick={() => setActiveTeamId(team.id)} className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out" style={team.id === activeTeam?.id ? { backgroundColor: primaryColour, color: contrastText } : { backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' }}>{team.name}</button>
              ))}
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-black" style={{ backgroundColor: primaryColour, color: contrastText }}>{initials(data.coach.full_name)}</span>
          </div>
        </header>

        <div className="px-5 pt-20">
          <NotificationPermission />
          {nextFixture ? (
            <Link href={`/dashboard/coach/sessions/${nextFixture.id}`} className="mb-8 block rounded-2xl p-5 text-white shadow-2xl transition-all duration-300 ease-out hover:-translate-y-0.5" style={{ background: `linear-gradient(135deg, ${primaryColour} 0%, #06100a 100%)` }}>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">Next {nextFixture.type}</p>
              <h1 className="mt-3 text-2xl font-black">{activeTeam?.name} {nextFixture.opponent ? `v ${nextFixture.opponent}` : nextFixture.title ?? ''}</h1>
              <p className="mt-2 text-sm text-white/75">{formatSessionDate(nextFixture.session_date)}</p>
              <p className="mt-1 text-sm text-white/70">{nextFixture.full_address || nextFixture.location || 'Location TBC'}</p>
              {nextFixture.opposition_contact_name || nextFixture.opposition_contact_phone ? <p className="mt-1 text-sm text-white/70">Contact: {[nextFixture.opposition_contact_name, nextFixture.opposition_contact_phone].filter(Boolean).join(' - ')}</p> : null}
              {nextFixture.coach_notes ? <p className="mt-3 text-sm italic text-white/75">{nextFixture.coach_notes}</p> : null}
              <div className="mt-5 rounded-2xl bg-black/20 p-4">
                <p className="text-4xl font-black">{nextFixture.available_count}</p>
                <p className="text-sm text-white/70">available of {teamPlayers.length} players</p>
              </div>
              {!nextFixture.poll_sent ? <span className="mt-4 inline-block rounded-full bg-white px-4 py-2 text-sm font-semibold" style={{ color: primaryColour }}>Send Availability Poll</span> : null}
            </Link>
          ) : null}

          <section>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Your Squad</h1>
                <p className="mt-1 text-sm text-white/40">{teamPlayers.length} players</p>
              </div>
              <Link href="/dashboard/coach/players/new" className="rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out" style={{ borderColor: primaryColour, color: primaryColour }}>Add Player +</Link>
            </div>
            {teamPlayers.length === 0 ? (
              <div className="mt-5 rounded-[14px] border p-5 text-center" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <p className="font-semibold text-white">No players yet.</p>
                <p className="mt-4 text-xs uppercase tracking-[0.24em] text-white/25">Team Join Code</p>
                <p className="mt-2 font-mono text-3xl font-black tracking-[0.28em]" style={{ color: primaryColour }}>{activeTeam?.join_code ?? '------'}</p>
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {teamPlayers.map((player) => (
                  <article key={player.id} className="rounded-[14px] border p-4 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-white/15" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: primaryColour, color: contrastText }}>{initials(player.full_name)}</div>
                    <h2 className="mt-2 text-sm font-semibold text-white">{player.full_name}</h2>
                    <p className="mt-1 text-xs text-white/35">{formatDate(player.dob)}{calculateAge(player.dob) ? ` / ${calculateAge(player.dob)}` : ''}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold text-white">Schedule</h2>
              {!isClubManaged ? <Link href="/dashboard/coach/fixtures/import" className="rounded-full border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: primaryColour, color: primaryColour }}>Import CSV</Link> : null}
            </div>
            {isClubManaged ? <p className="mt-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-white/35">Fixtures managed by {clubName}. You can add notes and send polls.</p> : null}
            {[
              ['Upcoming Matches', 'match', groupedSessions.match],
              ['Upcoming Training', 'training', groupedSessions.training],
              ['Upcoming Tournaments', 'tournament', groupedSessions.tournament]
            ].map(([label, type, sessions]) => (
              <div key={String(type)} className="mt-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-widest text-white/30">{String(label)}</p>
                  {!isClubManaged ? <Link href={`/dashboard/coach/sessions/new?type=${type}`} className="rounded-full border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: primaryColour, color: primaryColour }}>Add Session +</Link> : null}
                </div>
                {(sessions as typeof data.upcomingSessions).length === 0 ? <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-white/35">Nothing scheduled.</p> : (sessions as typeof data.upcomingSessions).map((session) => (
                  <Link key={session.id} href={`/dashboard/coach/sessions/${session.id}`} className="mb-3 block rounded-xl border p-4 transition-all duration-300 ease-out hover:-translate-y-0.5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <p className="text-sm font-semibold" style={{ color: primaryColour }}>{activeTeam?.name} v {session.opponent ?? session.title ?? 'Session'} <span className="ml-2 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] uppercase text-white/45">{session.type}</span></p>
                    <h3 className="mt-1 text-lg font-bold text-white">{formatSessionDate(session.session_date)}</h3>
                    <p className="mt-2 text-sm text-white/35">{session.full_address || session.location || 'Location TBC'}</p>
                    {session.opposition_contact_name || session.opposition_contact_phone ? <p className="mt-2 text-xs text-white/35">Call: {[session.opposition_contact_name, session.opposition_contact_phone].filter(Boolean).join(' - ')}</p> : null}
                    <p className="mt-3 text-xs text-white/45">Available {session.available_count} / No {session.unavailable_count} / Pending {session.pending_count} / Week off {session.week_off_count}</p>
                    {session.coach_notes ? <p className="mt-2 text-xs italic text-white/35">{session.coach_notes.slice(0, 60)}</p> : null}
                    {session.tournify_link ? <span className="mt-3 inline-block rounded-full border border-white/10 px-3 py-1 text-xs text-white">View Bracket</span> : null}
                    <span className="mt-3 inline-block rounded-full px-3 py-1.5 text-xs font-semibold" style={session.poll_sent ? { border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' } : { backgroundColor: primaryColour, color: contrastText }}>{session.poll_sent ? 'View Responses' : 'Send Poll'}</span>
                  </Link>
                ))}
              </div>
            ))}
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold text-white">Your Tools</h2>
            <p className="mt-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-white/40">{isClubManaged ? `Tools managed by ${clubName}` : 'Manage your own tools'}</p>
            <div className="mt-4 space-y-3">
              {tools.map(([key, name, tier]) => {
                const enabled = isClubManaged ? data.enabledFeatures.includes(key) : true;
                return (
                  <article key={key} className={`rounded-xl border p-4 transition-all duration-300 ease-out ${enabled ? '' : 'opacity-45'}`} style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center justify-between gap-3">
                      <div><p className="font-semibold text-white">{name}</p><p className="text-xs text-white/35">{tier}</p></div>
                      <span className="text-xs text-white/40">{enabled ? (isClubManaged ? `Enabled by ${clubName}` : 'Enabled') : 'Not enabled by your club'}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </div>
      <BottomNav primaryColour={primaryColour} items={[
        { href: '/dashboard/coach', label: 'Squad', icon: 'S' },
        { href: '/dashboard/coach/schedule', label: 'Schedule', icon: 'C' },
        { href: '/dashboard/coach/stats', label: 'Stats', icon: 'D' },
        { href: '/dashboard/coach/messages', label: 'Messages', icon: 'M' },
        { href: '/dashboard/coach/profile', label: 'Profile', icon: 'P' }
      ]} />
    </main>
  );
}

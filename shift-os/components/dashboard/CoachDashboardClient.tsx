'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { CoachDashboardData } from '@/lib/dashboard/getCoachData';
import { contrastText as getContrastText } from '@/lib/utils/contrastText';

const tools = [
  ['game_time_tracker', 'Game Time Tracker', 'Free', 'Track minutes played per player', '/dashboard/coach'],
  ['availability_manager', 'Availability Manager', 'Free', 'Send polls and track player availability', '/dashboard/coach/schedule'],
  ['announcement_builder', 'Announcement Builder', 'Free', 'Send updates to coaches and parents', '/dashboard/coach/messages'],
  ['fair_play_reports', 'Fair Play Reports', 'Pro', 'Full game time reports', '/dashboard/coach/stats'],
  ['structured_conversations', 'Structured Conversations', 'Pro', 'Structured ticket workflows', '/dashboard/coach/tickets'],
  ['parent_engagement', 'Parent Engagement', 'Pro', 'Track parent response rates', '/dashboard/coach/stats'],
  ['potm', 'Player of the Match', 'Pro (unlocked for testing)', 'Run automated POTM polls and generate social cards', '/dashboard/coach/tools/potm']
] as const;

interface CoachDashboardClientProps {
  data: CoachDashboardData;
  initialActiveTeamId?: string | null;
}

interface RecentPotm {
  playerName: string;
  opponent: string;
  date: string;
}

interface PotmStatRow {
  player_id: string;
  last_won_at: string | null;
  last_session_id: string | null;
}

interface PlayerNameRow {
  first_name: string | null;
  last_name: string | null;
}

interface SessionOpponentRow {
  opponent: string | null;
  title: string | null;
}

interface QuickInviteResult {
  playerId: string;
  playerFirstName: string;
  teamName: string;
  inviteUrl: string;
  message: string;
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'CO';
}

function formatDate(value: string | null): string {
  if (!value) return '';
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

function formatCompactSessionDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return `${date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · KO ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

function getInviteDot(player: CoachDashboardData['players'][number]): { colour: string; label: string } {
  if (player.parent_user_id || player.invite_status === 'accepted') return { colour: '#10b981', label: 'Parent linked' };
  if (player.invite_status === 'sent') return { colour: '#f59e0b', label: 'Invite sent' };
  return { colour: 'rgba(255,255,255,0.35)', label: 'Not yet invited' };
}

function getFanBadge(player: CoachDashboardData['players'][number]): { label: string; className: string; title?: string } {
  if (player.fa_fan_number && player.fa_fan_verified) {
    return { label: 'FA ✓', className: 'bg-emerald-500/10 text-emerald-400' };
  }
  if (player.fa_fan_number) {
    return { label: 'FAN added', className: 'bg-amber-500/10 text-amber-300' };
  }
  return {
    label: 'No FAN',
    className: 'bg-white/[0.06] text-white/35',
    title: 'Ask the parent to add their FA number via the invite link'
  };
}

export default function CoachDashboardClient({ data, initialActiveTeamId }: CoachDashboardClientProps) {
  const router = useRouter();
  const validInitialTeamId = initialActiveTeamId && data.teams.some((team) => team.id === initialActiveTeamId) ? initialActiveTeamId : data.activeTeamId;
  const [activeTeamId, setActiveTeamId] = useState(validInitialTeamId);
  const [teamMenuOpen, setTeamMenuOpen] = useState(false);
  const [recentPotm, setRecentPotm] = useState<RecentPotm | null>(null);
  const [quickInviteName, setQuickInviteName] = useState('');
  const [quickInviteResult, setQuickInviteResult] = useState<QuickInviteResult | null>(null);
  const [quickInviteError, setQuickInviteError] = useState('');
  const [quickInviteLoading, setQuickInviteLoading] = useState(false);
  const [quickInviteCopied, setQuickInviteCopied] = useState(false);
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

  const switchTeam = (teamId: string) => {
    setActiveTeamId(teamId);
    setTeamMenuOpen(false);
    router.push(`/dashboard/coach?team=${teamId}`);
  };

  useEffect(() => {
    async function loadRecentPotm() {
      if (!activeTeam?.id) {
        setRecentPotm(null);
        return;
      }
      const since = new Date(Date.now() - 7 * 86400000).toISOString();
      const supabase = createClient();
      const { data: stat } = await supabase
        .from('potm_stats')
        .select('player_id,last_won_at,last_session_id')
        .eq('team_id', activeTeam.id)
        .gte('last_won_at', since)
        .order('last_won_at', { ascending: false })
        .limit(1)
        .maybeSingle<PotmStatRow>();
      if (!stat) {
        setRecentPotm(null);
        return;
      }
      const [{ data: player }, { data: session }] = await Promise.all([
        supabase.from('players').select('first_name,last_name').eq('id', stat.player_id).maybeSingle<PlayerNameRow>(),
        stat.last_session_id ? supabase.from('sessions').select('opponent,title').eq('id', stat.last_session_id).maybeSingle<SessionOpponentRow>() : Promise.resolve({ data: null })
      ]);
      const playerName = [player?.first_name, player?.last_name].map((part) => part?.trim()).filter(Boolean).join(' ') || 'Player';
      const opponent = session?.opponent ?? session?.title ?? 'Match';
      setRecentPotm({ playerName, opponent, date: stat.last_won_at ? formatDate(stat.last_won_at) : '' });
    }
    void loadRecentPotm();
  }, [activeTeam?.id]);

  const getInviteUrl = (token: string): string => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || window.location.origin;
    return `${siteUrl}/invite/player/${token}`;
  };

  const buildInviteMessage = (playerFirstName: string, teamName: string, inviteUrl: string): string =>
    `We would like to invite ${playerFirstName} to join ${teamName} on SHIFT OS.\n\nFollow this link to get connected:\n${inviteUrl}`;

  const markQuickInviteSent = async () => {
    if (!quickInviteResult) return;
    await createClient()
      .from('players')
      .update({ invite_status: 'sent', invite_sent_at: new Date().toISOString() })
      .eq('id', quickInviteResult.playerId);
  };

  const copyQuickInviteMessage = async () => {
    if (!quickInviteResult) return;
    await markQuickInviteSent();
    await navigator.clipboard.writeText(quickInviteResult.message);
    setQuickInviteCopied(true);
    window.setTimeout(() => setQuickInviteCopied(false), 2000);
  };

  const createQuickInvite = async () => {
    if (!activeTeam?.id) {
      setQuickInviteError('Choose a team before creating an invite.');
      return;
    }

    const playerFirstName = quickInviteName.trim();
    if (!playerFirstName) {
      setQuickInviteError('Enter the player first name to generate the invite.');
      return;
    }

    setQuickInviteLoading(true);
    setQuickInviteError('');
    setQuickInviteResult(null);

    try {
      const inviteToken = crypto.randomUUID();
      const { data: player, error } = await createClient()
        .from('players')
        .insert({
          team_id: activeTeam.id,
          first_name: playerFirstName,
          last_name: '',
          age_group: activeTeam.age_group,
          dob: null,
          is_active: true,
          invite_token: inviteToken,
          invite_status: 'pending'
        })
        .select('id')
        .single<{ id: string }>();

      if (error || !player) throw new Error(error?.message ?? 'Player invite could not be created.');

      const teamName = activeTeam.name;
      const inviteUrl = getInviteUrl(inviteToken);
      setQuickInviteResult({
        playerId: player.id,
        playerFirstName,
        teamName,
        inviteUrl,
        message: buildInviteMessage(playerFirstName, teamName, inviteUrl)
      });
      setQuickInviteName('');
      router.refresh();
    } catch (inviteError) {
      setQuickInviteError(inviteError instanceof Error ? inviteError.message : 'Unable to create that invite.');
    } finally {
      setQuickInviteLoading(false);
    }
  };

  const renderQuickInvitePanel = () => (
    <div className="mt-5 rounded-[14px] border p-5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <p className="font-semibold text-white">Invite a player</p>
      <p className="mt-1 text-sm text-white/35">Add a first name and send the parent a secure setup link.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={quickInviteName}
          onChange={(event) => setQuickInviteName(event.target.value)}
          placeholder="Player first name"
          className="min-h-11 flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-white/25 placeholder:text-white/25"
        />
        <button
          type="button"
          onClick={createQuickInvite}
          disabled={quickInviteLoading}
          className="min-h-11 rounded-full px-5 text-sm font-semibold transition-all duration-300 ease-out hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-55"
          style={{ backgroundColor: primaryColour, color: contrastText }}
        >
          {quickInviteLoading ? 'Creating...' : 'Generate Invite'}
        </button>
      </div>
      {quickInviteError ? <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">{quickInviteError}</p> : null}
      {quickInviteResult ? (
        <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
          <p className="text-sm font-semibold text-white">{quickInviteResult.playerFirstName}&apos;s invite is ready</p>
          <code className="mt-3 block truncate rounded-lg bg-white/[0.06] px-3 py-2 font-mono text-xs text-white">{quickInviteResult.inviteUrl}</code>
          <p className="mt-3 whitespace-pre-line text-xs leading-relaxed text-white/45">{quickInviteResult.message}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={copyQuickInviteMessage} className="rounded-full px-4 py-2 text-sm font-semibold" style={{ backgroundColor: primaryColour, color: contrastText }}>
              {quickInviteCopied ? 'Copied ✓' : 'Copy Invite Message'}
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(quickInviteResult.message)}`} onClick={() => { void markQuickInviteSent(); }} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-white/[0.06]">
              Share via WhatsApp
            </a>
          </div>
        </div>
      ) : null}
      <Link href="/dashboard/coach/players/new" className="mt-4 inline-flex text-sm font-semibold" style={{ color: primaryColour }}>
        Add full player details instead →
      </Link>
    </div>
  );

  return (
    <main className="min-h-screen text-white" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto min-h-screen max-w-[480px] pb-[84px] md:ml-[260px] md:max-w-[900px] md:px-8 md:pb-12">
        <header className="mx-5 mt-5 rounded-2xl border p-3 backdrop-blur-xl md:mx-0 md:mt-0 md:border-b-0 md:bg-transparent md:p-0 md:pt-8" style={{ backgroundColor: 'rgba(255,255,255,0.035)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="mx-auto flex h-full max-w-[480px] items-center justify-between gap-3 md:max-w-[900px] md:px-0">
            <div className="relative flex min-w-0 flex-1">
              {data.teams.length <= 1 ? (
                <span className="rounded-full px-4 py-2 text-sm font-semibold" style={{ backgroundColor: primaryColour, color: contrastText }}>{activeTeam?.name ?? 'No team'}</span>
              ) : (
                <>
                  <button type="button" onClick={() => setTeamMenuOpen((open) => !open)} className="rounded-full px-4 py-2 text-sm font-semibold" style={{ backgroundColor: primaryColour, color: contrastText }}>
                    {activeTeam?.name ?? 'Switch team'} <span className="ml-1">↓</span>
                  </button>
                  {teamMenuOpen ? (
                    <div className="absolute left-0 top-12 z-30 w-72 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0d1117] shadow-2xl">
                      {data.teams.map((team) => (
                        <button key={team.id} type="button" onClick={() => switchTeam(team.id)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-white/[0.04]">
                          <span>
                            <span className="block font-semibold text-white">{team.name}</span>
                            <span className="mt-0.5 block text-xs text-white/35">{[team.age_group, team.club_name].filter(Boolean).join(' / ') || 'Independent team'}</span>
                          </span>
                          {team.id === activeTeam?.id ? <span style={{ color: primaryColour }}>✓</span> : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-black" style={{ backgroundColor: primaryColour, color: contrastText }}>{initials(data.coach.full_name)}</span>
          </div>
        </header>

        <div className="px-5 pt-5 md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)] md:gap-6 md:px-0 md:pt-8">
          <div>
          {recentPotm ? (
            <div className="mb-4 flex h-11 items-center rounded-xl border px-4 text-sm text-white" style={{ backgroundColor: `${primaryColour}1a`, borderColor: `${primaryColour}33` }}>
              <span className="mr-2" style={{ color: primaryColour }}>🏆</span>
              <span className="truncate">Last POTM: {recentPotm.playerName} vs {recentPotm.opponent} · {recentPotm.date}</span>
            </div>
          ) : null}
          {nextFixture ? (
            <section className="mb-8 block max-h-[220px] overflow-hidden rounded-2xl p-4 text-white shadow-2xl transition-all duration-300 ease-out hover:-translate-y-0.5 md:max-h-none md:p-5" style={{ background: `linear-gradient(135deg, ${primaryColour} 0%, #06100a 100%)` }}>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">Next {nextFixture.type}</p>
              <h1 className="mt-2 truncate text-lg font-bold md:mt-3 md:text-2xl md:font-black">{activeTeam?.name} {nextFixture.opponent ? `v ${nextFixture.opponent}` : nextFixture.title ?? ''}</h1>
              <p className="mt-1 text-sm text-white/75 md:hidden">{formatCompactSessionDate(nextFixture.session_date)}</p>
              <p className="mt-2 hidden text-sm text-white/75 md:block">{formatSessionDate(nextFixture.session_date)}</p>
              <p className="mt-1 truncate text-sm text-white/70">{nextFixture.full_address || nextFixture.location || 'Location TBC'}</p>
              {nextFixture.opposition_contact_name || nextFixture.opposition_contact_phone ? <p className="mt-1 text-sm text-white/70">Contact: {[nextFixture.opposition_contact_name, nextFixture.opposition_contact_phone].filter(Boolean).join(' - ')}</p> : null}
              {nextFixture.coach_notes ? <p className="mt-2 line-clamp-2 text-xs italic text-white/75 md:mt-3 md:text-sm">{nextFixture.coach_notes} <span className="text-white/45">Read more</span></p> : null}
              <div className="mt-3 rounded-xl bg-black/20 p-3 md:mt-5 md:rounded-2xl md:p-4">
                <p className="hidden text-4xl font-black md:block">{nextFixture.available_count}</p>
                <p className="text-sm text-white/70">{nextFixture.available_count} of {teamPlayers.length} available</p>
                <p className="mt-1 text-xs text-white/65 md:hidden">✓ {nextFixture.available_count} &nbsp; × {nextFixture.unavailable_count} &nbsp; ? {nextFixture.pending_count}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 md:mt-4">
                <Link href={`/dashboard/coach/sessions/${nextFixture.id}`} className="inline-block rounded-full bg-white px-4 py-2 text-sm font-semibold" style={{ color: primaryColour }}>{nextFixture.poll_sent ? 'View Responses' : 'Send Availability Poll'}</Link>
                {nextFixture.type === 'match' ? <Link href={`/dashboard/coach/sessions/${nextFixture.id}/potm`} className="inline-block rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white">POTM Poll</Link> : null}
              </div>
            </section>
          ) : null}

          <section className="md:hidden">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Your Squad</h1>
                <p className="mt-1 text-sm text-white/40">{teamPlayers.length} players</p>
              </div>
              <Link href="/dashboard/coach/players/new" className="rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out" style={{ borderColor: primaryColour, color: primaryColour }}>Add Player +</Link>
            </div>
            {teamPlayers.length === 0 ? (
              renderQuickInvitePanel()
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {teamPlayers.map((player) => (
                  <article key={player.id} className="rounded-[14px] border p-4 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-white/15" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: primaryColour, color: contrastText }}>
                      {initials(player.full_name)}
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-[#0d1117]" style={{ backgroundColor: getInviteDot(player).colour }} title={getInviteDot(player).label} />
                    </div>
                    <h2 className="mt-2 text-sm font-semibold text-white">{player.full_name}</h2>
                    {player.dob ? <p className="mt-1 text-xs text-white/35">{formatDate(player.dob)}{calculateAge(player.dob) ? ` / ${calculateAge(player.dob)}` : ''}</p> : null}
                    <span className={`mt-3 inline-flex rounded-full px-2 py-0.5 text-xs ${getFanBadge(player).className}`} title={getFanBadge(player).title}>{getFanBadge(player).label}</span>
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
          </div>

          <aside className="hidden md:block">
            <section>
              <div className="flex items-end justify-between gap-4">
                <div><h1 className="text-2xl font-bold text-white">Your Squad</h1><p className="mt-1 text-sm text-white/40">{teamPlayers.length} players</p></div>
                <Link href="/dashboard/coach/players/new" className="rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: primaryColour, color: primaryColour }}>Add Player +</Link>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {teamPlayers.length === 0 ? (
                  <div className="col-span-2">{renderQuickInvitePanel()}</div>
                ) : teamPlayers.map((player) => (
                  <article key={player.id} className="rounded-[14px] border p-4" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: primaryColour, color: contrastText }}>
                      {initials(player.full_name)}
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-[#0d1117]" style={{ backgroundColor: getInviteDot(player).colour }} title={getInviteDot(player).label} />
                    </div>
                    <h2 className="mt-2 text-sm font-semibold text-white">{player.full_name}</h2>
                    {player.dob ? <p className="mt-1 text-xs text-white/35">{formatDate(player.dob)}</p> : null}
                    <span className={`mt-3 inline-flex rounded-full px-2 py-0.5 text-xs ${getFanBadge(player).className}`} title={getFanBadge(player).title}>{getFanBadge(player).label}</span>
                  </article>
                ))}
              </div>
            </section>
          </aside>

          <section className="mt-8">
            <h2 className="text-2xl font-bold text-white">Your Tools</h2>
            <p className="mt-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-white/40">{isClubManaged ? `Tools managed by ${clubName}` : 'Manage your own tools'}</p>
            <div className="mt-4 space-y-3">
              {tools.map(([key, name, tier, description, href]) => {
                const enabled = key === 'potm' ? true : isClubManaged ? data.enabledFeatures.includes(key) : true;
                return (
                  <Link href={href} key={key} className={`block rounded-xl border p-4 transition-all duration-300 ease-out hover:-translate-y-0.5 ${enabled ? '' : 'opacity-45'}`} style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center justify-between gap-3">
                      <div><p className="font-semibold text-white">{key === 'potm' ? 'Player of the Match' : name}</p><p className="text-xs text-white/35">{description}</p><p className="mt-1 text-xs text-white/25">{tier}</p></div>
                      <span className="text-xs text-white/40">{enabled ? (isClubManaged ? `Enabled by ${clubName}` : 'Enabled') : 'Not enabled by your club'}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

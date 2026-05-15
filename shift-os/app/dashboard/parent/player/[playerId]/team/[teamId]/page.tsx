import Link from 'next/link';
import { redirect } from 'next/navigation';
import ParentFixturesClient from '@/components/dashboard/ParentFixturesClient';
import { GoalAwardTrigger, type GoalAwardSession } from '@/components/dashboard/GoalAwardSheet';
import ParentQuickSwitcher, { type ParentQuickSwitchOption } from '@/components/dashboard/ParentQuickSwitcher';
import PlayerAccessTree from '@/components/dashboard/PlayerAccessTree';
import { getParentDashboardData } from '@/lib/dashboard/getParentDashboardData';
import { createClient } from '@/lib/supabase/server';
import { getCategoryMeta, getCurrentSeason, MILESTONES, type MilestoneId, type ParentStarCategory } from '@/lib/tools/starCategories';

interface ParentPlayerTeamDashboardPageProps {
  params: {
    playerId: string;
    teamId: string;
  };
}

interface PotmStatRow {
  player_id: string;
  last_won_at: string | null;
  last_session_id: string | null;
}

interface PlayerNameRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface SessionRow {
  id: string;
  opponent: string | null;
  title: string | null;
  session_date: string;
}

interface PollCardRow {
  social_card_url: string | null;
}

interface GoalCategoryRow {
  category: ParentStarCategory;
}

interface GoalTotalRow {
  total_stars: number | null;
}

interface PastSessionRow extends GoalAwardSession {}

interface MilestoneHistoryRow {
  milestone_id: MilestoneId;
  opponent: string | null;
  session_date: string | null;
  achieved_at: string | null;
}

function fullName(player: PlayerNameRow | null): string {
  return [player?.first_name, player?.last_name].map((part) => part?.trim()).filter(Boolean).join(' ') || 'Player';
}

function formatDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function sessionType(value: string | undefined): string {
  if (value === 'match') return 'Match';
  if (value === 'tournament') return 'Tournament';
  return 'Training';
}

function sessionLabel(session: { type?: string; opponent: string | null; title: string | null; session_date?: string } | null): string {
  if (!session) return 'next session';
  const opponent = session.opponent ? ` vs ${session.opponent}` : session.title ? ` - ${session.title}` : '';
  const date = session.session_date ? ` | ${formatDate(session.session_date)}` : '';
  return `${sessionType(session.type)}${opponent}${date}`;
}

function buildSwitcherOptions(
  playerId: string,
  teamId: string,
  data: NonNullable<Awaited<ReturnType<typeof getParentDashboardData>>>
): { label: string; options: ParentQuickSwitchOption[] } | null {
  const hasMultiplePlayers = data.players.length > 1;
  const player = data.players.find((item) => item.id === playerId);
  if (!player) return null;

  if (hasMultiplePlayers) {
    return {
      label: player.full_name,
      options: data.players
        .filter((item) => item.id !== playerId)
        .flatMap((item) => item.teams.slice(0, 1).map((team) => ({
          href: `/dashboard/parent/player/${item.id}/team/${team.team_id}`,
          label: item.full_name,
          sublabel: team.team_name
        })))
    };
  }

  if (player.teams.length > 1) {
    const currentTeam = player.teams.find((item) => item.team_id === teamId);
    return {
      label: currentTeam?.team_name ?? 'Switch team',
      options: player.teams
        .filter((item) => item.team_id !== teamId)
        .map((team) => ({
          href: `/dashboard/parent/player/${player.id}/team/${team.team_id}`,
          label: team.team_name,
          sublabel: team.club_name ?? 'Team'
        }))
    };
  }

  return null;
}

function milestoneLabel(id: string): string {
  return MILESTONES.find((milestone) => milestone.id === id)?.label ?? id;
}

function medicalStatus(player: NonNullable<Awaited<ReturnType<typeof getParentDashboardData>>>['players'][number]): string {
  if (player.medical_no_known) return 'Medical info: No known';
  if (player.medical_notes?.trim()) return 'Medical info: Yes';
  return 'Medical info: Pending';
}

function socialStatus(player: NonNullable<Awaited<ReturnType<typeof getParentDashboardData>>>['players'][number]): string {
  if (player.social_media_consent === true) return 'Social media: Consent given';
  if (player.social_media_consent === false) return 'Social media: No consent';
  return 'Social media: Pending';
}

export default async function ParentPlayerTeamDashboardPage({ params }: ParentPlayerTeamDashboardPageProps) {
  const data = await getParentDashboardData();
  if (!data) redirect('/dashboard/player/welcome');

  const player = data.players.find((item) => item.id === params.playerId);
  if (!player) redirect('/dashboard/parent');

  const team = player.teams.find((item) => item.team_id === params.teamId);
  if (!team) redirect('/dashboard/parent');

  const hasMultiplePlayers = data.players.length > 1;
  const hasMultipleTeams = player.teams.length > 1;
  const heroSession = team.upcoming_sessions[0] ?? null;
  const backUrl = hasMultiplePlayers
    ? '/dashboard/parent'
    : hasMultipleTeams
      ? `/dashboard/parent/player/${player.id}`
      : '/dashboard/parent';
  const switcher = buildSwitcherOptions(player.id, team.team_id, data);
  const supabase = await createClient();
  const now = new Date();
  const season = getCurrentSeason();
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const [{ data: latestPotm }, { data: playerPotm }] = await Promise.all([
    supabase.from('potm_stats').select('player_id,last_won_at,last_session_id').eq('team_id', team.team_id).gte('last_won_at', since).order('last_won_at', { ascending: false }).limit(1).maybeSingle<PotmStatRow>(),
    supabase.from('potm_stats').select('player_id,last_won_at,last_session_id').eq('team_id', team.team_id).eq('player_id', player.id).gte('last_won_at', since).order('last_won_at', { ascending: false }).limit(1).maybeSingle<PotmStatRow>()
  ]);
  const potmPlayerIds = Array.from(new Set([latestPotm?.player_id, playerPotm?.player_id].filter((id): id is string => Boolean(id))));
  const sessionIds = Array.from(new Set([latestPotm?.last_session_id, playerPotm?.last_session_id].filter((id): id is string => Boolean(id))));
  const [{ data: potmPlayers }, { data: potmSessions }, { data: cardPoll }] = await Promise.all([
    potmPlayerIds.length > 0 ? supabase.from('players').select('id,first_name,last_name').in('id', potmPlayerIds) : Promise.resolve({ data: [] as PlayerNameRow[] }),
    sessionIds.length > 0 ? supabase.from('sessions').select('id,opponent,title,session_date').in('id', sessionIds) : Promise.resolve({ data: [] as SessionRow[] }),
    playerPotm?.last_session_id ? supabase.from('potm_polls').select('social_card_url').eq('session_id', playerPotm.last_session_id).eq('winner_player_id', player.id).maybeSingle<PollCardRow>() : Promise.resolve({ data: null })
  ]);
  const latestPotmPlayer = (potmPlayers ?? []).find((item) => item.id === latestPotm?.player_id) ?? null;
  const latestPotmSession = (potmSessions ?? []).find((item) => item.id === latestPotm?.last_session_id) ?? null;
  const playerPotmSession = (potmSessions ?? []).find((item) => item.id === playerPotm?.last_session_id) ?? null;

  const [
    { data: nextGoal },
    { data: goalTotal },
    { data: recentPastSessions },
    { data: milestoneRows }
  ] = await Promise.all([
    heroSession ? supabase.from('player_star_goals').select('category').eq('player_id', player.id).eq('session_id', heroSession.id).maybeSingle<GoalCategoryRow>() : Promise.resolve({ data: null }),
    supabase.from('player_star_totals').select('total_stars').eq('player_id', player.id).eq('season', season).maybeSingle<GoalTotalRow>(),
    supabase.from('sessions').select('id,type,opponent,title,session_date').eq('team_id', team.team_id).eq('is_active', true).lt('session_date', now.toISOString()).gte('session_date', weekAgo).order('session_date', { ascending: false }).limit(5),
    supabase.from('player_milestone_achievements').select('milestone_id,opponent,session_date,achieved_at').eq('player_id', player.id).order('achieved_at', { ascending: false })
  ]);
  const pastSessions = (recentPastSessions ?? []) as PastSessionRow[];
  const { data: awardedPastGoals } = pastSessions.length > 0
    ? await supabase.from('player_stars').select('session_id').eq('player_id', player.id).in('session_id', pastSessions.map((session) => session.id))
    : { data: [] as Array<{ session_id: string | null }> };
  const awardedSessionIds = new Set(((awardedPastGoals ?? []) as Array<{ session_id: string | null }>).map((row) => row.session_id).filter((id): id is string => Boolean(id)));
  const unawardedSession = pastSessions.find((session) => !awardedSessionIds.has(session.id)) ?? null;
  const goalsTotal = goalTotal?.total_stars ?? 0;
  const scoreline = (
    <Link
      href={`/dashboard/parent/stars/${player.id}`}
      className="border-l pl-3 text-sm font-bold tabular-nums text-white transition-colors duration-300 ease-out hover:text-white/70"
      style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      aria-label={`${goalsTotal} goals this season`}
    >
      <span className="mr-1 text-sm">⚽</span>{goalsTotal}
    </Link>
  );

  const headerActions = (
    <div className="flex items-center gap-3">
      {switcher ? <ParentQuickSwitcher label={switcher.label} options={switcher.options} /> : null}
      {scoreline}
    </div>
  );

  const nextGoalPrompt = heroSession ? (
    <section
      className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4"
      style={{ borderLeft: `3px solid ${nextGoal ? getCategoryMeta(nextGoal.category).colour : team.club_primary_colour}` }}
    >
      {nextGoal ? (
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">{getCategoryMeta(nextGoal.category).label}</p>
            <p className="mt-1 text-xs text-white/40">{player.first_name}&apos;s goal for {sessionLabel(heroSession)}</p>
          </div>
          <Link href={`/dashboard/parent/stars/goal/${heroSession.id}/${player.id}`} className="shrink-0 text-xs text-white/30 transition-colors duration-300 ease-out hover:text-white">Change -&gt;</Link>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">Set a goal for {player.first_name}&apos;s next session</p>
            <p className="mt-1 text-xs text-white/40">{sessionLabel(heroSession)}</p>
          </div>
          <Link href={`/dashboard/parent/stars/goal/${heroSession.id}/${player.id}`} className="shrink-0 text-sm font-semibold" style={{ color: team.club_primary_colour }}>Set goal -&gt;</Link>
        </div>
      )}
    </section>
  ) : null;

  const unawardedTrigger = unawardedSession ? (
    <GoalAwardTrigger
      playerId={player.id}
      playerName={player.first_name || player.full_name}
      session={unawardedSession}
      primaryColour={team.club_primary_colour}
    />
  ) : null;

  const beforeHero = unawardedTrigger || nextGoalPrompt ? (
    <div className="space-y-3">
      {unawardedTrigger}
      {nextGoalPrompt}
    </div>
  ) : null;

  const milestoneHistory = ((milestoneRows ?? []) as MilestoneHistoryRow[]).filter((row) => Boolean(row.milestone_id));
  const milestoneStrip = milestoneHistory.length > 0 ? (
    <section>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-white/30">{player.first_name}&apos;s milestones</h2>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {milestoneHistory.map((milestone) => (
          <article key={`${milestone.milestone_id}-${milestone.achieved_at ?? ''}`} className="min-w-40 shrink-0 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-sm font-semibold text-white">{milestoneLabel(milestone.milestone_id)}</p>
            <p className="mt-1 text-xs text-white/35">vs {milestone.opponent ?? 'Match'}</p>
            <p className="mt-0.5 text-xs text-white/25">{formatDate(milestone.session_date ?? milestone.achieved_at)}</p>
            <p className="mt-2 text-xs text-emerald-400/60">+3 goals</p>
          </article>
        ))}
      </div>
    </section>
  ) : null;

  return (
    <main className="min-h-screen text-white" style={{ backgroundColor: '#080a0f' }}>
      <header className="hidden h-16 items-center justify-between border-b px-8 md:flex" style={{ backgroundColor: 'rgba(8,10,15,0.95)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <a href={backUrl} className="text-sm text-white/45 transition-all duration-300 ease-out hover:text-white">Back</a>
        <div className="flex items-center gap-3">
          {team.club_badge_url ? (
            <img src={team.club_badge_url} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <span className="h-10 w-10 rounded-full" style={{ backgroundColor: team.club_primary_colour }} />
          )}
          <span className="text-center">
            <span className="block text-sm font-bold text-white">{team.team_name}</span>
            <span className="block text-xs text-white/35">{team.club_name ?? 'Independent team'}</span>
          </span>
        </div>
        {headerActions}
      </header>

      <section className="px-5 pb-24 pt-5 md:hidden">
        <div className="mx-auto max-w-[480px]">
          <header className="flex items-center gap-3">
            <a href={backUrl} className="text-sm text-white/45 transition-all duration-300 ease-out hover:text-white">Back</a>
            <div className="ml-auto">{headerActions}</div>
          </header>
          <div className="mt-4 flex items-center justify-end gap-3">
            {team.club_badge_url ? <img src={team.club_badge_url} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="h-10 w-10 rounded-full" style={{ backgroundColor: team.club_primary_colour }} />}
            <span className="text-right">
              <span className="block text-sm font-bold text-white">{team.team_name}</span>
              <span className="block text-xs text-white/35">{team.club_name ?? 'Independent team'}</span>
            </span>
          </div>

          {latestPotm ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.06]" style={{ backgroundColor: `${team.club_primary_colour}14` }}>
              <p className="whitespace-nowrap px-4 py-2 text-sm text-white/75 [animation:ticker_20s_linear_infinite] hover:[animation-play-state:paused]">Player of the Match: {fullName(latestPotmPlayer)} vs {latestPotmSession?.opponent ?? latestPotmSession?.title ?? 'the opposition'}</p>
            </div>
          ) : null}

          <section className="mt-8">
            <h1 className="mt-2 text-3xl font-black text-white">{player.full_name}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full px-3 py-1 text-xs font-semibold text-black" style={{ backgroundColor: team.club_primary_colour }}>{team.age_group ?? 'Age TBC'}</span>
              <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/55">{team.gender ?? 'Mixed'}</span>
              <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/55">{medicalStatus(player)}</span>
              <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/55">{socialStatus(player)}</span>
            </div>
          </section>

          {playerPotm ? (
            <section className="mt-5 rounded-2xl border p-5" style={{ backgroundColor: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.4)' }}>
              <h2 className="text-xl font-black text-amber-300">Player of the Match: {player.full_name}</h2>
              <p className="mt-2 text-sm text-white/45">{team.team_name} vs {playerPotmSession?.opponent ?? playerPotmSession?.title ?? 'Match'} | {formatDate(playerPotm?.last_won_at)}</p>
              {cardPoll?.social_card_url ? <img src={cardPoll.social_card_url} alt="" className="mt-4 w-full rounded-xl border border-white/10" /> : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {cardPoll?.social_card_url ? <a href={cardPoll.social_card_url} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-4 py-2 text-sm text-white">Download Card</a> : null}
                <a href={`https://wa.me/?text=${encodeURIComponent(`${player.full_name} is Player of the Match for ${team.team_name}!`)}`} className="rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white">Share on WhatsApp</a>
              </div>
            </section>
          ) : null}

          <div className="mt-5">
            <PlayerAccessTree
              playerName={player.first_name || player.full_name}
              primaryParents={player.access.parents}
              familyMembers={player.access.familyMembers}
              pendingFamilyInvites={player.access.pendingFamilyInvites}
            />
          </div>

          <ParentFixturesClient playerId={player.id} playerName={player.full_name} team={team} heroSessionId={heroSession?.id ?? null} beforeHero={beforeHero} afterSchedule={milestoneStrip} />
        </div>
      </section>

      <section className="hidden md:block">
        {latestPotm ? (
          <div className="overflow-hidden border-b border-white/[0.06]" style={{ backgroundColor: `${team.club_primary_colour}14` }}>
            <p className="whitespace-nowrap px-8 py-2 text-sm text-white/75 [animation:ticker_20s_linear_infinite] hover:[animation-play-state:paused]">Player of the Match: {fullName(latestPotmPlayer)} vs {latestPotmSession?.opponent ?? latestPotmSession?.title ?? 'the opposition'}</p>
          </div>
        ) : null}
        {playerPotm ? (
          <section className="mx-auto mt-6 max-w-[900px] rounded-2xl border p-5" style={{ backgroundColor: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.4)' }}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-black text-amber-300">Player of the Match: {player.full_name}</h2>
                <p className="mt-2 text-sm text-white/45">{team.team_name} vs {playerPotmSession?.opponent ?? playerPotmSession?.title ?? 'Match'} | {formatDate(playerPotm?.last_won_at)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {cardPoll?.social_card_url ? <a href={cardPoll.social_card_url} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-4 py-2 text-sm text-white">Download Card</a> : null}
                <a href={`https://wa.me/?text=${encodeURIComponent(`${player.full_name} is Player of the Match for ${team.team_name}!`)}`} className="rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white">Share on WhatsApp</a>
              </div>
            </div>
            {cardPoll?.social_card_url ? <img src={cardPoll.social_card_url} alt="" className="mt-4 max-w-md rounded-xl border border-white/10" /> : null}
          </section>
        ) : null}
        <div className="mx-auto mt-6 max-w-[900px]">
          <section className="mb-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
            <h1 className="text-2xl font-black text-white">{player.full_name}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full px-3 py-1 text-xs font-semibold text-black" style={{ backgroundColor: team.club_primary_colour }}>{team.age_group ?? 'Age TBC'}</span>
              <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/55">{team.gender ?? 'Mixed'}</span>
              <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/55">{medicalStatus(player)}</span>
              <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/55">{socialStatus(player)}</span>
            </div>
          </section>
          <PlayerAccessTree
            playerName={player.first_name || player.full_name}
            primaryParents={player.access.parents}
            familyMembers={player.access.familyMembers}
            pendingFamilyInvites={player.access.pendingFamilyInvites}
          />
        </div>
        <ParentFixturesClient playerId={player.id} playerName={player.full_name} team={team} heroSessionId={heroSession?.id ?? null} beforeHero={beforeHero} afterSchedule={milestoneStrip} />
      </section>
    </main>
  );
}

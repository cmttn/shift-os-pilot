import Link from 'next/link';
import { redirect } from 'next/navigation';
import ParentFixturesClient from '@/components/dashboard/ParentFixturesClient';
import BottomNav from '@/components/mobile/BottomNav';
import { getParentDashboardData } from '@/lib/dashboard/getParentDashboardData';
import { createClient } from '@/lib/supabase/server';
import { getCategoryMeta, getCurrentSeason, type ParentStarCategory, type StarCategory } from '@/lib/tools/starCategories';

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
  opponent: string | null;
  title: string | null;
  session_date: string;
}

interface PollCardRow {
  social_card_url: string | null;
}

interface StarGoalRow {
  category: ParentStarCategory;
  custom_text: string | null;
  parent_message: string | null;
}

interface StarTotalRow {
  total_stars: number | null;
}

interface StarAwardRow {
  category: StarCategory;
  awarded_at: string | null;
}

interface PastSessionRow {
  id: string;
  opponent: string | null;
  title: string | null;
  session_date: string;
}

function fullName(player: PlayerNameRow | null): string {
  return [player?.first_name, player?.last_name].map((part) => part?.trim()).filter(Boolean).join(' ') || 'Player';
}

function formatDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function isSameDay(left: string, right: Date): boolean {
  const date = new Date(left);
  return !Number.isNaN(date.valueOf())
    && date.getFullYear() === right.getFullYear()
    && date.getMonth() === right.getMonth()
    && date.getDate() === right.getDate();
}

function sessionOpponent(session: { opponent: string | null; title: string | null } | null): string {
  return session?.opponent ?? session?.title ?? 'the match';
}

export default async function ParentPlayerTeamDashboardPage({ params }: ParentPlayerTeamDashboardPageProps) {
  const data = await getParentDashboardData();
  if (!data) redirect('/dashboard/player/welcome');

  const player = data.players.find((item) => item.id === params.playerId);
  if (!player) redirect('/dashboard/parent');

  const team = player.teams.find((item) => item.team_id === params.teamId);
  if (!team) redirect('/dashboard/parent');

  const singleContext = data.players.length === 1 && player.teams.length === 1;
  const heroSession = team.upcoming_sessions[0] ?? null;
  const backHref = player.teams.length > 1 ? `/dashboard/parent/player/${player.id}` : '/dashboard/parent';
  const supabase = await createClient();
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const [{ data: latestPotm }, { data: playerPotm }] = await Promise.all([
    supabase.from('potm_stats').select('player_id,last_won_at,last_session_id').eq('team_id', team.team_id).gte('last_won_at', since).order('last_won_at', { ascending: false }).limit(1).maybeSingle<PotmStatRow>(),
    supabase.from('potm_stats').select('player_id,last_won_at,last_session_id').eq('team_id', team.team_id).eq('player_id', player.id).gte('last_won_at', since).order('last_won_at', { ascending: false }).limit(1).maybeSingle<PotmStatRow>()
  ]);
  const potmPlayerIds = Array.from(new Set([latestPotm?.player_id, playerPotm?.player_id].filter((id): id is string => Boolean(id))));
  const sessionIds = Array.from(new Set([latestPotm?.last_session_id, playerPotm?.last_session_id].filter((id): id is string => Boolean(id))));
  const [{ data: potmPlayers }, { data: potmSessions }, { data: cardPoll }] = await Promise.all([
    potmPlayerIds.length > 0 ? supabase.from('players').select('id,first_name,last_name').in('id', potmPlayerIds) : Promise.resolve({ data: [] as PlayerNameRow[] }),
    sessionIds.length > 0 ? supabase.from('sessions').select('id,opponent,title,session_date').in('id', sessionIds) : Promise.resolve({ data: [] as Array<SessionRow & { id: string }> }),
    playerPotm?.last_session_id ? supabase.from('potm_polls').select('social_card_url').eq('session_id', playerPotm.last_session_id).eq('winner_player_id', player.id).maybeSingle<PollCardRow>() : Promise.resolve({ data: null })
  ]);
  const latestPotmPlayer = (potmPlayers ?? []).find((item) => item.id === latestPotm?.player_id) ?? null;
  const latestPotmSession = (potmSessions ?? []).find((item) => item.id === latestPotm?.last_session_id) ?? null;
  const playerPotmSession = (potmSessions ?? []).find((item) => item.id === playerPotm?.last_session_id) ?? null;
  const todaySession = team.upcoming_sessions.find((session) => isSameDay(session.session_date, new Date())) ?? null;
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const season = getCurrentSeason();
  const [
    { data: todayGoal },
    { data: starTotal },
    { data: lastAward },
    { data: recentPastSessions }
  ] = await Promise.all([
    todaySession ? supabase.from('player_star_goals').select('category,custom_text,parent_message').eq('player_id', player.id).eq('session_id', todaySession.id).maybeSingle<StarGoalRow>() : Promise.resolve({ data: null }),
    supabase.from('player_star_totals').select('total_stars').eq('player_id', player.id).eq('season', season).maybeSingle<StarTotalRow>(),
    supabase.from('player_stars').select('category,awarded_at').eq('player_id', player.id).eq('season', season).order('awarded_at', { ascending: false }).limit(1).maybeSingle<StarAwardRow>(),
    supabase.from('sessions').select('id,opponent,title,session_date').eq('team_id', team.team_id).eq('is_active', true).lt('session_date', new Date().toISOString()).gte('session_date', weekAgo).order('session_date', { ascending: false }).limit(5)
  ]);
  const pastSessions = (recentPastSessions ?? []) as PastSessionRow[];
  const { data: awardedPastStars } = pastSessions.length > 0
    ? await supabase.from('player_stars').select('session_id').eq('player_id', player.id).in('session_id', pastSessions.map((session) => session.id))
    : { data: [] as Array<{ session_id: string | null }> };
  const awardedSessionIds = new Set(((awardedPastStars ?? []) as Array<{ session_id: string | null }>).map((row) => row.session_id).filter((id): id is string => Boolean(id)));
  const unawardedSession = pastSessions.find((session) => !awardedSessionIds.has(session.id)) ?? null;
  const goalMeta = todayGoal ? getCategoryMeta(todayGoal.category) : null;
  const lastAwardMeta = lastAward ? getCategoryMeta(lastAward.category) : null;
  const starsTotal = starTotal?.total_stars ?? 0;
  const { count: openTicketCount } = await supabase
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('raised_by', data.userId)
    .eq('team_id', team.team_id)
    .neq('status', 'resolved');

  const goalCard = todayGoal && todaySession && goalMeta ? (
    <section className="rounded-3xl border p-6 text-[#fff7ed] shadow-[0_0_24px_rgba(245,158,11,0.15)]" style={{ backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.4)' }}>
      <p className="text-xs uppercase tracking-[0.22em] text-amber-100/45">Today&apos;s goal from Mum/Dad:</p>
      <p className="mt-4 animate-pulse text-center text-6xl">{goalMeta.emoji}</p>
      <h2 className="mt-3 text-center text-xl font-black" style={{ color: goalMeta.colour }}>{goalMeta.label}</h2>
      {todayGoal.custom_text ? <p className="mt-3 text-center text-sm italic text-amber-100/65">{todayGoal.custom_text}</p> : null}
      {todayGoal.parent_message ? <p className="mt-4 border-t border-amber-400/20 pt-4 text-center text-sm italic text-amber-100/70">“{todayGoal.parent_message}”<br /><span className="text-xs text-amber-100/45">— Mum/Dad</span></p> : null}
      <p className="mt-4 text-center text-sm text-amber-100/55">Good luck today! ⭐</p>
    </section>
  ) : null;

  const unawardedBanner = unawardedSession ? (
    <section className="rounded-2xl border p-4" style={{ backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.25)' }}>
      <p className="font-semibold text-amber-200">⭐ Award {player.full_name}&apos;s stars for vs {sessionOpponent(unawardedSession)}</p>
      <Link href={`/dashboard/parent/stars/award/${unawardedSession.id}/${player.id}`} className="mt-3 inline-flex rounded-full px-4 py-2 text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>Award Stars →</Link>
    </section>
  ) : null;

  const starsSection = (
    <section className="rounded-3xl border p-5 text-[#fff7ed]" style={{ backgroundColor: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black">{player.full_name}&apos;s Stars This Season</h2>
          <p className="mt-1 text-sm text-amber-100/55">{starsTotal} ⭐ total{lastAwardMeta ? ` · last award ${lastAwardMeta.emoji}` : ''}</p>
        </div>
        <Link href={`/dashboard/parent/stars/${player.id}`} className="shrink-0 rounded-full border border-amber-400/25 px-4 py-2 text-sm font-bold text-amber-200">View All →</Link>
      </div>
    </section>
  );

  return (
    <main className="min-h-screen text-white" style={{ backgroundColor: '#080a0f' }}>
      <header className="hidden h-16 items-center justify-between border-b px-8 md:flex" style={{ backgroundColor: 'rgba(8,10,15,0.95)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <Link href={backHref} className="text-sm text-white/45 transition-all duration-300 ease-out hover:text-white">← Back</Link>
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
        <span className="w-14" />
      </header>

      <section className="px-5 pb-24 pt-5 md:hidden">
        <div className="mx-auto max-w-[480px]">
          <header className="flex items-center gap-3">
            <Link href={backHref} className="text-sm text-white/45 transition-all duration-300 ease-out hover:text-white">← Back</Link>
            <div className="ml-auto flex items-center gap-3">
              {team.club_badge_url ? <img src={team.club_badge_url} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="h-10 w-10 rounded-full" style={{ backgroundColor: team.club_primary_colour }} />}
              <span className="text-right">
                <span className="block text-sm font-bold text-white">{team.team_name}</span>
                <span className="block text-xs text-white/35">{team.club_name ?? 'Independent team'}</span>
              </span>
            </div>
          </header>
          {latestPotm ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.06]" style={{ backgroundColor: `${team.club_primary_colour}14` }}>
              <p className="whitespace-nowrap px-4 py-2 text-sm text-white/75 [animation:ticker_20s_linear_infinite] hover:[animation-play-state:paused]">🏆 Congratulations {fullName(latestPotmPlayer)} — Player of the Match vs {latestPotmSession?.opponent ?? latestPotmSession?.title ?? 'the opposition'}!</p>
            </div>
          ) : null}
          {goalCard ? <div className="mt-5">{goalCard}</div> : null}
          {unawardedBanner ? <div className="mt-5">{unawardedBanner}</div> : null}

          <section className="mt-8">
            <h1 className="mt-2 text-3xl font-black text-white">{player.full_name}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full px-3 py-1 text-xs font-semibold text-black" style={{ backgroundColor: team.club_primary_colour }}>{team.age_group ?? 'Age TBC'}</span>
              <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/55">{team.gender ?? 'Mixed'}</span>
            </div>
          </section>
          {playerPotm ? (
            <section className="mt-5 rounded-2xl border p-5" style={{ backgroundColor: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.4)' }}>
              <h2 className="text-xl font-black text-amber-300">🏆 {player.full_name} — Player of the Match!</h2>
              <p className="mt-2 text-sm text-white/45">{team.team_name} vs {playerPotmSession?.opponent ?? playerPotmSession?.title ?? 'Match'} | {formatDate(playerPotm?.last_won_at)}</p>
              {cardPoll?.social_card_url ? <img src={cardPoll.social_card_url} alt="" className="mt-4 w-full rounded-xl border border-white/10" /> : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {cardPoll?.social_card_url ? <a href={cardPoll.social_card_url} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-4 py-2 text-sm text-white">Download Card</a> : null}
                <a href={`https://wa.me/?text=${encodeURIComponent(`🏆 ${player.full_name} is Player of the Match for ${team.team_name}!`)}`} className="rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white">Share on WhatsApp</a>
              </div>
            </section>
          ) : null}

          <ParentFixturesClient playerId={player.id} playerName={player.full_name} team={team} heroSessionId={heroSession?.id ?? null} />
          <div className="mt-6">{starsSection}</div>
        </div>
      </section>

      <section className="hidden md:block">
        {latestPotm ? (
          <div className="overflow-hidden border-b border-white/[0.06]" style={{ backgroundColor: `${team.club_primary_colour}14` }}>
            <p className="whitespace-nowrap px-8 py-2 text-sm text-white/75 [animation:ticker_20s_linear_infinite] hover:[animation-play-state:paused]">🏆 Congratulations {fullName(latestPotmPlayer)} — Player of the Match vs {latestPotmSession?.opponent ?? latestPotmSession?.title ?? 'the opposition'}!</p>
          </div>
        ) : null}
        <div className="mx-auto mt-6 max-w-[900px] space-y-4">
          {goalCard}
          {unawardedBanner}
        </div>
        {playerPotm ? (
          <section className="mx-auto mt-6 max-w-[900px] rounded-2xl border p-5" style={{ backgroundColor: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.4)' }}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-black text-amber-300">🏆 {player.full_name} — Player of the Match!</h2>
                <p className="mt-2 text-sm text-white/45">{team.team_name} vs {playerPotmSession?.opponent ?? playerPotmSession?.title ?? 'Match'} | {formatDate(playerPotm?.last_won_at)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {cardPoll?.social_card_url ? <a href={cardPoll.social_card_url} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-4 py-2 text-sm text-white">Download Card</a> : null}
                <a href={`https://wa.me/?text=${encodeURIComponent(`🏆 ${player.full_name} is Player of the Match for ${team.team_name}!`)}`} className="rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white">Share on WhatsApp</a>
              </div>
            </div>
            {cardPoll?.social_card_url ? <img src={cardPoll.social_card_url} alt="" className="mt-4 max-w-md rounded-xl border border-white/10" /> : null}
          </section>
        ) : null}
        <ParentFixturesClient playerId={player.id} playerName={player.full_name} team={team} heroSessionId={heroSession?.id ?? null} />
        <div className="mx-auto mt-6 max-w-[900px]">{starsSection}</div>
      </section>

      {singleContext ? <BottomNav primaryColour={team.club_primary_colour} items={[
        { href: `/dashboard/parent/player/${player.id}/team/${team.team_id}`, label: 'Home', icon: 'H' },
        { href: `/dashboard/parent/player/${player.id}/team/${team.team_id}`, label: 'Fixtures', icon: 'F' },
        { href: `/dashboard/parent/player/${player.id}/team/${team.team_id}`, label: 'Avail', icon: 'A' },
        { href: '/dashboard/parent/tickets', label: 'Tickets', icon: 'T', badgeCount: openTicketCount ?? 0 },
        { href: '/dashboard/parent/settings', label: 'Settings', icon: 'S' }
      ]} /> : null}
    </main>
  );
}

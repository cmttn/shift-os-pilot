import Link from 'next/link';
import { redirect } from 'next/navigation';
import ParentFixturesClient from '@/components/dashboard/ParentFixturesClient';
import BottomNav from '@/components/mobile/BottomNav';
import { getParentDashboardData } from '@/lib/dashboard/getParentDashboardData';
import { createClient } from '@/lib/supabase/server';

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

function fullName(player: PlayerNameRow | null): string {
  return [player?.first_name, player?.last_name].map((part) => part?.trim()).filter(Boolean).join(' ') || 'Player';
}

function formatDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
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
        </div>
      </section>

      <section className="hidden md:block">
        {latestPotm ? (
          <div className="overflow-hidden border-b border-white/[0.06]" style={{ backgroundColor: `${team.club_primary_colour}14` }}>
            <p className="whitespace-nowrap px-8 py-2 text-sm text-white/75 [animation:ticker_20s_linear_infinite] hover:[animation-play-state:paused]">🏆 Congratulations {fullName(latestPotmPlayer)} — Player of the Match vs {latestPotmSession?.opponent ?? latestPotmSession?.title ?? 'the opposition'}!</p>
          </div>
        ) : null}
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
      </section>

      {singleContext ? <BottomNav primaryColour={team.club_primary_colour} items={[
        { href: `/dashboard/parent/player/${player.id}/team/${team.team_id}`, label: 'Home', icon: 'H' },
        { href: `/dashboard/parent/player/${player.id}/team/${team.team_id}`, label: 'Fixtures', icon: 'F' },
        { href: `/dashboard/parent/player/${player.id}/team/${team.team_id}`, label: 'Avail', icon: 'A' },
        { href: `/dashboard/parent/player/${player.id}/team/${team.team_id}`, label: 'Team', icon: 'T' },
        { href: '/dashboard/parent/settings', label: 'Settings', icon: 'S' }
      ]} /> : null}
    </main>
  );
}

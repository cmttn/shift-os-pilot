import Link from 'next/link';
import { redirect } from 'next/navigation';
import ParentFixturesClient from '@/components/dashboard/ParentFixturesClient';
import BottomNav from '@/components/mobile/BottomNav';
import { getParentDashboardData } from '@/lib/dashboard/getParentDashboardData';

interface ParentPlayerTeamDashboardPageProps {
  params: {
    playerId: string;
    teamId: string;
  };
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

          <section className="mt-8">
            <h1 className="mt-2 text-3xl font-black text-white">{player.full_name}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full px-3 py-1 text-xs font-semibold text-black" style={{ backgroundColor: team.club_primary_colour }}>{team.age_group ?? 'Age TBC'}</span>
              <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/55">{team.gender ?? 'Mixed'}</span>
            </div>
          </section>

          <ParentFixturesClient playerId={player.id} playerName={player.full_name} team={team} heroSessionId={heroSession?.id ?? null} />
        </div>
      </section>

      <section className="hidden md:block">
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

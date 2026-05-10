import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getParentDashboardData, type ParentPlayer } from '@/lib/dashboard/getParentDashboardData';

function initials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  return ((parts[0]?.[0] ?? 'P') + (parts[1]?.[0] ?? '')).toUpperCase();
}

function playerHref(player: ParentPlayer): string {
  if (player.teams.length === 1) {
    return `/dashboard/parent/player/${player.id}/team/${player.teams[0].team_id}`;
  }
  return `/dashboard/parent/player/${player.id}`;
}

export default async function ParentDashboardPage() {
  const data = await getParentDashboardData();
  if (!data) redirect('/dashboard/player/welcome');

  const onlyPlayer = data.players.length === 1 ? data.players[0] : null;
  if (onlyPlayer?.teams.length === 1) {
    redirect(`/dashboard/parent/player/${onlyPlayer.id}/team/${onlyPlayer.teams[0].team_id}`);
  }

  const background = data.allSameClub
    ? `radial-gradient(ellipse at top, ${data.globalPrimaryColour}08 0%, transparent 50%), #080a0f`
    : '#080a0f';

  return (
    <main className="min-h-screen px-5 py-8 text-white" style={{ background }}>
      <div className="mx-auto max-w-[480px]">
        <header className="flex flex-col items-center text-center">
          {data.allSameClub ? (
            <>
              {data.globalClubBadge ? <img src={data.globalClubBadge} alt="" className="h-14 w-14 rounded-full object-cover" /> : null}
              <p className="mt-3 text-sm font-semibold text-white/65">{data.globalClubName}</p>
            </>
          ) : (
            <p className="text-xs font-black uppercase tracking-[0.34em] text-white/70">SHIFT/OS</p>
          )}
          <h1 className="mt-8 text-2xl font-bold text-white">Your Players</h1>
          <p className="mt-2 text-sm text-white/40">Select a player to view their schedule and availability</p>
        </header>

        <section className="mt-8 space-y-3">
          {data.players.map((player) => {
            const firstTeam = player.teams[0] ?? null;
            const cardColour = data.allSameClub ? data.globalPrimaryColour : firstTeam?.club_primary_colour ?? '#f0f4ff';
            return (
              <Link
                key={player.id}
                href={playerHref(player)}
                className="block rounded-2xl border p-5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-white/15"
                style={{
                  background: 'linear-gradient(145deg,#0d1117,#0a0e15)',
                  borderColor: 'rgba(255,255,255,0.06)',
                  borderLeft: data.allSameClub ? '1px solid rgba(255,255,255,0.06)' : `3px solid ${cardColour}`
                }}
              >
                {data.allSameClub ? <span className="mb-4 block h-0.5 w-full rounded-full" style={{ backgroundColor: cardColour }} /> : null}
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-black text-black" style={{ backgroundColor: cardColour }}>
                    {initials(player.full_name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-bold text-white">{player.full_name}</span>
                    <span className="mt-1 block text-sm text-white/40">{player.age === null ? 'Age not set' : `${player.age} years old`}</span>
                    <span className="mt-3 flex flex-wrap gap-2">
                      {player.teams.map((team) => (
                        <span key={team.team_id} className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/55">{team.team_name}</span>
                      ))}
                    </span>
                  </span>
                  {!data.allSameClub && firstTeam?.club_badge_url ? <img src={firstTeam.club_badge_url} alt="" className="h-8 w-8 rounded-full object-cover" /> : null}
                  <span className="text-xl text-white/45">→</span>
                </div>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}

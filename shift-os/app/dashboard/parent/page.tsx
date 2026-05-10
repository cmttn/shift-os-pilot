import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getParentDashboardData, type ParentPlayer, type ParentPlayerTeam } from '@/lib/dashboard/getParentDashboardData';

function getContrastText(hexColour: string): string {
  const hex = hexColour.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

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

function teamMeta(team: ParentPlayerTeam | null): string {
  if (!team) return 'Team not linked';
  return [team.age_group, team.gender].filter(Boolean).join(' / ') || 'Team';
}

export default async function ParentDashboardPage() {
  const data = await getParentDashboardData();
  if (!data) redirect('/dashboard/player/welcome');

  const onlyPlayer = data.players.length === 1 ? data.players[0] : null;
  if (onlyPlayer?.teams.length === 1) {
    redirect(`/dashboard/parent/player/${onlyPlayer.id}/team/${onlyPlayer.teams[0].team_id}`);
  }

  const background = data.allSameClub
    ? `radial-gradient(ellipse at top, ${data.globalPrimaryColour}0a 0%, transparent 45%), #080a0f`
    : '#080a0f';

  return (
    <main className="min-h-screen px-5 text-white" style={{ background }}>
      <div className="mx-auto max-w-[520px] pb-12">
        <header className="pb-6 pt-8 text-center">
          <h1 className="text-3xl font-black text-white">Welcome, {data.parentFirstName}</h1>
          <p className="mt-2 text-sm text-white/40">Here&apos;s who you&apos;re following</p>
        </header>

        {data.players.length === 0 ? (
          <section className="mt-10 text-center">
            <p className="text-6xl">👤</p>
            <h2 className="mt-4 text-xl font-semibold text-white">No players linked yet</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm text-white/40">Ask your coach to add you to the team or use your team join code</p>
            <Link href="/dashboard/player/welcome" className="mt-6 inline-flex rounded-full bg-[#00C851] px-5 py-3 text-sm font-semibold text-black">Enter Join Code →</Link>
          </section>
        ) : (
          <section className="mt-4">
            {data.players.map((player) => {
              const firstTeam = player.teams[0] ?? null;
              const cardColour = data.allSameClub ? data.globalPrimaryColour : firstTeam?.club_primary_colour ?? '#00C851';
              const contrastText = getContrastText(cardColour);
              return (
                <Link
                  key={player.id}
                  href={playerHref(player)}
                  className="mb-3 block rounded-2xl border p-5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-white/15"
                  style={{
                    background: 'linear-gradient(145deg,#0d1117,#0a0e15)',
                    borderColor: 'rgba(255,255,255,0.06)',
                    borderLeft: data.allSameClub ? '1px solid rgba(255,255,255,0.06)' : `3px solid ${cardColour}`
                  }}
                >
                  {data.allSameClub ? <span className="mb-4 block h-0.5 w-full rounded-full" style={{ backgroundColor: cardColour }} /> : null}
                  <div className="flex items-center gap-4">
                    {firstTeam?.club_badge_url ? (
                      <img src={firstTeam.club_badge_url} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]" />
                    ) : (
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]" style={{ backgroundColor: cardColour, color: contrastText }}>
                        {initials(firstTeam?.club_name ?? player.full_name)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-xl font-bold text-white">{player.full_name}</span>
                      <span className="mt-0.5 block text-sm text-white/50">{firstTeam?.team_name ?? 'Team not linked'}</span>
                      <span className="mt-1 inline-flex rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: `${cardColour}24`, color: cardColour }}>{teamMeta(firstTeam)}</span>
                      {!data.allSameClub && firstTeam?.club_name ? <span className="mt-1 block text-xs text-white/30">{firstTeam.club_name}</span> : null}
                      {player.teams.length > 1 ? (
                        <span className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                          {player.teams.map((team) => (
                            <span key={team.team_id} className="shrink-0 rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/55">{team.team_name}</span>
                          ))}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-xl text-white/30">→</span>
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

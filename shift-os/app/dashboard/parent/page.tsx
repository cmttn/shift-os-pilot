import Link from 'next/link';
import { redirect } from 'next/navigation';
import PlayerAccessTree from '@/components/dashboard/PlayerAccessTree';
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

function PlayerCard({ player, allSameClub, globalPrimaryColour, compact }: {
  player: ParentPlayer;
  allSameClub: boolean;
  globalPrimaryColour: string;
  compact: boolean;
}) {
  const firstTeam = player.teams[0] ?? null;
  const cardColour = allSameClub ? globalPrimaryColour : firstTeam?.club_primary_colour ?? '#00C851';
  const contrastText = getContrastText(cardColour);

  return (
    <Link
      href={playerHref(player)}
      className={`${compact ? 'mb-3 p-5' : 'mb-4 p-6'} block cursor-pointer rounded-2xl border transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-white/15 hover:shadow-[0_22px_50px_rgba(0,0,0,0.35)]`}
      style={{
        background: 'linear-gradient(145deg,#0d1117,#0a0e15)',
        borderColor: 'rgba(255,255,255,0.06)',
        borderLeft: allSameClub ? '1px solid rgba(255,255,255,0.06)' : `3px solid ${cardColour}`
      }}
    >
      {allSameClub ? <span className="mb-4 block h-0.5 w-full rounded-full" style={{ backgroundColor: cardColour }} /> : null}
      <div className={`${compact ? 'gap-4' : 'gap-5'} flex items-center`}>
        {firstTeam?.club_badge_url ? (
          <img
            src={firstTeam.club_badge_url}
            alt=""
            className={`${compact ? 'h-12 w-12' : 'h-14 w-14'} shrink-0 rounded-full object-cover drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]`}
          />
        ) : (
          <span
            className={`${compact ? 'h-12 w-12 text-sm' : 'h-14 w-14 text-base'} flex shrink-0 items-center justify-center rounded-full font-bold drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]`}
            style={{ backgroundColor: cardColour, color: contrastText }}
          >
            {initials(firstTeam?.club_name ?? player.full_name)}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className={`${compact ? 'text-xl' : 'text-2xl'} block font-bold text-white`}>{player.full_name}</span>
          <span className={`${compact ? 'text-sm' : 'text-base'} mt-1 block text-white/50`}>{firstTeam?.team_name ?? 'Team not linked'}</span>
          <span className={`${compact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} mt-2 inline-flex rounded-full`} style={{ backgroundColor: `${cardColour}24`, color: cardColour }}>
            {teamMeta(firstTeam)}
          </span>
          {!allSameClub && firstTeam?.club_name ? <span className="mt-1 block text-xs text-white/30">{firstTeam.club_name}</span> : null}
          {player.fa_fan_verified ? <span className="mt-2 inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">FA ✓</span> : null}
          {player.teams.length > 1 ? (
            <span className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {player.teams.map((team) => (
                <span key={team.team_id} className="shrink-0 rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/55">{team.team_name}</span>
              ))}
            </span>
          ) : null}
        </span>
        <span className={`${compact ? 'text-xl' : 'text-2xl'} text-white/25`}>→</span>
      </div>
    </Link>
  );
}

function FanPrompt({ player }: { player: ParentPlayer }) {
  if (player.fa_fan_number || !player.invite_token) return null;

  return (
    <Link
      href={`/invite/player/${player.invite_token}/complete`}
      className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-blue-500/10 bg-blue-500/[0.05] p-3 transition hover:bg-blue-500/[0.08]"
    >
      <span className="text-sm text-white/60">Add {player.first_name || 'player'}&apos;s FAN number</span>
      <span className="text-sm font-semibold text-blue-400">Add →</span>
    </Link>
  );
}

interface ParentDashboardPageProps {
  searchParams?: {
    invite_accepted?: string;
    invite_error?: string;
  };
}

export default async function ParentDashboardPage({ searchParams }: ParentDashboardPageProps) {
  const data = await getParentDashboardData();
  if (!data) redirect('/dashboard/player/welcome');

  const onlyPlayer = data.players.length === 1 ? data.players[0] : null;
  if (onlyPlayer?.teams.length === 1) {
    redirect(`/dashboard/parent/player/${onlyPlayer.id}/team/${onlyPlayer.teams[0].team_id}`);
  }

  const background = data.allSameClub
    ? `radial-gradient(ellipse at top, ${data.globalPrimaryColour}0a 0%, transparent 45%), #080a0f`
    : '#080a0f';
  const globalBadge = data.globalClubBadge;
  const globalClubName = data.globalClubName ?? 'SHIFT/OS';
  const primary = data.globalPrimaryColour;
  const contrastText = getContrastText(primary);
  const inviteMessage = searchParams?.invite_error === 'already_linked'
    ? 'That invite is already linked to another parent account.'
    : searchParams?.invite_accepted === 'true'
      ? 'Your new player has been added to your account ✓'
      : null;

  return (
    <main className="min-h-screen text-white" style={{ background }}>
      <section className="px-5 md:hidden">
        <div className="mx-auto max-w-[520px] pb-12">
          <header className="pb-6 pt-8 text-center">
            <h1 className="text-3xl font-black text-white">Welcome, {data.parentFirstName}</h1>
            <p className="mt-2 text-sm text-white/40">Here&apos;s who you&apos;re following</p>
          </header>
          {inviteMessage ? <p className="mb-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">{inviteMessage}</p> : null}

          {data.players.length === 0 ? (
            <section className="mt-10 text-center">
              <p className="text-6xl">👤</p>
              <h2 className="mt-4 text-xl font-semibold text-white">No players linked yet</h2>
              <p className="mx-auto mt-2 max-w-xs text-sm text-white/40">Ask your coach to add you to the team or use your team join code</p>
              <Link href="/dashboard/player/welcome" className="mt-6 inline-flex rounded-full bg-[#00C851] px-5 py-3 text-sm font-semibold text-black">Enter Join Code →</Link>
            </section>
          ) : (
            <section className="mt-4">
              {data.players.map((player) => (
                <div key={player.id}>
                  <PlayerCard player={player} allSameClub={data.allSameClub} globalPrimaryColour={data.globalPrimaryColour} compact />
                  <div className="mb-4">
                    <PlayerAccessTree
                      playerName={player.first_name || player.full_name}
                      primaryParents={player.access.parents}
                      familyMembers={player.access.familyMembers}
                      pendingFamilyInvites={player.access.pendingFamilyInvites}
                      compact
                    />
                  </div>
                  <FanPrompt player={player} />
                </div>
              ))}
            </section>
          )}
        </div>
      </section>

      <section className="hidden min-h-screen grid-cols-[40%_60%] md:grid">
        <aside className="sticky top-0 flex h-screen flex-col border-r px-12 py-[60px]" style={{ background: 'linear-gradient(180deg, #0d1117 0%, #080a0f 100%)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            {globalBadge ? (
              <img
                src={globalBadge}
                alt=""
                className="h-20 w-20 rounded-full object-cover"
                style={{ filter: `drop-shadow(0 0 20px ${primary}4d) drop-shadow(0 8px 24px rgba(0,0,0,0.6))` }}
              />
            ) : (
              <span
                className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-black"
                style={{ backgroundColor: primary, color: contrastText, filter: `drop-shadow(0 0 20px ${primary}4d) drop-shadow(0 8px 24px rgba(0,0,0,0.6))` }}
              >
                {initials(globalClubName)}
              </span>
            )}
            <p className="mt-3 text-sm uppercase tracking-[0.24em] text-white/40">{globalClubName}</p>
            <div className="my-8 h-px w-16 bg-white/[0.06]" />
            <p className="text-2xl font-light text-white/50">Welcome,</p>
            <h1 className="mt-1 text-5xl font-black tracking-tight text-white">{data.parentFirstName}</h1>
            <p className="mt-4 max-w-xs text-base leading-relaxed text-white/35">Select who you&apos;d like to follow</p>
          </div>
          <p className="text-center text-xs tracking-[0.24em] text-white/[0.15]">Powered by SHIFT/OS</p>
        </aside>

        <section className="min-h-screen overflow-y-auto px-12 py-[60px]" style={{ backgroundColor: '#080a0f' }}>
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.24em] text-white/30">Your Players</h2>
          {inviteMessage ? <p className="mb-5 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">{inviteMessage}</p> : null}
          {data.players.length === 0 ? (
            <section className="rounded-2xl border border-white/[0.06] p-10 text-center" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)' }}>
              <p className="text-6xl">👤</p>
              <h3 className="mt-4 text-2xl font-semibold text-white">No players linked yet</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-white/40">Ask your coach to add you to the team or use your team join code</p>
              <Link href="/dashboard/player/welcome" className="mt-6 inline-flex rounded-full bg-[#00C851] px-5 py-3 text-sm font-semibold text-black">Enter Join Code →</Link>
            </section>
          ) : (
            data.players.map((player) => (
              <div key={player.id}>
                <PlayerCard player={player} allSameClub={data.allSameClub} globalPrimaryColour={data.globalPrimaryColour} compact={false} />
                <div className="mb-5">
                  <PlayerAccessTree
                    playerName={player.first_name || player.full_name}
                    primaryParents={player.access.parents}
                    familyMembers={player.access.familyMembers}
                    pendingFamilyInvites={player.access.pendingFamilyInvites}
                  />
                </div>
                <FanPrompt player={player} />
              </div>
            ))
          )}
        </section>
      </section>
    </main>
  );
}

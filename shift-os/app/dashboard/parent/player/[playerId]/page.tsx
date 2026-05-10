import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getParentDashboardData } from '@/lib/dashboard/getParentDashboardData';

interface ParentPlayerTeamSelectionPageProps {
  params: {
    playerId: string;
  };
}

function initials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  return ((parts[0]?.[0] ?? 'P') + (parts[1]?.[0] ?? '')).toUpperCase();
}

function formatNextSession(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default async function ParentPlayerTeamSelectionPage({ params }: ParentPlayerTeamSelectionPageProps) {
  const data = await getParentDashboardData();
  if (!data) redirect('/dashboard/player/welcome');

  const player = data.players.find((item) => item.id === params.playerId);
  if (!player) redirect('/dashboard/parent');
  if (player.teams.length === 1) redirect(`/dashboard/parent/player/${player.id}/team/${player.teams[0].team_id}`);

  return (
    <main className="min-h-screen px-5 py-8 text-white" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[480px]">
        <Link href="/dashboard/parent" className="text-sm text-white/45 transition-all duration-300 ease-out hover:text-white">← Back</Link>
        <header className="mt-8 flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full text-base font-black text-black" style={{ backgroundColor: data.allSameClub ? data.globalPrimaryColour : player.teams[0]?.club_primary_colour ?? '#f0f4ff' }}>
            {initials(player.full_name)}
          </span>
          <span>
            <h1 className="text-2xl font-bold text-white">{player.full_name}</h1>
            <p className="mt-1 text-sm text-white/40">Select a team</p>
          </span>
        </header>

        <section className="mt-8 space-y-3">
          {player.teams.map((team) => {
            const nextSession = team.upcoming_sessions[0] ?? null;
            const nextTitle = nextSession
              ? `Next: ${nextSession.opponent ? `vs ${nextSession.opponent}` : nextSession.title ?? nextSession.type} ${formatNextSession(nextSession.session_date)}`
              : 'Next: No sessions posted';
            return (
              <Link
                key={team.team_id}
                href={`/dashboard/parent/player/${player.id}/team/${team.team_id}`}
                className="block rounded-2xl border p-5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-white/15"
                style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)', borderLeft: `3px solid ${team.club_primary_colour}` }}
              >
                <div className="flex items-center gap-4">
                  {team.club_badge_url ? <img src={team.club_badge_url} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="h-10 w-10 rounded-full" style={{ backgroundColor: team.club_primary_colour }} />}
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-bold text-white">{team.team_name}</span>
                    <span className="mt-1 block text-sm text-white/35">{team.club_name ?? 'Independent team'}</span>
                    <span className="mt-3 inline-flex rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/50">{team.age_group ?? 'Age group TBC'}</span>
                    <span className="mt-3 block text-sm text-white/40">{nextTitle}</span>
                  </span>
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

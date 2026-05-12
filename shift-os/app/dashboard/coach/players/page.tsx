import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCoachData } from '@/lib/dashboard/getCoachData';

export default async function CoachPlayersPage() {
  const data = await getCoachData();
  if (!data) redirect('/dashboard/coach/welcome');
  const primaryColour = data.teams[0]?.club_primary_colour ?? '#00C851';

  return (
    <main className="min-h-screen px-5 pb-28 pt-8 text-white md:ml-[260px]" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[760px]">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/30">Players</p>
            <h1 className="mt-3 text-3xl font-black">Squad</h1>
          </div>
          <Link href="/dashboard/coach/players/new" className="rounded-full px-4 py-2 text-sm font-bold text-black" style={{ backgroundColor: primaryColour }}>Add Player</Link>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {data.players.length === 0 ? <p className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 text-sm text-white/40">No players yet.</p> : data.players.map((player) => (
            <article key={player.id} className="rounded-2xl border p-4" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="font-semibold text-white">{player.full_name}</p>
              <p className="mt-1 text-xs text-white/35">{data.teams.find((team) => team.id === player.team_id)?.name ?? 'Team'}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

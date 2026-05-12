import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getParentDashboardData } from '@/lib/dashboard/getParentDashboardData';

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default async function ParentSchedulePage() {
  const data = await getParentDashboardData();
  if (!data) redirect('/dashboard/parent');
  const items = data.players.flatMap((player) => player.teams.flatMap((team) => team.upcoming_sessions.map((session) => ({ player, team, session }))));

  return (
    <main className="min-h-screen px-5 pb-28 pt-8 text-white" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[640px]">
        <p className="text-xs uppercase tracking-[0.28em] text-white/30">Schedule</p>
        <h1 className="mt-3 text-3xl font-black">Upcoming Schedule</h1>
        <div className="mt-6 space-y-3">
          {items.length === 0 ? <p className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 text-sm text-white/40">No upcoming sessions yet.</p> : items.map(({ player, team, session }) => (
            <Link key={`${player.id}-${team.team_id}-${session.id}`} href={`/dashboard/parent/player/${player.id}/team/${team.team_id}`} className="block rounded-2xl border p-4 transition-all duration-300 ease-out hover:-translate-y-0.5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)', borderLeft: `3px solid ${team.club_primary_colour}` }}>
              <p className="text-sm font-semibold text-white">{session.opponent ? `${team.team_name} vs ${session.opponent}` : session.title ?? team.team_name}</p>
              <p className="mt-1 text-xs text-white/40">{player.full_name} - {formatDate(session.session_date)}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

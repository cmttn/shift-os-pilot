import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getFamilyDashboardData } from '@/lib/dashboard/getFamilyDashboardData';

export default async function FamilyDashboardPage() {
  const data = await getFamilyDashboardData();
  if (!data) redirect('/auth/login');

  if (data.players.length === 1) {
    redirect(`/dashboard/family/player/${data.players[0].id}`);
  }

  return (
    <main className="min-h-screen px-5 py-10 text-white" style={{ backgroundColor: '#080a0f' }}>
      <section className="mx-auto max-w-[520px]">
        <p className="text-xs uppercase tracking-[0.3em] text-white/30">Football Family</p>
        <h1 className="mt-3 text-3xl font-black">Choose a player</h1>
        <div className="mt-6 space-y-3">
          {data.players.length === 0 ? (
            <p className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 text-sm text-white/40">No active Football Family connections yet.</p>
          ) : data.players.map((player) => (
            <Link key={player.id} href={`/dashboard/family/player/${player.id}`} className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 transition hover:bg-white/[0.05]">
              {player.badge_url ? <img src={player.badge_url} alt="" className="h-12 w-12 rounded-full object-cover" /> : <span className="h-12 w-12 rounded-full" style={{ backgroundColor: player.primary_colour }} />}
              <span>
                <span className="block font-semibold text-white">{player.full_name}</span>
                <span className="mt-1 block text-xs text-white/35">{player.team_name}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

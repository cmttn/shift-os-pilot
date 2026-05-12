import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getParentDashboardData } from '@/lib/dashboard/getParentDashboardData';

export default async function ParentGoalsPage() {
  const data = await getParentDashboardData();
  if (!data) redirect('/dashboard/parent');

  return (
    <main className="min-h-screen px-5 pb-28 pt-8 text-white" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[520px]">
        <p className="text-xs uppercase tracking-[0.28em] text-white/30">Goals</p>
        <h1 className="mt-3 text-3xl font-black">Player Goals</h1>
        <div className="mt-6 space-y-3">
          {data.players.length === 0 ? <p className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 text-sm text-white/40">No linked players yet.</p> : data.players.map((player) => (
            <Link key={player.id} href={`/dashboard/parent/stars/${player.id}`} className="block rounded-2xl border p-5 transition-all duration-300 ease-out hover:-translate-y-0.5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="text-lg font-bold text-white">{player.full_name}</p>
              <p className="mt-1 text-sm text-white/40">View season goals and milestones</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

import { redirect } from 'next/navigation';
import ParentFixturesClient from '@/components/dashboard/ParentFixturesClient';
import BottomNav from '@/components/mobile/BottomNav';
import { getParentDashboardData } from '@/lib/dashboard/getParentDashboardData';

function darkenHex(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - Math.round((255 * percent) / 100));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round((255 * percent) / 100));
  const b = Math.max(0, (num & 0xff) - Math.round((255 * percent) / 100));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export default async function ParentDashboardPage() {
  const parentData = await getParentDashboardData();
  if (!parentData) redirect('/dashboard');

  const primaryColour = parentData.club.primary_colour;
  const darkerPrimary = darkenHex(primaryColour, 15);
  const teamNames = parentData.teams.map((team) => team.name).join(', ') || 'Team not linked yet';

  return (
    <main className="min-h-screen text-white" style={{ background: `radial-gradient(ellipse at top, ${primaryColour}10 0%, transparent 48%), #080a0f` }}>
      <section className="relative min-h-[210px] overflow-hidden px-5 py-10 md:px-10" style={{ background: `linear-gradient(135deg, ${primaryColour} 0%, ${darkerPrimary} 42%, #080a0f 100%)` }}>
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
        <div className="absolute inset-x-0 bottom-0 h-full" style={{ background: 'linear-gradient(to bottom, transparent 52%, #080a0f 100%)' }} />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs uppercase tracking-[0.32em] text-white/35">Parent / Player Workspace</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-6xl">Welcome {parentData.firstName}</h1>
          <p className="mt-3 max-w-2xl text-lg text-white/45">Your team: {teamNames}</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 pb-24 pt-10 md:px-10">
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {parentData.players.map((player) => {
            const team = parentData.teams.find((item) => item.id === player.team_id);
            return (
              <article key={player.id} className="overflow-hidden rounded-2xl border" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="h-px w-full opacity-50" style={{ backgroundColor: primaryColour }} />
                <div className="p-6">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/25">Player</p>
                  <h2 className="mt-3 text-2xl font-bold text-white">{player.full_name}</h2>
                  <p className="mt-2 text-sm text-white/35">{team?.name ?? 'Team not linked'} / {player.dob ?? 'DOB not set'}</p>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-12 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <article className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="text-2xl font-bold text-white">Fixtures</h2>
            <div className="mt-6 space-y-3">
              <ParentFixturesClient sessions={parentData.sessions} primaryColour={primaryColour} />
            </div>
          </article>

          <article className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="text-2xl font-bold text-white">Availability</h2>
            <p className="mt-1 text-sm text-white/30">Use each fixture card to confirm availability. Coach notes update live.</p>
            <div className="mt-6 space-y-3">
              {parentData.players.map((player) => <p key={player.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-white/45">{player.full_name}</p>)}
            </div>
          </article>
        </section>

        <section className="mt-12 grid grid-cols-1 gap-4 xl:grid-cols-3">
          {[
            ['Training', 'Training times and session notes will appear here once posted by the coach.'],
            ['Tournaments', 'Tournament dates, meet times and formats will sit here.'],
            ['Team Updates', 'Coach messages and parent notices will roll into this area.']
          ].map(([title, copy]) => (
            <article key={title} className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              <p className="mt-3 text-sm text-white/35">{copy}</p>
              <div className="mt-6 h-2 rounded-full bg-white/[0.06]">
                <div className="h-2 w-1/3 rounded-full" style={{ backgroundColor: primaryColour }} />
              </div>
            </article>
          ))}
        </section>
      </div>
      <BottomNav primaryColour={primaryColour} items={[{ href: '/dashboard/parent/player', label: 'Home', icon: '⌂' }, { href: '/dashboard/parent/player', label: 'Fixtures', icon: '◷' }, { href: '/dashboard/parent/player', label: 'Avail', icon: '✓' }, { href: '/dashboard/parent/player', label: 'Team', icon: '▣' }]} />
    </main>
  );
}

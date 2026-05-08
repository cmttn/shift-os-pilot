import Link from 'next/link';
import { getClubData } from '@/lib/dashboard/getClubData';

function getContrastText(hexColour: string): string {
  const hex = hexColour.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

function darkenHex(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - Math.round((255 * percent) / 100));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round((255 * percent) / 100));
  const b = Math.max(0, (num & 0xff) - Math.round((255 * percent) / 100));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getGreeting(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

const toolCards = [
  { icon: '🕐', name: 'Game Time Tracker', description: 'Minutes, rotations, and match rhythm.', tier: 'Free' },
  { icon: '✅', name: 'Availability Manager', description: 'Know who is ready before selection.', tier: 'Free' },
  { icon: '📢', name: 'Announcement Builder', description: 'Polished updates for every audience.', tier: 'Free' },
  { icon: '📊', name: 'Fair Play Reports', description: 'Deeper insight across the season.', tier: 'Pro' },
  { icon: '💬', name: 'Structured Conversations', description: 'Clear coaching notes and player check-ins.', tier: 'Pro' },
  { icon: '👨‍👩‍👧', name: 'Parent Engagement', description: 'Keep families informed and aligned.', tier: 'Pro' }
];

export default async function ClubDashboardHomePage() {
  const clubData = await getClubData();
  if (!clubData) return null;

  const primaryColour = clubData.club.primary_colour;
  const darkerPrimary = darkenHex(primaryColour, 15);
  const contrastText = getContrastText(primaryColour);
  const greeting = getGreeting();
  const upcomingFixtures = clubData.fixtures.filter((fixture) => new Date(fixture.fixture_date) >= new Date());
  const stats = [
    ['Total Teams', clubData.teams.length],
    ['Total Players', clubData.totalPlayers],
    ['Total Coaches', clubData.totalCoaches],
    ['Upcoming Fixtures', upcomingFixtures.length]
  ];

  return (
    <div className="-mx-4 -my-4 min-h-screen px-4 pb-16 pt-10 md:-mx-8 md:-my-8 md:px-8" style={{ background: `radial-gradient(ellipse at top, ${primaryColour}10 0%, transparent 50%), #080a0f` }}>
      <section className="pb-2">
        <h2 className="text-4xl font-black tracking-tight text-white md:text-5xl">Welcome to {clubData.club.name}</h2>
        <p className="mt-3 text-lg font-normal text-white/40">Good {greeting}, {clubData.firstName} - here&apos;s your club overview.</p>
        <div className="mt-8 h-px w-full bg-white/[0.06]" />
      </section>

      <section className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map(([label, value]) => (
          <article key={label} className="rounded-2xl border p-7 transition-all duration-300 ease-out hover:-translate-y-0.5" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="mb-3 text-xs uppercase tracking-[0.28em] text-white/30">{label}</p>
            <p className="text-4xl font-black" style={{ color: primaryColour }}>{value}</p>
          </article>
        ))}
      </section>

      <section className="mt-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">Your Teams</h3>
            <p className="mt-1 text-sm text-white/30">Manage and monitor all your teams</p>
          </div>
          <Link href="/dashboard/club/teams/new" className="w-fit rounded-full px-6 py-2.5 text-sm font-semibold shadow-lg transition-all duration-300 ease-out hover:scale-[1.02]" style={{ background: `linear-gradient(135deg, ${primaryColour}, ${darkerPrimary})`, color: contrastText, boxShadow: `0 4px 20px ${primaryColour}59` }}>
            Add Team +
          </Link>
        </div>

        {clubData.teams.length === 0 ? (
          <p className="py-12 text-center text-gray-500">No teams yet.</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {clubData.teams.map((team) => (
              <article key={team.id} className="overflow-hidden rounded-2xl border transition-all duration-300 ease-out hover:-translate-y-[3px]" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="h-px w-full opacity-50" style={{ backgroundColor: primaryColour }} />
                <div className="p-6">
                  <h4 className="text-lg font-semibold text-white">{team.name}</h4>
                  <p className="mt-1 text-sm text-white/30">{team.age_group ?? 'Age group not set'}</p>
                  <div className="my-4 h-px w-full bg-white/[0.06]" />
                  <p className="text-sm text-white/35">Coach: {team.coach_name ?? 'Unassigned'}</p>
                  <span className="mt-4 inline-block rounded-full border px-3 py-1 text-xs font-semibold" style={{ backgroundColor: `${primaryColour}26`, borderColor: `${primaryColour}4d`, color: primaryColour }}>{team.player_count} players</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
            <div className="flex items-center gap-3"><h3 className="text-2xl font-bold text-white">Fixtures</h3><span className="text-lg text-white/35 transition-all duration-300 ease-out group-open:rotate-180">v</span></div>
            <button className="rounded-full px-6 py-2.5 text-sm font-semibold shadow-lg transition-all duration-300 ease-out hover:scale-[1.02]" style={{ background: `linear-gradient(135deg, ${primaryColour}, ${darkerPrimary})`, color: contrastText, boxShadow: `0 4px 20px ${primaryColour}59` }}>Add Fixture +</button>
          </summary>
          <div className="mt-6 space-y-3">
            {upcomingFixtures.length === 0 ? <p className="py-8 text-center text-gray-500">No fixtures scheduled.</p> : upcomingFixtures.map((fixture) => (
              <div key={fixture.id} className="grid grid-cols-1 gap-y-2 rounded-[10px] border px-5 py-3.5 text-sm transition-all duration-300 ease-out hover:bg-white/[0.04] sm:grid-cols-4 sm:items-center" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)', borderLeft: `3px solid ${primaryColour}` }}>
                <span className="font-semibold" style={{ color: primaryColour }}>{formatDate(fixture.fixture_date)}</span><span className="text-white">{fixture.opponent}</span><span><span className="rounded-full border px-2 py-0.5 text-xs font-semibold capitalize" style={fixture.home_away === 'home' ? { backgroundColor: primaryColour, borderColor: primaryColour, color: contrastText } : { backgroundColor: 'transparent', borderColor: primaryColour, color: primaryColour }}>{fixture.home_away}</span></span><span className="text-white/35">{fixture.team_name}</span>
              </div>
            ))}
          </div>
        </details>
      </section>

      <section className="mt-12">
        <h3 className="text-2xl font-bold text-white">Build Your Coaching Kit</h3>
        <p className="mt-1 text-sm text-white/30">Everything your club needs, in one place.</p>
        <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {toolCards.map((tool) => {
            const isPro = tool.tier === 'Pro';
            return (
              <article key={tool.name} className="group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 ease-out hover:-translate-y-0.5" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: isPro ? 'rgba(255,255,255,0.06)' : `${primaryColour}4d`, borderBottom: isPro ? '2px solid rgba(168,85,247,0.45)' : `2px solid ${primaryColour}66` }}>
                <p className="mb-4 text-3xl font-black" style={{ color: isPro ? '#a855f7' : primaryColour }}>{tool.icon}</p>
                <p className="font-semibold text-white">{tool.name}</p><p className="mt-1 text-sm text-white/30">{tool.description}</p>
                <span className="mt-4 inline-block rounded-full border px-3 py-1 text-xs font-semibold" style={isPro ? { background: 'linear-gradient(135deg,#7c3aed,#a855f7)', borderColor: 'transparent', color: '#ffffff' } : { backgroundColor: `${primaryColour}1f`, borderColor: `${primaryColour}40`, color: primaryColour }}>{tool.tier}</span>
                {isPro ? <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/65 opacity-0 backdrop-blur-[2px] transition-all duration-300 ease-out group-hover:opacity-100"><div className="text-center"><p className="text-2xl">{'\u{1F512}'}</p><p className="mt-2 text-sm text-white">Upgrade to Pro</p></div></div> : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="mb-12 mt-12"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h3 className="text-2xl font-bold text-white">Recent Announcements</h3><p className="mt-1 text-sm text-white/30">Keep the whole club moving together.</p></div><button className="w-fit rounded-full px-6 py-2.5 text-sm font-semibold shadow-lg transition-all duration-300 ease-out hover:scale-[1.02]" style={{ background: `linear-gradient(135deg, ${primaryColour}, ${darkerPrimary})`, color: contrastText, boxShadow: `0 4px 20px ${primaryColour}59` }}>New Announcement +</button></div><div className="mt-6 rounded-[10px] border px-5 py-4 text-center text-sm text-white/30 transition-all duration-300 ease-out hover:bg-white/[0.04]" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>No announcements yet.</div></section>

      <details className="group fixed bottom-8 right-8 z-50"><summary className="flex h-14 w-14 cursor-pointer list-none items-center justify-center rounded-full text-2xl font-semibold text-white shadow-2xl transition-all duration-300 ease-out hover:scale-110 [&::-webkit-details-marker]:hidden" style={{ background: `linear-gradient(135deg, ${primaryColour}, ${darkerPrimary})`, boxShadow: `0 8px 32px ${primaryColour}80` }} aria-label="Open quick actions">+</summary><div className="absolute bottom-16 right-0 flex flex-col items-end gap-2">{[{ label: 'Add Team', href: '/dashboard/club/teams/new' }, { label: 'Add Fixture', href: '/dashboard/club/fixtures' }, { label: 'New Announcement', href: '/dashboard/club' }].map((item, index) => <Link key={item.label} href={item.href} className="translate-y-3 whitespace-nowrap rounded-full border px-4 py-2 text-sm text-white opacity-0 shadow-xl transition-all duration-300 ease-out group-open:translate-y-0 group-open:opacity-100" style={{ transitionDelay: `${index * 70}ms`, backgroundColor: '#161b27', borderColor: 'rgba(255,255,255,0.1)' }}>{item.label}</Link>)}</div></details>
    </div>
  );
}

import { getClubData } from '@/lib/dashboard/getClubData';

function getContrastText(hexColour: string): string {
  const r = parseInt(hexColour.slice(1, 3), 16);
  const g = parseInt(hexColour.slice(3, 5), 16);
  const b = parseInt(hexColour.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
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

export default async function ClubDashboardHomePage() {
  const clubData = await getClubData();
  if (!clubData) return null;

  const upcomingFixtures = clubData.fixtures.filter((fixture) => new Date(fixture.fixture_date) >= new Date());
  const contrastText = getContrastText(clubData.club.primary_colour);
  const greeting = getGreeting();

  return (
    <div className="space-y-8 bg-gray-950 px-4 md:px-0">
      <section>
        <h2 className="text-2xl font-bold text-white md:text-4xl">Welcome to {clubData.club.name}</h2>
        <p className="mt-2 text-lg text-gray-400">Good {greeting}, {clubData.firstName} — here&apos;s your club overview.</p>
      </section>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          ['Total Teams', clubData.teams.length],
          ['Total Players', clubData.totalPlayers],
          ['Total Coaches', clubData.totalCoaches],
          ['Upcoming Fixtures', upcomingFixtures.length]
        ].map(([label, value]) => (
          <article key={label} className="rounded-xl border border-gray-800 bg-gray-900 p-6" style={{ borderTop: `2px solid ${clubData.club.primary_colour}4D` }}>
            <p className="text-sm text-gray-400">{label}</p>
            <p className="mt-2 text-3xl font-bold" style={{ color: clubData.club.primary_colour }}>{value}</p>
          </article>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-2xl font-bold" style={{ color: clubData.club.primary_colour }}>Your Teams</h3>
          <button className="rounded-lg px-3 py-2 text-sm font-semibold" style={{ backgroundColor: clubData.club.primary_colour, color: contrastText }}>Add Team +</button>
        </div>
        {clubData.teams.length === 0 ? <p className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-gray-300">No teams yet. Add your first team →</p> : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {clubData.teams.map((team) => (
              <article
                key={team.id}
                className="group overflow-hidden rounded-xl border border-gray-800 bg-gray-900 transition hover:border-[var(--club-primary)]"
                style={{ ['--club-primary' as string]: clubData.club.primary_colour }}
              >
                <div className="h-[3px] w-full" style={{ backgroundColor: clubData.club.primary_colour }} />
                <div className="p-5">
                  <h4 className="text-lg font-semibold text-white">{team.name}</h4>
                  <p className="mt-1 text-sm text-gray-400">{team.age_group ?? 'Age group not set'}</p>
                  <p className="mt-3 text-sm text-gray-300">Coach: {team.coach_name ?? 'Unassigned'}</p>
                  <span className="mt-4 inline-block rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: clubData.club.primary_colour, color: contrastText }}>{team.player_count} players</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-800 bg-gray-900">
        <details>
          <summary className="cursor-pointer list-none px-6 py-4 text-xl font-bold" style={{ color: clubData.club.primary_colour }}>Fixtures ▾</summary>
          <div className="space-y-4 border-t border-gray-800 px-6 py-4">
            {upcomingFixtures.length === 0 ? <p className="text-gray-300">No fixtures scheduled.</p> : (
              <>
                <div className="space-y-2">
                  {upcomingFixtures.slice(0, 3).map((fixture) => (
                    <div key={fixture.id} className="grid grid-cols-4 gap-2 rounded-lg border border-gray-800 px-3 py-2 text-sm text-gray-200" style={{ borderLeft: `3px solid ${clubData.club.primary_colour}` }}>
                      <span style={{ color: clubData.club.primary_colour }}>{formatDate(fixture.fixture_date)}</span><span>{fixture.opponent}</span><span className="capitalize">{fixture.home_away}</span><span>{fixture.team_name}</span>
                    </div>
                  ))}
                </div>
                <button className="rounded-lg px-3 py-2 text-sm font-semibold" style={{ backgroundColor: clubData.club.primary_colour, color: contrastText }}>Add Fixture +</button>
              </>
            )}
          </div>
        </details>
      </section>

      <section>
        <h3 className="text-2xl font-bold" style={{ color: clubData.club.primary_colour }}>Build Your Coaching Kit</h3>
        <p className="mt-1 text-gray-400">Everything your club needs, in one place.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            ['🕐', 'Game Time Tracker', 'Free', 'Active'],
            ['✅', 'Availability Manager', 'Free', 'Active'],
            ['📢', 'Announcement Builder', 'Free', 'Active'],
            ['📊', 'Fair Play Reports', 'Pro', 'Pro']
          ].map(([icon, title, tier, status]) => (
            <article key={title} className="group relative rounded-xl border border-gray-800 bg-gray-900 p-4 text-white" style={{ borderBottom: `2px solid ${clubData.club.primary_colour}` }}>
              <p className="text-2xl">{icon}</p>
              <p className="mt-2 font-semibold">{title}</p>
              <p className="text-sm text-gray-400">{tier}</p>
              <span className={`mt-3 inline-block rounded-full px-2 py-1 text-xs ${status === 'Pro' ? 'bg-purple-600 text-white' : ''}`} style={status === 'Pro' ? undefined : { backgroundColor: clubData.club.primary_colour, color: contrastText }}>
                {status}
              </span>
              {status === 'Pro' ? <div className="pointer-events-none absolute inset-0 hidden items-center justify-center bg-black/50 text-2xl group-hover:flex">🔒</div> : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

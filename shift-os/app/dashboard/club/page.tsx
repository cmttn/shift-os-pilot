import { getClubData } from '@/lib/dashboard/getClubData';

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default async function ClubDashboardHomePage() {
  const clubData = await getClubData();
  if (!clubData) return null;

  const upcomingFixtures = clubData.fixtures.filter((fixture) => new Date(fixture.fixture_date) >= new Date());

  return (
    <div className="space-y-8 bg-gray-950">
      <section>
        <h2 className="text-3xl font-bold text-white">Welcome back, {clubData.firstName}</h2>
        <p className="mt-2 text-gray-400">Here&apos;s what&apos;s happening at {clubData.club.name} today.</p>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[['Total Teams', clubData.teams.length], ['Total Players', clubData.totalPlayers], ['Total Coaches', clubData.totalCoaches], ['Upcoming Fixtures', upcomingFixtures.length]].map(([label, value]) => (
          <article key={label} className="rounded-xl border border-gray-800 bg-gray-900 p-6">
            <p className="text-sm text-gray-400">{label}</p>
            <p className="mt-2 text-3xl font-bold" style={{ color: clubData.club.primary_colour }}>{value}</p>
          </article>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">Your Teams</h3>
          <button className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-white hover:bg-gray-900">Add Team +</button>
        </div>
        {clubData.teams.length === 0 ? <p className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-gray-300">No teams yet. Add your first team →</p> : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {clubData.teams.map((team) => (
              <article key={team.id} className="rounded-xl border border-gray-800 bg-gray-900 p-5 transition hover:border-[var(--club-primary)]" style={{ ['--club-primary' as string]: clubData.club.primary_colour }}>
                <h4 className="text-lg font-semibold text-white">{team.name}</h4>
                <p className="mt-1 text-sm text-gray-400">{team.age_group ?? 'Age group not set'}</p>
                <p className="mt-3 text-sm text-gray-300">Coach: {team.coach_name ?? 'Unassigned'}</p>
                <span className="mt-4 inline-block rounded-full px-3 py-1 text-xs font-semibold text-black" style={{ backgroundColor: clubData.club.primary_colour }}>{team.player_count} players</span>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-800 bg-gray-900">
        <details>
          <summary className="cursor-pointer list-none px-6 py-4 text-xl font-bold text-white">Fixtures ▾</summary>
          <div className="space-y-4 border-t border-gray-800 px-6 py-4">
            {upcomingFixtures.length === 0 ? <p className="text-gray-300">No fixtures scheduled.</p> : (
              <>
                <div className="space-y-2">
                  {upcomingFixtures.slice(0, 3).map((fixture) => (
                    <div key={fixture.id} className="grid grid-cols-4 gap-2 rounded-lg border border-gray-800 px-3 py-2 text-sm text-gray-200">
                      <span>{formatDate(fixture.fixture_date)}</span><span>{fixture.opponent}</span><span className="capitalize">{fixture.home_away}</span><span>{fixture.team_name}</span>
                    </div>
                  ))}
                </div>
                <button className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-white hover:bg-gray-800">Add Fixture +</button>
              </>
            )}
          </div>
        </details>
      </section>

      <section>
        <h3 className="text-2xl font-bold text-white">Build Your Coaching Kit</h3>
        <p className="mt-1 text-gray-400">Everything your club needs, in one place.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['🕐', 'Game Time Tracker', 'Free', 'Active'],
            ['✅', 'Availability Manager', 'Free', 'Active'],
            ['📢', 'Announcement Builder', 'Free', 'Active'],
            ['📊', 'Fair Play Reports', 'Pro', 'Pro']
          ].map(([icon, title, tier, status]) => (
            <article key={title} className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-white">
              <p className="text-2xl">{icon}</p>
              <p className="mt-2 font-semibold">{title}</p>
              <p className="text-sm text-gray-400">{tier}</p>
              <span className={`mt-3 inline-block rounded-full px-2 py-1 text-xs ${status === 'Active' ? 'bg-green-600 text-white' : 'bg-purple-600 text-white'}`}>{status}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

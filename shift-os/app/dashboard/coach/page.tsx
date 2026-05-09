import Link from 'next/link';
import { redirect } from 'next/navigation';
import CopyInviteButton from '@/components/dashboard/CopyInviteButton';
import PendingJoinRequests from '@/components/dashboard/PendingJoinRequests';
import BottomNav from '@/components/mobile/BottomNav';
import { getCoachDashboardData } from '@/lib/dashboard/getCoachDashboardData';

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
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function titleCase(value: string | null): string {
  if (!value) return 'Not set';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const coachTools = [
  { name: 'Squad List', description: 'Players, availability and parent links will live here.', icon: 'SL', status: 'Ready shell' },
  { name: 'Upcoming Games', description: 'Match cards, prep notes and selection planning.', icon: 'UG', status: 'Ready shell' },
  { name: 'Tournaments', description: 'Weekend formats, groups and match-day logistics.', icon: 'TR', status: 'Ready shell' },
  { name: 'MOTM Vote', description: 'Collect player of the match votes after fixtures.', icon: 'MV', status: 'Ready shell' },
  { name: 'Stats', description: 'Roll-out area for attendance, minutes and development trends.', icon: 'ST', status: 'Next rollout' }
];

export default async function CoachDashboardPage() {
  const coachData = await getCoachDashboardData();
  if (!coachData) redirect('/dashboard/club');

  const primaryColour = coachData.club.primary_colour;
  const darkerPrimary = darkenHex(primaryColour, 15);
  const focusTeam = coachData.teams[0] ?? null;
  const upcomingFixtures = coachData.fixtures.filter((fixture) => new Date(fixture.fixture_date) >= new Date());
  const teamLabel =
    coachData.teams.length === 0
      ? 'No assigned team yet'
      : coachData.teams.length === 1
        ? coachData.teams[0].name
        : coachData.teams.map((team) => team.name).join(', ');

  return (
    <main className="min-h-screen text-white" style={{ background: `radial-gradient(ellipse at top, ${primaryColour}10 0%, transparent 48%), #080a0f` }}>
      <section
        className="relative min-h-[220px] overflow-hidden px-5 py-10 md:px-10"
        style={{ background: `linear-gradient(135deg, ${primaryColour} 0%, ${darkerPrimary} 42%, #080a0f 100%)` }}
      >
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
        <div className="absolute inset-x-0 bottom-0 h-full" style={{ background: 'linear-gradient(to bottom, transparent 52%, #080a0f 100%)' }} />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-white/35">Coach Workspace</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-6xl">Welcome Coach {coachData.firstName}</h1>
            <p className="mt-3 max-w-2xl text-lg text-white/45">Your team: {teamLabel}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 md:min-w-[420px]">
            {[
              ['Teams', coachData.teams.length],
              ['Games', upcomingFixtures.length],
              ['Squad', focusTeam?.player_count ?? 0]
            ].map(([label, value]) => (
              <div key={label} className="rounded-full border px-5 py-3 text-center backdrop-blur-md" style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }}>
                <p className="text-2xl font-bold leading-none text-white">{value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.24em] text-white/35">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 pb-24 pt-10 md:px-10">
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {coachData.teams.length === 0 ? (
            <article className="rounded-2xl border p-8 lg:col-span-3" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <h2 className="text-2xl font-bold text-white">No assigned teams yet</h2>
              <p className="mt-2 text-white/35">Once your club admin assigns you to a team, your squad, games and coaching tools will appear here.</p>
            </article>
          ) : (
            coachData.teams.map((team) => (
              <article key={team.id} className="overflow-hidden rounded-2xl border transition-all duration-300 ease-out hover:-translate-y-[3px]" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="h-px w-full opacity-50" style={{ backgroundColor: primaryColour }} />
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-white">{team.name}</h2>
                      <p className="mt-1 text-sm text-white/30">{team.age_group ?? 'Age group not set'} / {team.season ?? 'Season not set'}</p>
                    </div>
                    <span className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ backgroundColor: `${primaryColour}1f`, borderColor: `${primaryColour}40`, color: primaryColour }}>
                      {team.is_lead ? 'Head Coach' : 'Coach'}
                    </span>
                  </div>
                  <div className="my-4 h-px w-full bg-white/[0.06]" />
                  <p className="text-sm text-white/35">Gender: {titleCase(team.gender)}</p>
                  <p className="mt-2 text-sm text-white/35">League: {team.league ?? 'Not set'}</p>
                  <p className="mt-4 font-mono text-lg font-black tracking-[0.28em]" style={{ color: primaryColour }}>{team.join_code ?? '------'}</p>
                  {team.join_code ? <CopyInviteButton inviteUrl={team.join_code} label="Copy Code" /> : null}
                </div>
              </article>
            ))
          )}
        </section>

        <PendingJoinRequests primaryColour={primaryColour} requests={coachData.pendingRequests} teams={coachData.teams} />

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-white">Coach Tools</h2>
          <p className="mt-1 text-sm text-white/30">Core tools are ready on this page; deeper workflows will unlock as each module is built.</p>
          <div className="mt-5">
            <Link href="/dashboard/coach/players/new" className="inline-flex rounded-full px-5 py-3 text-sm font-semibold transition-all duration-300 ease-out hover:scale-[1.02]" style={{ backgroundColor: primaryColour, color: '#ffffff' }}>
              Add Player
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            {coachTools.map((tool) => (
              <article key={tool.name} className="rounded-2xl border p-6 transition-all duration-300 ease-out hover:-translate-y-0.5" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)', borderBottom: `2px solid ${primaryColour}66` }}>
                <p className="text-3xl font-black" style={{ color: primaryColour }}>{tool.icon}</p>
                <h3 className="mt-4 font-semibold text-white">{tool.name}</h3>
                <p className="mt-2 text-sm text-white/30">{tool.description}</p>
                <span className="mt-5 inline-block rounded-full border px-3 py-1 text-xs font-semibold" style={{ backgroundColor: `${primaryColour}1f`, borderColor: `${primaryColour}40`, color: primaryColour }}>
                  {tool.status}
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <article className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Squad List</h2>
                <p className="mt-1 text-sm text-white/30">Players linked to your assigned team environment.</p>
              </div>
              <Link href="/dashboard/coach/players/new" className="rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out hover:bg-white/[0.06]" style={{ borderColor: `${primaryColour}66`, color: primaryColour }}>
                Add Player
              </Link>
            </div>
            <div className="mt-6 space-y-3">
              {coachData.players.length === 0 ? (
                <p className="rounded-[10px] border border-white/[0.06] bg-white/[0.02] p-5 text-sm text-white/35">
                  {focusTeam ? `${focusTeam.name} is ready for its first player.` : 'No squad selected yet.'}
                </p>
              ) : (
                coachData.players.slice(0, 8).map((player) => {
                  const playerTeam = coachData.teams.find((team) => team.id === player.team_id);
                  return (
                    <div key={player.id} className="rounded-[10px] border border-white/[0.06] bg-white/[0.02] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{player.full_name}</p>
                          <p className="mt-1 text-sm text-white/30">{playerTeam?.name ?? 'Team not set'} / {player.age_group ?? 'Age group not set'}</p>
                        </div>
                        <span className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ backgroundColor: `${primaryColour}1f`, borderColor: `${primaryColour}40`, color: primaryColour }}>
                          Player
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </article>

          <article className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="text-2xl font-bold text-white">Upcoming Games</h2>
            <div className="mt-6 space-y-3">
              {upcomingFixtures.length === 0 ? (
                <p className="rounded-[10px] border border-white/[0.06] bg-white/[0.02] p-5 text-sm text-white/35">No upcoming games scheduled for your assigned teams.</p>
              ) : (
                upcomingFixtures.slice(0, 5).map((fixture) => (
                  <div key={fixture.id} className="grid grid-cols-1 gap-2 rounded-[10px] border px-5 py-4 text-sm sm:grid-cols-4 sm:items-center" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)', borderLeft: `3px solid ${primaryColour}` }}>
                    <span className="font-semibold" style={{ color: primaryColour }}>{formatDate(fixture.fixture_date)}</span>
                    <span className="text-white">{fixture.opponent}</span>
                    <span className="capitalize text-white/35">{fixture.home_away}</span>
                    <span className="text-white/35">{fixture.team_name}</span>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>

        <section className="mt-12 grid grid-cols-1 gap-4 xl:grid-cols-3">
          {[
            ['Tournaments', 'Tournament planning, squads and schedules will sit here.'],
            ['MOTM Vote', 'Start a post-match vote and review results here once built.'],
            ['Stats', 'Roll-out area for attendance, minutes, player growth and season trends.']
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
      <BottomNav primaryColour={primaryColour} items={[{ href: '/dashboard/coach', label: 'Home', icon: '⌂' }, { href: '/dashboard/coach/players/new', label: 'Squad', icon: '+' }, { href: '/dashboard/coach', label: 'Games', icon: '◷' }, { href: '/dashboard/coach', label: 'Stats', icon: '▣' }]} />
    </main>
  );
}

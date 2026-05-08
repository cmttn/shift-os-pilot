import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getClubData } from '@/lib/dashboard/getClubData';

function canManageTeams(role: string): boolean {
  return role === 'admin' || role === 'club_admin' || role === 'shift_admin' || role === 'coach';
}

function titleCase(value: string | null): string {
  if (!value) return 'Not set';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default async function ClubTeamsPage() {
  const clubData = await getClubData();
  if (!clubData) redirect('/onboarding');
  if (!canManageTeams(clubData.clubRole)) redirect('/dashboard/club');

  const primaryColour = clubData.club.primary_colour;

  return (
    <div className="-mx-4 -my-4 min-h-screen px-4 py-10 md:-mx-8 md:-my-8 md:px-8" style={{ backgroundColor: '#080a0f' }}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">Teams</h1>
          <p className="mt-3 text-lg text-white/40">Manage your teams for {clubData.club.name}.</p>
        </div>
        <Link
          href="/dashboard/club/teams/new"
          className="w-fit rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 ease-out hover:scale-[1.02]"
          style={{ backgroundColor: primaryColour, color: '#ffffff', boxShadow: `0 4px 20px ${primaryColour}59` }}
        >
          Add Team +
        </Link>
      </div>

      {clubData.teams.length === 0 ? (
        <section className="mt-10 rounded-2xl border p-10 text-center" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-2xl font-bold text-white">No teams yet</h2>
          <p className="mt-2 text-white/35">Create your first team and invite their coach.</p>
          <Link
            href="/dashboard/club/teams/new"
            className="mt-6 inline-block rounded-full px-8 py-4 font-semibold transition-all duration-300 ease-out hover:scale-[1.02]"
            style={{ backgroundColor: primaryColour, color: '#ffffff' }}
          >
            Add Team +
          </Link>
        </section>
      ) : (
        <section className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {clubData.teams.map((team) => (
            <article
              key={team.id}
              className="overflow-hidden rounded-2xl border transition-all duration-300 ease-out hover:-translate-y-[3px]"
              style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="h-px w-full opacity-50" style={{ backgroundColor: primaryColour }} />
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{team.name}</h2>
                    <p className="mt-1 text-sm text-white/30">{team.age_group ?? 'Age group not set'}</p>
                  </div>
                  <span className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ backgroundColor: `${primaryColour}1f`, borderColor: `${primaryColour}40`, color: primaryColour }}>
                    {titleCase(team.gender)}
                  </span>
                </div>
                <div className="my-4 h-px w-full bg-white/[0.06]" />
                <p className="text-sm text-white/35">Coach: {team.coach_name ?? 'Unassigned'}</p>
                <p className="mt-2 text-sm text-white/35">Players: {team.player_count}</p>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

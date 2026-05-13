import Link from 'next/link';
import { redirect } from 'next/navigation';
import CoachInviteDrawer from '@/components/dashboard/CoachInviteDrawer';
import CopyInviteButton from '@/components/dashboard/CopyInviteButton';
import PendingCoachJoinRequests, { type PendingCoachJoinRequest } from '@/components/dashboard/PendingCoachJoinRequests';
import { getClubData } from '@/lib/dashboard/getClubData';
import { createClient } from '@/lib/supabase/server';

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
  const supabase = await createClient();
  const { data: requestRows } = await supabase
    .from('club_join_requests')
    .select('id,coach_user_id,team_id')
    .eq('club_id', clubData.club.id)
    .eq('status', 'pending');
  const rawRequests = (requestRows ?? []) as Array<{
    id: string;
    coach_user_id: string;
    team_id: string | null;
  }>;
  const requestCoachIds = Array.from(new Set(rawRequests.map((request) => request.coach_user_id)));
  const requestTeamIds = rawRequests.map((request) => request.team_id).filter((teamId): teamId is string => Boolean(teamId));
  const [{ data: requestProfiles }, { data: requestTeams }, { data: requestPlayers }] = await Promise.all([
    requestCoachIds.length > 0
      ? supabase.from('users_profile').select('id,full_name,email').in('id', requestCoachIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null; email: string | null }> }),
    requestTeamIds.length > 0
      ? supabase.from('teams').select('id,name,age_group').in('id', requestTeamIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string | null; age_group: string | null }> }),
    requestTeamIds.length > 0
      ? supabase.from('players').select('team_id').in('team_id', requestTeamIds).eq('is_active', true)
      : Promise.resolve({ data: [] as Array<{ team_id: string | null }> })
  ]);
  const pendingRequests: PendingCoachJoinRequest[] = rawRequests.map((request) => {
    const profile = (requestProfiles ?? []).find((item) => item.id === request.coach_user_id);
    const team = (requestTeams ?? []).find((item) => item.id === request.team_id);
    return {
      id: request.id,
      coachName: profile?.full_name?.trim() || 'Coach',
      coachEmail: profile?.email ?? '',
      teamName: team?.name ?? null,
      ageGroup: team?.age_group ?? null,
      playerCount: (requestPlayers ?? []).filter((player) => player.team_id === request.team_id).length
    };
  });

  return (
    <div className="-mx-4 -my-4 min-h-screen px-4 py-10 md:-mx-8 md:-my-8 md:px-8" style={{ backgroundColor: '#080a0f' }}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">Teams</h1>
          <p className="mt-3 text-lg text-white/40">Manage your teams for {clubData.club.name}.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/club/teams/import"
            className="w-fit rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-white/60 transition-all duration-300 ease-out hover:bg-white/[0.05] hover:text-white"
          >
            Import Existing Team
          </Link>
          <Link
            href="/dashboard/club/teams/new"
            className="w-fit rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 ease-out hover:scale-[1.02]"
            style={{ backgroundColor: primaryColour, color: '#ffffff', boxShadow: `0 4px 20px ${primaryColour}59` }}
          >
            Add Team +
          </Link>
        </div>
      </div>

      <PendingCoachJoinRequests requests={pendingRequests} primaryColour={primaryColour} />

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
          <Link
            href="/dashboard/club/teams/import"
            className="mt-3 inline-block rounded-full border border-white/10 px-8 py-4 font-semibold text-white/55 transition-all duration-300 ease-out hover:bg-white/[0.05] hover:text-white"
          >
            Import Existing Team
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
              <div className="h-px w-full opacity-50" style={{ backgroundColor: team.primary_colour }} />
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link href={`/dashboard/club/teams/${team.id}`} className="block">
                      <h2 className="text-lg font-semibold text-white">{team.name}</h2>
                      <p className="mt-1 text-sm text-white/30">{team.age_group ?? 'Age group not set'}</p>
                    </Link>
                  </div>
                  <span className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ backgroundColor: `${team.primary_colour}1f`, borderColor: `${team.primary_colour}40`, color: team.primary_colour }}>
                    {titleCase(team.gender)}
                  </span>
                </div>
                <div className="my-4 h-px w-full bg-white/[0.06]" />
                <p className="text-sm text-white/35">Coach: {team.coach_name ?? 'Unassigned'}</p>
                {team.pending_invite ? <CoachInviteDrawer clubId={clubData.club.id} teamId={team.id} primaryColour={team.primary_colour} initialInvite={team.pending_invite} /> : null}
                {team.coach_user_id ? <Link href={`/dashboard/club/teams/${team.id}/coach-view`} className="mt-3 block text-sm font-semibold transition-all duration-300 ease-out hover:text-white" style={{ color: team.primary_colour }}>View as Coach →</Link> : null}
                <p className="mt-3 font-mono text-lg font-black tracking-[0.28em]" style={{ color: team.primary_colour }}>{team.join_code ?? '------'}</p>
                {team.join_code ? <CopyInviteButton inviteUrl={team.join_code} label="Copy Code" /> : null}
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-white/35">Players: {team.player_count}</p>
                  <Link href={`/dashboard/club/teams/${team.id}`} className="text-xl text-white/35 transition-all duration-300 ease-out hover:text-white">→</Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

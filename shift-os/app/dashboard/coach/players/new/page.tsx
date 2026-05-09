import Link from 'next/link';
import { redirect } from 'next/navigation';
import AddPlayerForm from '@/components/dashboard/AddPlayerForm';
import { getCoachDashboardData } from '@/lib/dashboard/getCoachDashboardData';
import { createClient } from '@/lib/supabase/server';

interface ClubPlayerOption {
  id: string;
  fullName: string;
  ageGroup: string | null;
  teamId: string | null;
}

interface RawClubPlayer {
  id: string;
  full_name: string;
  age_group: string | null;
  team_id: string | null;
}

export default async function NewPlayerPage() {
  const coachData = await getCoachDashboardData();
  if (!coachData) redirect('/dashboard/club');

  const supabase = await createClient();
  const { data: clubPlayersData } =
    coachData.club.id === 'independent'
      ? { data: [] as RawClubPlayer[] }
      : await supabase
          .from('players')
          .select('id,full_name,age_group,team_id')
          .eq('club_id', coachData.club.id)
          .eq('is_active', true)
          .order('full_name', { ascending: true });

  const clubPlayers: ClubPlayerOption[] = ((clubPlayersData ?? []) as RawClubPlayer[]).map((player) => ({
    id: player.id,
    fullName: player.full_name,
    ageGroup: player.age_group,
    teamId: player.team_id
  }));

  const teams = coachData.teams.map((team) => ({
    id: team.id,
    name: team.name,
    ageGroup: team.age_group
  }));

  return (
    <main className="min-h-screen px-5 py-10 text-white md:px-10" style={{ background: `radial-gradient(ellipse at top, ${coachData.club.primary_colour}10 0%, transparent 48%), #080a0f` }}>
      <div className="mx-auto max-w-7xl">
        <Link href="/dashboard/coach" className="text-sm text-white/40 transition-all duration-300 ease-out hover:text-white">
          Back to Coach Dashboard
        </Link>

        <div className="mt-8">
          <p className="text-xs uppercase tracking-[0.32em] text-white/25">Squad Setup</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">Add a Player</h1>
          <p className="mt-3 max-w-2xl text-lg text-white/40">Create a squad record, attach an existing club player and generate parent invite links into the team environment.</p>
        </div>

        <div className="mt-10">
          <AddPlayerForm clubId={coachData.club.id === 'independent' ? null : coachData.club.id} invitedBy={coachData.userId} primaryColour={coachData.club.primary_colour} teams={teams} clubPlayers={clubPlayers} />
        </div>
      </div>
    </main>
  );
}

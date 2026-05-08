import Link from 'next/link';
import { redirect } from 'next/navigation';
import AddTeamForm from '@/components/dashboard/AddTeamForm';
import { getClubData } from '@/lib/dashboard/getClubData';
import { createClient } from '@/lib/supabase/server';

interface CoachOption {
  userId: string;
  fullName: string;
}

function canManageTeams(role: string): boolean {
  return role === 'admin' || role === 'club_admin' || role === 'shift_admin';
}

export default async function NewTeamPage() {
  const clubData = await getClubData();
  if (!clubData) redirect('/onboarding');
  if (!canManageTeams(clubData.clubRole)) redirect('/dashboard/club');

  const supabase = await createClient();
  const { data: coachMemberships } = await supabase
    .from('club_members')
    .select('user_id')
    .eq('club_id', clubData.club.id)
    .eq('club_role', 'coach')
    .eq('is_active', true);

  const memberships = (coachMemberships ?? []) as Array<{ user_id: string }>;
  const coachIds = memberships.map((membership) => membership.user_id);
  const { data: coachProfiles } =
    coachIds.length > 0
      ? await supabase.from('users_profile').select('id,full_name').in('id', coachIds)
      : { data: [] as Array<{ id: string; full_name: string | null }> };

  const profiles = (coachProfiles ?? []) as Array<{ id: string; full_name: string | null }>;
  const coaches: CoachOption[] = coachIds.map((userId) => {
    const profile = profiles.find((item) => item.id === userId);
    return {
      userId,
      fullName: profile?.full_name?.trim() || 'Unnamed coach'
    };
  });

  return (
    <div className="-mx-4 -my-4 min-h-screen px-4 py-10 md:-mx-8 md:-my-8 md:px-8" style={{ backgroundColor: '#080a0f' }}>
      <Link href="/dashboard/club/teams" className="text-sm text-white/40 transition-all duration-300 ease-out hover:text-white">
        ← Back to Teams
      </Link>

      <div className="mt-8">
        <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">Add a New Team</h1>
        <p className="mt-3 max-w-xl text-lg text-white/40">Set up your team, assign a coach and generate their invite.</p>
      </div>

      <div className="mt-10">
        <AddTeamForm clubId={clubData.club.id} invitedBy={clubData.userId} primaryColour={clubData.club.primary_colour} coaches={coaches} />
      </div>
    </div>
  );
}

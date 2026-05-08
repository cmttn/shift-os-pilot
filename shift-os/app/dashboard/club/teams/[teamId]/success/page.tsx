import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import CopyInviteButton from '@/components/dashboard/CopyInviteButton';
import { getClubData } from '@/lib/dashboard/getClubData';
import { createClient } from '@/lib/supabase/server';

interface SuccessPageProps {
  params: {
    teamId: string;
  };
  searchParams: {
    invite_url?: string;
  };
}

interface TeamDetails {
  id: string;
  name: string;
  age_group: string | null;
  gender: string | null;
  club_id: string;
}

function canManageTeams(role: string): boolean {
  return role === 'admin' || role === 'club_admin' || role === 'shift_admin';
}

function titleCase(value: string | null): string {
  if (!value) return 'Not set';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default async function TeamCreatedSuccessPage({ params, searchParams }: SuccessPageProps) {
  const clubData = await getClubData();
  if (!clubData) redirect('/onboarding');
  if (!canManageTeams(clubData.clubRole)) redirect('/dashboard/club');

  const supabase = await createClient();
  const { data: teamData } = await supabase
    .from('teams')
    .select('id,name,age_group,gender,club_id')
    .eq('id', params.teamId)
    .eq('club_id', clubData.club.id)
    .maybeSingle();

  const team = teamData as TeamDetails | null;
  if (!team) notFound();

  const { data: leadCoach } = await supabase.from('team_coaches').select('user_id').eq('team_id', team.id).eq('is_lead', true).maybeSingle();
  const leadCoachRow = leadCoach as { user_id: string } | null;
  const { data: coachProfile } = leadCoachRow
    ? await supabase.from('users_profile').select('full_name').eq('id', leadCoachRow.user_id).maybeSingle()
    : { data: null };
  const profile = coachProfile as { full_name: string | null } | null;
  const coachName = profile?.full_name?.trim() || 'Your head coach';
  const inviteUrl = searchParams.invite_url;
  const primaryColour = clubData.club.primary_colour;

  return (
    <div className="-mx-4 -my-4 min-h-screen px-4 py-12 md:-mx-8 md:-my-8 md:px-8" style={{ backgroundColor: '#080a0f' }}>
      <section className="max-w-[760px] rounded-2xl border p-8" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <p className="text-6xl font-black" style={{ color: primaryColour }}>
          ✓
        </p>
        <h1 className="mt-5 text-4xl font-black tracking-tight md:text-5xl" style={{ color: primaryColour }}>
          Team Created!
        </h1>

        <div className="mt-8 grid gap-3 text-sm text-white/45 sm:grid-cols-3">
          <div className="rounded-[10px] border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/25">Team</p>
            <p className="mt-2 text-base font-semibold text-white">{team.name}</p>
          </div>
          <div className="rounded-[10px] border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/25">Age Group</p>
            <p className="mt-2 text-base font-semibold text-white">{team.age_group ?? 'Not set'}</p>
          </div>
          <div className="rounded-[10px] border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/25">Gender</p>
            <p className="mt-2 text-base font-semibold text-white">{titleCase(team.gender)}</p>
          </div>
        </div>

        {inviteUrl ? (
          <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h2 className="text-xl font-bold text-white">Coach Invite Link</h2>
            <code className="mt-4 block overflow-x-auto rounded-[10px] border border-white/[0.08] bg-black/30 p-4 text-sm text-white/70">{inviteUrl}</code>
            <CopyInviteButton inviteUrl={inviteUrl} />
            <p className="mt-4 text-sm text-white/35">Share this link via WhatsApp, email or message. Expires in 7 days.</p>
            <p className="mt-2 text-sm text-white/35">Once your coach signs up they will be automatically linked to this team.</p>
          </div>
        ) : (
          <p className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-white/50">{coachName} has been assigned as head coach.</p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard/club/teams/new"
            className="rounded-full px-8 py-4 text-center font-semibold transition-all duration-300 ease-out hover:scale-[1.02]"
            style={{ backgroundColor: primaryColour, color: '#ffffff' }}
          >
            Add Another Team →
          </Link>
          <Link href="/dashboard/club" className="rounded-full border border-white/10 px-6 py-4 text-center font-semibold text-white transition-all duration-300 ease-out hover:bg-white/[0.06]">
            Back to Dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}

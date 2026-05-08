import Link from 'next/link';
import { redirect } from 'next/navigation';
import CopyInviteButton from '@/components/dashboard/CopyInviteButton';
import { getCoachDashboardData } from '@/lib/dashboard/getCoachDashboardData';
import { createClient } from '@/lib/supabase/server';

interface PlayerSuccessPageProps {
  params: { playerId: string };
  searchParams: {
    team_id?: string;
    invite_url?: string;
    secondary_invite_url?: string;
  };
}

interface PlayerRecord {
  id: string;
  full_name: string;
  age_group: string | null;
  date_of_birth: string | null;
}

function calculateAge(dateOfBirth: string | null): string {
  if (!dateOfBirth) return 'DOB not set';
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.valueOf())) return 'DOB not set';
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const birthdayPassed = today.getMonth() > dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!birthdayPassed) age -= 1;
  return `${age} years old`;
}

export default async function PlayerSuccessPage({ params, searchParams }: PlayerSuccessPageProps) {
  const coachData = await getCoachDashboardData();
  if (!coachData) redirect('/dashboard/club');

  const teamId = searchParams.team_id ?? '';
  const assignedTeam = coachData.teams.find((team) => team.id === teamId);
  if (!assignedTeam) redirect('/dashboard/coach');

  const supabase = await createClient();
  const { data: playerData } = await supabase
    .from('players')
    .select('id,full_name,age_group,date_of_birth')
    .eq('id', params.playerId)
    .eq('club_id', coachData.club.id)
    .maybeSingle();

  const player = playerData as PlayerRecord | null;
  if (!player) redirect('/dashboard/coach');

  return (
    <main className="min-h-screen px-5 py-10 text-white md:px-10" style={{ background: `radial-gradient(ellipse at top, ${coachData.club.primary_colour}10 0%, transparent 48%), #080a0f` }}>
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border p-8 md:p-10" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-6xl font-black leading-none" style={{ color: coachData.club.primary_colour }}>✓</p>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-white">Player Added</h1>
          <p className="mt-3 text-lg text-white/40">{player.full_name} is now linked to {assignedTeam.name}.</p>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              ['Team', assignedTeam.name],
              ['Age Group', player.age_group ?? 'Not set'],
              ['Age', calculateAge(player.date_of_birth)]
            ].map(([label, value]) => (
              <div key={label} className="rounded-[10px] border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/25">{label}</p>
                <p className="mt-2 font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>

          {searchParams.invite_url ? (
            <section className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <h2 className="text-xl font-bold text-white">Parent Invite Link</h2>
              <p className="mt-2 text-sm text-white/35">Share this link via WhatsApp, email or message. It opens directly into this player record and team environment, and expires in 7 days.</p>
              <code className="mt-5 block overflow-x-auto rounded-[10px] border border-white/[0.06] bg-black/30 p-4 text-sm text-white/65">{searchParams.invite_url}</code>
              <CopyInviteButton inviteUrl={searchParams.invite_url} />
            </section>
          ) : null}

          {searchParams.secondary_invite_url ? (
            <section className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <h2 className="text-xl font-bold text-white">Second Parent Invite Link</h2>
              <code className="mt-5 block overflow-x-auto rounded-[10px] border border-white/[0.06] bg-black/30 p-4 text-sm text-white/65">{searchParams.secondary_invite_url}</code>
              <CopyInviteButton inviteUrl={searchParams.secondary_invite_url} />
            </section>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard/coach/players/new" className="rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 ease-out hover:scale-[1.02]" style={{ backgroundColor: coachData.club.primary_colour, color: '#ffffff' }}>
              Add Another Player
            </Link>
            <Link href="/dashboard/coach" className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ease-out hover:bg-white/[0.06]">
              Back to Coach Dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

import { redirect } from 'next/navigation';
import SignOutButton from '@/components/auth/SignOutButton';
import CoachPotmSettingsForm from '@/components/dashboard/CoachPotmSettingsForm';
import { getCoachData } from '@/lib/dashboard/getCoachData';

export default async function CoachSettingsPage() {
  const coachData = await getCoachData();
  if (!coachData) redirect('/dashboard/coach/welcome');
  const activeTeam = coachData.teams[0] ?? null;
  const primaryColour = activeTeam?.club_primary_colour ?? '#00C851';

  return (
    <main className="min-h-screen px-5 pb-[92px] pt-10 text-white md:ml-[260px] md:px-8" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[720px]">
        <p className="text-xs uppercase tracking-[0.3em] text-white/30">Coach Settings</p>
        <h1 className="mt-3 text-3xl font-black">Settings</h1>
        <section className="mt-6 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-xl font-bold">Account</h2>
          <div className="mt-5 space-y-3 text-sm">
            <p className="flex justify-between gap-4 border-b border-white/[0.06] pb-3"><span className="text-white/35">Name</span><span className="text-right text-white">{coachData.coach.full_name}</span></p>
            <p className="flex justify-between gap-4 border-b border-white/[0.06] pb-3"><span className="text-white/35">Email</span><span className="text-right text-white">{coachData.coach.email}</span></p>
            <p className="flex justify-between gap-4 border-b border-white/[0.06] pb-3"><span className="text-white/35">Assigned teams</span><span className="text-right text-white">{coachData.teams.map((team) => team.name).join(', ') || 'No teams assigned'}</span></p>
          </div>
        </section>
        <CoachPotmSettingsForm userId={coachData.coach.id} clubId={activeTeam?.club_id ?? null} primaryColour={primaryColour} />
        <section className="mt-6 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-xl font-bold">Session</h2>
          <div className="mt-5">
            <SignOutButton />
          </div>
        </section>
      </div>
    </main>
  );
}

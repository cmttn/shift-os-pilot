import Link from 'next/link';
import { redirect } from 'next/navigation';
import SignOutButton from '@/components/auth/SignOutButton';
import { getClubData } from '@/lib/dashboard/getClubData';
import { createClient } from '@/lib/supabase/server';

export default async function ClubSettingsPage() {
  const clubData = await getClubData();
  if (!clubData) redirect('/onboarding');
  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const email = sessionData.session?.user.email ?? '';

  return (
    <main className="min-h-screen px-5 pb-[92px] pt-10 text-white md:px-8" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[720px]">
        <p className="text-xs uppercase tracking-[0.3em] text-white/30">Club Settings</p>
        <h1 className="mt-3 text-3xl font-black">Settings</h1>
        <section className="mt-6 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-xl font-bold">Account</h2>
          <div className="mt-5 space-y-3 text-sm">
            <p className="flex justify-between gap-4 border-b border-white/[0.06] pb-3"><span className="text-white/35">Name</span><span className="text-right text-white">{clubData.firstName}</span></p>
            <p className="flex justify-between gap-4 border-b border-white/[0.06] pb-3"><span className="text-white/35">Email</span><span className="text-right text-white">{email}</span></p>
            <p className="flex justify-between gap-4 border-b border-white/[0.06] pb-3"><span className="text-white/35">Club</span><span className="text-right text-white">{clubData.club.name}</span></p>
            <p className="flex justify-between gap-4 border-b border-white/[0.06] pb-3"><span className="text-white/35">Plan</span><span className="text-right text-white">{clubData.club.plan_tier}</span></p>
          </div>
        </section>
        <section className="mt-6 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-xl font-bold">Player of the Match</h2>
          <p className="mt-2 text-sm text-white/40">Set club-wide POTM message rules, coach voting and player voting age.</p>
          <Link href="/dashboard/club/settings/potm" className="mt-5 inline-flex rounded-full px-5 py-3 text-sm font-semibold text-black" style={{ backgroundColor: clubData.club.primary_colour }}>Manage POTM Settings</Link>
        </section>
        <section className="mt-6 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-xl font-bold">Coach Recognition</h2>
          <p className="mt-2 text-sm text-white/40">Set positive ticket thresholds and rewards for coach recognition.</p>
          <Link href="/dashboard/club/settings/recognition" className="mt-5 inline-flex rounded-full px-5 py-3 text-sm font-semibold text-black" style={{ backgroundColor: clubData.club.primary_colour }}>Manage Recognition</Link>
        </section>
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

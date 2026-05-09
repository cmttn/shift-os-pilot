import Link from 'next/link';
import { redirect } from 'next/navigation';
import CoachJoinTeamForm from '@/components/dashboard/CoachJoinTeamForm';
import { createClient } from '@/lib/supabase/server';

export default async function CoachWelcomePage() {
  const supabase = await createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();
  if (!session) redirect('/auth/login');

  const { data: profile } = await supabase.from('users_profile').select('full_name').eq('id', session.user.id).maybeSingle<{ full_name: string | null }>();
  const coachName = profile?.full_name?.trim() || session.user.user_metadata.full_name || 'Coach';
  const coachEmail = session.user.email ?? 'coach@shift-os.local';
  const primaryColour = '#00C851';

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10 text-white" style={{ backgroundColor: '#080a0f' }}>
      <section className="w-full max-w-5xl">
        <p className="text-center text-sm font-black tracking-[0.36em]" style={{ color: primaryColour }}>SHIFT/OS</p>
        <h1 className="mt-8 text-center text-5xl font-black tracking-tight">Welcome, Coach.</h1>
        <p className="mt-3 text-center text-lg text-white/40">What would you like to do first?</p>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          <article className="rounded-[20px] border p-10 transition-all duration-300 ease-out hover:-translate-y-[3px]" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <p className="text-4xl">🔗</p>
            <h2 className="mt-5 text-2xl font-bold">Join a Team</h2>
            <p className="mt-2 text-white/35">Your club is already on Shift OS. Enter your team&apos;s join code.</p>
            <CoachJoinTeamForm primaryColour={primaryColour} userId={session.user.id} coachName={String(coachName)} coachEmail={coachEmail} />
          </article>

          <Link href="/dashboard/coach/teams/new" className="rounded-[20px] border p-10 transition-all duration-300 ease-out hover:-translate-y-[3px]" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <p className="text-4xl">⚽</p>
            <h2 className="mt-5 text-2xl font-bold">Create My Team</h2>
            <p className="mt-2 text-white/35">Set up your own team and manage your squad independently.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}

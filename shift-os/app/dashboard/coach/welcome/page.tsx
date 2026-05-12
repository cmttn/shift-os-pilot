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

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-5 py-10 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.18),transparent_36%),radial-gradient(circle_at_50%_100%,rgba(14,165,233,0.1),transparent_45%)]" />
      <section className="relative z-10 w-full max-w-5xl">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.42em] text-sky-300/80">SHIFT/OS</p>
        <h1 className="mt-8 text-center text-5xl font-semibold tracking-tight">Welcome, Coach.</h1>
        <p className="mt-3 text-center text-lg text-slate-300">What would you like to do first?</p>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-white/12 bg-white/5 p-10 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.95)] backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-[3px] hover:border-sky-300/40 hover:bg-white/[0.08]">
            <h2 className="text-2xl font-bold">Join a Team</h2>
            <p className="mt-2 text-slate-300">Your club is already on Shift OS. Enter your team&apos;s join code.</p>
            <CoachJoinTeamForm primaryColour="#38bdf8" userId={session.user.id} coachName={String(coachName)} coachEmail={coachEmail} />
          </article>

          <Link href="/dashboard/coach/teams/new" className="group rounded-2xl border border-white/12 bg-white/5 p-10 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.95)] backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-[3px] hover:border-sky-300/40 hover:bg-white/[0.08]">
            <h2 className="text-2xl font-bold">Create My Team</h2>
            <p className="mt-2 text-slate-300">Set up your identity, badge, colours, and first squad.</p>
            <span className="mt-6 inline-flex text-sm font-medium text-sky-300 transition-transform duration-300 group-hover:translate-x-1">Continue -&gt;</span>
          </Link>
        </div>
      </section>
    </main>
  );
}

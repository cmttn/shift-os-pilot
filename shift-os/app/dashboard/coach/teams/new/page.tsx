import Link from 'next/link';
import { redirect } from 'next/navigation';
import CoachCreateTeamForm from '@/components/dashboard/CoachCreateTeamForm';
import { createClient } from '@/lib/supabase/server';

export default async function CoachNewTeamPage() {
  const supabase = await createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();
  if (!session) redirect('/auth/login');

  const { count: assignedTeamCount } = await supabase
    .from('team_coaches')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.user.id);

  if ((assignedTeamCount ?? 0) > 0) {
    redirect('/dashboard/coach');
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-5 py-10 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.18),transparent_36%),radial-gradient(circle_at_50%_100%,rgba(14,165,233,0.1),transparent_45%)]" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <Link href="/dashboard/coach/welcome" className="text-sm text-slate-400 transition-all duration-300 ease-out hover:text-sky-300">Back</Link>
        <div className="mb-10 mt-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.42em] text-sky-300/80">SHIFT/OS</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">Create My Team</h1>
          <p className="mt-3 text-slate-300">Set the badge, colours, and first squad your pages will use.</p>
        </div>
        <CoachCreateTeamForm userId={session.user.id} />
      </div>
    </main>
  );
}

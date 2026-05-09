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

  return (
    <main className="min-h-screen px-5 py-10 text-white" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard/coach/welcome" className="text-sm text-white/40 transition-all duration-300 ease-out hover:text-white">← Back</Link>
        <div className="mb-10 mt-8 text-center">
          <p className="text-sm font-black tracking-[0.36em] text-white/25">SHIFT/OS</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">Create My Team</h1>
          <p className="mt-3 text-white/40">Start independently. You can connect into a club later.</p>
        </div>
        <CoachCreateTeamForm userId={session.user.id} primaryColour="#00C851" />
      </div>
    </main>
  );
}

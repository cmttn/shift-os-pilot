import { redirect } from 'next/navigation';
import PlayerJoinTeamForm from '@/components/dashboard/PlayerJoinTeamForm';
import { createClient } from '@/lib/supabase/server';

export default async function PlayerWelcomePage() {
  const supabase = await createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();
  if (!session) redirect('/auth/login');

  const { data: profile } = await supabase.from('users_profile').select('full_name').eq('id', session.user.id).maybeSingle<{ full_name: string | null }>();
  const defaultName = profile?.full_name?.trim() || String(session.user.user_metadata.full_name ?? '');

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10 text-white" style={{ backgroundColor: '#080a0f' }}>
      <section className="w-full max-w-[600px] rounded-[20px] border p-8 md:p-10" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <p className="text-center text-sm font-black tracking-[0.36em]" style={{ color: '#00C851' }}>SHIFT/OS</p>
        <h1 className="mt-8 text-center text-5xl font-black tracking-tight">Find Your Team</h1>
        <p className="mt-3 text-center text-white/40">Enter your team&apos;s join code to send a request to join.</p>
        <PlayerJoinTeamForm primaryColour="#00C851" userId={session.user.id} defaultName={defaultName} />
      </section>
    </main>
  );
}

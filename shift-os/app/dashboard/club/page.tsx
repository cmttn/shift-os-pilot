import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function ClubDashboardPage() {
  const supabase = await createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/');
  }

  const fullName =
    typeof session.user.user_metadata.full_name === 'string' && session.user.user_metadata.full_name.trim().length > 0
      ? session.user.user_metadata.full_name
      : 'there';

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <section className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/80 p-10 text-center shadow-2xl">
        <h1 className="text-3xl font-semibold">Welcome to Shift OS, {fullName}</h1>
        <p className="mt-4 text-lg text-slate-300">Your club dashboard is coming soon.</p>
      </section>
    </main>
  );
}

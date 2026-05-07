import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
        <h1 className="text-3xl font-bold">Welcome to Shift OS</h1>
        <p className="mt-2 text-slate-300">Signed in as {session.user.email}</p>
      </div>
    </main>
  );
}

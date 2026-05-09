'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type ClubMemberLookup = { id: string };

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(
    searchParams.get('message') === 'confirm-failed' ? 'We could not confirm that email link. Please try signing in or request a new link.' : null
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    const supabase = createClient();
    const normalizedEmail = email.trim().toLowerCase();
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });

    if (signInError || !signInData.user) {
      setLoading(false);
      if (signInError?.message.toLowerCase().includes('email not confirmed')) {
        setError('Your account exists but the email address has not been confirmed yet. Check your inbox, or create the account again to resend the confirmation email.');
        return;
      }
      setError('Incorrect email or password. Please try again.');
      return;
    }

    const { data: membership } = await supabase
      .from('club_members')
      .select('id')
      .eq('user_id', signInData.user.id)
      .eq('is_active', true)
      .maybeSingle<ClubMemberLookup>();

    setLoading(false);

    if (membership) {
      router.push('/dashboard/club');
      router.refresh();
      return;
    }

    router.push('/onboarding');
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur">
        <p className="mb-6 text-center text-xs font-semibold tracking-[0.35em] text-slate-300">SHIFT/OS</p>
        <h1 className="mb-6 text-center text-3xl font-semibold">Sign in</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input disabled={loading} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 disabled:cursor-not-allowed disabled:opacity-70" />
          <input disabled={loading} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 disabled:cursor-not-allowed disabled:opacity-70" />

          {notice && <p className="rounded-lg border border-indigo-400/25 bg-indigo-400/10 px-4 py-3 text-sm text-indigo-100">{notice}</p>}
          {error && <p className="text-sm text-rose-400">{error}</p>}

          <button disabled={loading} type="submit" className="flex w-full items-center justify-center rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-indigo-500/70">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Signing in...
              </span>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-300">
          New to Shift OS?{' '}
          <Link href="/auth/signup" className="font-medium text-indigo-300 underline">
            Create account
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">Loading...</main>}>
      <LoginForm />
    </Suspense>
  );
}

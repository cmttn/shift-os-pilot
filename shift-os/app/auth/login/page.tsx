'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { completeFamilyInvite } from '@/lib/auth/completeFamilyInvite';
import { completePlayerInvite } from '@/lib/auth/completePlayerInvite';
import { createClient } from '@/lib/supabase/client';

type ClubMemberLookup = { id: string };

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite_token');
  const familyToken = searchParams.get('family_token');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
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
    if (rememberMe) {
      sessionStorage.removeItem('shift-os-no-persist');
    } else {
      sessionStorage.setItem('shift-os-no-persist', 'true');
    }
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

    const playerInviteRedirect = await completePlayerInvite(supabase, signInData.user.id, inviteToken).catch(() => null);
    const familyInviteRedirect = await completeFamilyInvite(supabase, signInData.user.id, familyToken).catch(() => null);

    if (playerInviteRedirect) {
      setLoading(false);
      router.push(playerInviteRedirect);
      router.refresh();
      return;
    }
    if (familyInviteRedirect) {
      setLoading(false);
      router.push(familyInviteRedirect);
      router.refresh();
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

          <label className="flex items-center gap-3">
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-[4px] border transition-all duration-300 ease-out" style={rememberMe ? { backgroundColor: '#00C851', borderColor: '#00C851' } : { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.2)' }}>
              {rememberMe ? <span className="text-xs font-black text-white">✓</span> : null}
            </span>
            <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="sr-only" />
            <span className="text-sm text-white/50">Remember me on this device</span>
          </label>

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
          <Link href={`/auth/signup${inviteToken ? `?invite_token=${encodeURIComponent(inviteToken)}&role=parent` : familyToken ? `?family_token=${encodeURIComponent(familyToken)}&role=family` : ''}`} className="font-medium text-indigo-300 underline">
            Create account
          </Link>
        </p>
        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="text-xs text-white/20">Dev shortcuts — Test accounts:</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {[
              ['Club Admin', 'cmttn@yahoo.co.uk'],
              ['Coach', 'coach1test@shiftos.com'],
              ['Parent', 'parent1test@shiftos.com']
            ].map(([label, value]) => (
              <button key={value} type="button" onClick={() => setEmail(value)} className="text-xs text-white/20 transition-all duration-300 ease-out hover:text-white/50">
                {label}
              </button>
            ))}
          </div>
        </div>
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

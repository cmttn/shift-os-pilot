'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { completeFamilyInvite } from '@/lib/auth/completeFamilyInvite';
import { completePendingInvite } from '@/lib/auth/completeInvite';
import { completePlayerInvite } from '@/lib/auth/completePlayerInvite';
import { createClient } from '@/lib/supabase/client';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intendedRole = searchParams.get('role');
  const inviteToken = searchParams.get('invite_token') ?? searchParams.get('invite');
  const familyToken = searchParams.get('family_token');
  const clubId = searchParams.get('club');
  const teamId = searchParams.get('team');
  const playerId = searchParams.get('player');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isDisabled = useMemo(() => loading, [loading]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const normalizedEmail = email.trim().toLowerCase();
    const nextPath = inviteToken || familyToken ? '/dashboard' : intendedRole === 'club_admin' || !intendedRole ? '/onboarding' : '/dashboard';
    const callbackParams = new URLSearchParams({ next: nextPath });
    if (inviteToken) callbackParams.set('invite_token', inviteToken);
    if (familyToken) callbackParams.set('family_token', familyToken);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?${callbackParams.toString()}`,
        data: {
          full_name: fullName.trim(),
          intended_role: intendedRole,
          invite_token: inviteToken,
          family_token: familyToken,
          club_id: clubId,
          team_id: teamId,
          player_id: playerId
        }
      }
    });
    setLoading(false);

    if (signUpError) {
      const message = signUpError.message.toLowerCase();
      if (message.includes('already') || message.includes('exists')) {
        setError('An account with this email already exists.');
        return;
      }
      setError(signUpError.message);
      return;
    }

    if (!data.user) {
      setError('Unable to create account right now. Please try again.');
      return;
    }

    if (!data.session) {
      setNotice('Account created. Check your email to confirm your account, then you will be brought back into Shift OS.');
      return;
    }

    try {
      const playerInviteRedirect = await completePlayerInvite(supabase, data.user.id, inviteToken);
      if (playerInviteRedirect) {
        router.push(playerInviteRedirect);
        router.refresh();
        return;
      }
      const familyInviteRedirect = await completeFamilyInvite(supabase, data.user.id, familyToken);
      if (familyInviteRedirect) {
        router.push(familyInviteRedirect);
        router.refresh();
        return;
      }
      const inviteRedirect = await completePendingInvite(supabase, data.user.id, data.user.user_metadata);
      router.push(inviteRedirect ?? nextPath);
      router.refresh();
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : 'Your account was created, but the invite could not be accepted.');
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur">
      <p className="mb-6 text-center text-xs font-semibold tracking-[0.35em] text-slate-300">SHIFT/OS</p>
      <h1 className="mb-6 text-center text-3xl font-semibold">Create your account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input disabled={isDisabled} type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 disabled:cursor-not-allowed disabled:opacity-70" />
        <input disabled={isDisabled} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 disabled:cursor-not-allowed disabled:opacity-70" />
        <input disabled={isDisabled} type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 8 characters)" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 disabled:cursor-not-allowed disabled:opacity-70" />
        <input disabled={isDisabled} type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 disabled:cursor-not-allowed disabled:opacity-70" />
        {error && (
          <p className="text-sm text-rose-400">
            {error}{' '}
            {error === 'An account with this email already exists.' && (
              <Link href={`/auth/login${inviteToken ? `?invite_token=${encodeURIComponent(inviteToken)}` : familyToken ? `?family_token=${encodeURIComponent(familyToken)}` : ''}`} className="font-medium text-indigo-300 underline">Go to login</Link>
            )}
          </p>
        )}
        {notice && <p className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{notice}</p>}
        <button disabled={isDisabled} type="submit" className="flex w-full items-center justify-center rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-indigo-500/70">
          {loading ? <span className="inline-flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Creating account...</span> : 'Create account'}
        </button>
      </form>
    </div>
  );
}

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <Suspense fallback={<div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center">Loading...</div>}>
        <SignupForm />
      </Suspense>
    </main>
  );
}

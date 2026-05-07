'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <form onSubmit={handleSubmit} className="w-full space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-2xl font-bold">Login</h1>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-md border border-slate-700 bg-slate-950 p-3" />
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-md border border-slate-700 bg-slate-950 p-3" />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button disabled={loading} className="w-full rounded-md bg-blue-600 px-4 py-3 font-semibold disabled:opacity-70">{loading ? 'Signing in...' : 'Sign in'}</button>
        <p className="text-sm text-slate-400">No account? <Link href="/auth/signup" className="text-blue-400">Sign up</Link></p>
      </form>
    </main>
  );
}

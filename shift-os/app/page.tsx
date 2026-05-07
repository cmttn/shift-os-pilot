import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-4xl font-bold">Shift OS</h1>
      <p className="text-slate-300">Local auth scaffold with Next.js 14 + Supabase SSR.</p>
      <div className="flex gap-4">
        <Link href="/auth/login" className="rounded-md bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500">
          Login
        </Link>
        <Link href="/auth/signup" className="rounded-md border border-slate-600 px-4 py-2 font-semibold hover:bg-slate-800">
          Sign up
        </Link>
      </div>
    </main>
  );
}

import Link from 'next/link';

type RoleCard = {
  title: 'Board' | 'Coach' | 'Player' | 'Parent';
  description: string;
  href: string;
};

const roles: RoleCard[] = [
  {
    title: 'Board',
    description: 'Club oversight, identity, structure and control.',
    href: '/auth/signup?role=club_admin',
  },
  {
    title: 'Coach',
    description: 'Manage teams, fixtures, availability and player time.',
    href: '/auth/signup?role=coach',
  },
  {
    title: 'Player',
    description: 'Track your profile, development and club journey.',
    href: '/auth/signup?role=player',
  },
  {
    title: 'Parent',
    description: 'Confirm availability, view fixtures and support your child.',
    href: '/auth/signup?role=parent',
  },
];

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-12 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.18),transparent_36%),radial-gradient(circle_at_50%_100%,rgba(14,165,233,0.1),transparent_45%)]" />

      <section className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.42em] text-sky-300/80">SHIFT/OS</p>
          <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
            The operating system for your club.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Built for grassroots football, SHIFT/OS aligns every part of your club around five pillars:
            Simplicity, Hierarchy, Identity, Fairness, and Transparency.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {roles.map((role) => (
            <Link
              key={role.title}
              href={role.href}
              className="group rounded-2xl border border-white/12 bg-white/5 p-6 text-left shadow-[0_18px_40px_-24px_rgba(15,23,42,0.95)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-sky-300/40 hover:bg-white/[0.08]"
            >
              <h2 className="text-xl font-medium text-slate-50">{role.title}</h2>
              <p className="mt-3 min-h-16 text-sm leading-relaxed text-slate-300">{role.description}</p>
              <span className="mt-6 inline-flex text-sm font-medium text-sky-300 transition-transform duration-300 group-hover:translate-x-1">
                Continue →
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-slate-400">
          Returning user?{' '}
          <Link href="/auth/login" className="font-medium text-slate-200 underline underline-offset-4 hover:text-sky-300">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}

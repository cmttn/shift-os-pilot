import Link from 'next/link';

interface NewTeamPlayerPlaceholderProps {
  params: {
    teamId: string;
  };
}

export default function NewTeamPlayerPlaceholder({ params }: NewTeamPlayerPlaceholderProps) {
  return (
    <main className="min-h-screen px-5 py-10 text-white md:ml-[260px]" style={{ backgroundColor: '#080a0f' }}>
      <Link href={`/dashboard/club/teams/${params.teamId}`} className="text-sm text-white/40 transition-all duration-300 ease-out hover:text-white">
        ← Back to Team
      </Link>
      <section className="mt-10 max-w-[680px] rounded-2xl border p-8" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <h1 className="text-3xl font-black tracking-tight text-white">Add Player — coming soon</h1>
        <p className="mt-3 text-white/40">This route is reserved for the club-admin player add workflow.</p>
      </section>
    </main>
  );
}

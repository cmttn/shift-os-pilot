export default function PlayerGoalsPage() {
  return (
    <main className="min-h-screen px-5 pb-28 pt-8 text-white" style={{ backgroundColor: '#080a0f' }}>
      <section className="mx-auto max-w-[520px] rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <p className="text-xs uppercase tracking-[0.28em] text-white/30">Goals</p>
        <h1 className="mt-3 text-3xl font-black">Player Goals</h1>
        <p className="mt-3 text-sm text-white/40">Personal goals and milestones will appear here once your account is linked.</p>
      </section>
    </main>
  );
}

import Link from 'next/link';
import BottomNav from '@/components/mobile/BottomNav';

export default function PlayerDashboardHoldingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10 text-center text-white" style={{ backgroundColor: '#080a0f' }}>
      <section className="max-w-[520px] rounded-2xl border p-8" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <p className="text-5xl font-black" style={{ color: '#00C851' }}>✓</p>
        <h1 className="mt-5 text-3xl font-black">Request sent.</h1>
        <p className="mt-3 text-white/40">Your coach will be in touch once your request has been reviewed.</p>
        <Link href="/dashboard/player/welcome" className="mt-6 inline-block rounded-full border border-white/10 px-6 py-3 font-semibold text-white transition-all duration-300 ease-out hover:bg-white/[0.06]">
          Back to Join Code
        </Link>
      </section>
      <BottomNav primaryColour="#00C851" items={[
        { href: '/dashboard/player', label: 'Home', icon: 'H' },
        { href: '/dashboard/player/welcome', label: 'Join', icon: 'J' },
        { href: '/dashboard/player/settings', label: 'Settings', icon: 'S' }
      ]} />
    </main>
  );
}

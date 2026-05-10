import SignOutButton from '@/components/auth/SignOutButton';

interface SettingsShellProps {
  title: string;
  name: string;
  email: string;
  contextRows: Array<{ label: string; value: string }>;
  desktopOffset?: boolean;
}

export default function SettingsShell({ title, name, email, contextRows, desktopOffset = false }: SettingsShellProps) {
  return (
    <main className={`min-h-screen px-5 pb-[92px] pt-10 text-white md:px-8 ${desktopOffset ? 'md:ml-[260px]' : ''}`} style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[720px]">
        <p className="text-xs uppercase tracking-[0.3em] text-white/30">{title}</p>
        <h1 className="mt-3 text-3xl font-black">Settings</h1>
        <section className="mt-6 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-xl font-bold">Account</h2>
          <div className="mt-5 space-y-3 text-sm">
            <p className="flex justify-between gap-4 border-b border-white/[0.06] pb-3"><span className="text-white/35">Name</span><span className="text-right text-white">{name}</span></p>
            <p className="flex justify-between gap-4 border-b border-white/[0.06] pb-3"><span className="text-white/35">Email</span><span className="text-right text-white">{email}</span></p>
            {contextRows.map((row) => (
              <p key={row.label} className="flex justify-between gap-4 border-b border-white/[0.06] pb-3"><span className="text-white/35">{row.label}</span><span className="text-right text-white">{row.value}</span></p>
            ))}
          </div>
        </section>
        <section className="mt-6 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-xl font-bold">Session</h2>
          <div className="mt-5">
            <SignOutButton />
          </div>
        </section>
      </div>
    </main>
  );
}

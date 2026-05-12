'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface PlayerCompletePageProps {
  params: {
    token: string;
  };
}

interface InvitePlayerRow {
  id: string;
  parent_user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  dob: string | null;
  fa_fan_number: string | null;
  fa_fan_added_by: string | null;
  teams?: {
    name: string | null;
    clubs?: {
      name: string | null;
      badge_url: string | null;
      primary_colour: string | null;
    } | Array<{
      name: string | null;
      badge_url: string | null;
      primary_colour: string | null;
    }> | null;
  } | Array<{
    name: string | null;
    clubs?: {
      name: string | null;
      badge_url: string | null;
      primary_colour: string | null;
    } | Array<{
      name: string | null;
      badge_url: string | null;
      primary_colour: string | null;
    }> | null;
  }> | null;
}

function getFirstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function darkenHex(hexColour: string, percent: number): string {
  const hex = hexColour.replace('#', '');
  const value = parseInt(hex.length === 6 ? hex : '00c851', 16);
  const amount = Math.round((255 * percent) / 100);
  const red = Math.max(0, (value >> 16) - amount);
  const green = Math.max(0, ((value >> 8) & 0xff) - amount);
  const blue = Math.max(0, (value & 0xff) - amount);
  return `#${((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1)}`;
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function PlayerInviteCompletePage({ params }: PlayerCompletePageProps) {
  const router = useRouter();
  const [player, setPlayer] = useState<InvitePlayerRow | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [dob, setDob] = useState('');
  const [fanNumber, setFanNumber] = useState('');
  const [initialFanNumber, setInitialFanNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadInvite() {
      const supabase = createClient();
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace(`/auth/login?invite_token=${encodeURIComponent(params.token)}`);
        return;
      }

      const { data, error: loadError } = await supabase
        .from('players')
        .select('id,parent_user_id,first_name,last_name,dob,fa_fan_number,fa_fan_added_by,teams(name,clubs(name,badge_url,primary_colour))')
        .eq('invite_token', params.token)
        .eq('parent_user_id', session.user.id)
        .maybeSingle<InvitePlayerRow>();

      if (loadError || !data) {
        setError(loadError?.message ?? 'This invite profile could not be found.');
        setLoading(false);
        return;
      }

      setUserId(session.user.id);
      setPlayer(data);
      setDob(data.dob ?? '');
      setFanNumber(data.fa_fan_number ?? '');
      setInitialFanNumber(data.fa_fan_number ?? '');
      setLoading(false);
    }

    void loadInvite();
  }, [params.token, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!player || !userId) return;
    if (!dob) {
      setError('Date of birth is required.');
      return;
    }

    setSaving(true);
    setError('');
    const trimmedFan = fanNumber.trim();
    const updatePayload: {
      dob: string;
      fa_fan_number?: string | null;
      fa_fan_added_by?: 'parent' | null;
    } = { dob };

    if (trimmedFan !== initialFanNumber) {
      updatePayload.fa_fan_number = trimmedFan || null;
      updatePayload.fa_fan_added_by = trimmedFan ? 'parent' : null;
    }

    const { error: updateError } = await createClient()
      .from('players')
      .update(updatePayload)
      .eq('id', player.id)
      .eq('parent_user_id', userId);

    if (updateError) {
      setSaving(false);
      setError(updateError.message);
      return;
    }

    router.push('/dashboard/parent');
    router.refresh();
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-[#080a0f] px-5 text-white/50">Loading profile...</main>;
  }

  if (!player) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080a0f] px-5 text-center text-white">
        <section className="w-full max-w-[480px] rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8">
          <h1 className="text-2xl font-black">Profile unavailable</h1>
          <p className="mt-3 text-sm text-white/40">{error || 'This invite could not be found.'}</p>
          <Link href="/dashboard/parent" className="mt-6 inline-flex rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white">Go to dashboard</Link>
        </section>
      </main>
    );
  }

  const team = getFirstRelation(player.teams);
  const club = getFirstRelation(team?.clubs);
  const primaryColour = club?.primary_colour ?? '#00C851';
  const darkColour = darkenHex(primaryColour, 25);
  const firstName = player.first_name?.trim() || 'Player';
  const lastName = player.last_name?.trim() || '';
  const teamName = team?.name ?? 'Your team';
  const clubName = club?.name ?? teamName;

  return (
    <main className="min-h-screen bg-[#080a0f] px-5 pb-24 pt-10 text-white">
      <section className="mx-auto max-w-[480px]">
        <header className="text-center">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full ring-1 ring-white/20"
            style={{ background: `linear-gradient(135deg, ${primaryColour}, ${darkColour})`, boxShadow: `0 16px 34px rgba(0,0,0,0.55), 0 0 24px ${primaryColour}66` }}
          >
            {club?.badge_url ? <img src={club.badge_url} alt={`${clubName} badge`} className="h-full w-full object-cover" /> : <span className="text-lg font-black text-white">{initials(clubName)}</span>}
          </div>
          <p className="mt-3 text-sm text-white/50">{teamName}</p>
          <h1 className="mt-4 text-2xl font-black text-white">{firstName}&apos;s profile</h1>
          <p className="mt-2 text-sm text-white/40">Help us complete {firstName}&apos;s details.</p>
        </header>

        <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
          <label className="block text-sm font-medium text-white">First name</label>
          <input value={firstName} readOnly className="mt-2 w-full cursor-not-allowed rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white opacity-60 outline-none" />

          <label className="mt-4 block text-sm font-medium text-white">Last name</label>
          <input value={lastName} readOnly className="mt-2 w-full cursor-not-allowed rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white opacity-60 outline-none" />

          <label className="mt-4 block text-sm font-medium text-white">Date of birth</label>
          <input type="date" value={dob} onChange={(event) => setDob(event.target.value)} required className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-white/25" />

          <div className="my-5 h-px bg-white/[0.06]" />

          <div className="mb-1 flex items-center gap-2">
            <label className="text-sm font-semibold text-white">FA Registration Number (FAN)</label>
            {player.fa_fan_added_by === 'coach' && player.fa_fan_number ? <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-white/30">Added by coach</span> : null}
          </div>
          <input type="text" value={fanNumber} onChange={(event) => setFanNumber(event.target.value)} placeholder="e.g. 67618567" className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-white/25 placeholder:text-white/25" />

          <div className="mt-3 rounded-xl border border-blue-500/10 bg-blue-500/[0.05] p-4">
            <p className="mb-2 text-sm font-semibold text-white">Don&apos;t know {firstName}&apos;s FAN number?</p>
            <ol className="list-decimal space-y-1 pl-4 text-xs text-white/50">
              <li>Log in to your FA account at myaccount.thefa.com</li>
              <li>Click on {firstName}&apos;s name under &quot;Individuals&quot;</li>
              <li>Copy the FAN number shown at the top of their profile</li>
              <li>Enter it in the field above</li>
            </ol>
            <a href="https://myaccount.thefa.com" target="_blank" rel="noreferrer" className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/[0.15] px-4 py-3 text-center text-sm font-semibold text-blue-400">
              Open FA Account
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7" /><path d="M7 7h10v10" /></svg>
            </a>
            <p className="mt-3 text-center text-xs text-white/25">FAN numbers help verify your child is registered with The FA. You can skip this for now and add it later in settings.</p>
          </div>

          {error ? <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}

          <button disabled={saving || !dob} className="mt-6 min-h-[52px] w-full rounded-full px-5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50" style={{ background: `linear-gradient(135deg, ${primaryColour}, ${darkColour})`, color: '#ffffff' }}>
            {saving ? 'Saving...' : 'Save & Continue →'}
          </button>
          <Link href="/dashboard/parent" className="mt-4 block text-center text-sm text-white/25">Skip for now →</Link>
        </form>
      </section>
    </main>
  );
}

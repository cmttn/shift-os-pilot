'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ClubJoinCodeSettingsProps {
  clubId: string;
  clubName: string;
  joinCode: string | null;
}

function makeCode(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
}

export default function ClubJoinCodeSettings({ clubId, clubName, joinCode }: ClubJoinCodeSettingsProps) {
  const [code, setCode] = useState(joinCode ?? '------');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const shareText = `Join ${clubName} on SHIFT OS.\nEnter this code in your coach dashboard: ${code}`;

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function regenerateCode() {
    const nextCode = makeCode();
    setSaving(true);
    setError('');
    const { error: updateError } = await createClient()
      .from('clubs')
      .update({ coach_join_code: nextCode })
      .eq('id', clubId);
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setCode(nextCode);
  }

  return (
    <section className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <h2 className="text-xl font-bold">Coach Join Code</h2>
      <p className="mt-2 text-xs text-white/40">Coaches enter this code to request joining your club.</p>
      <div className="mt-5 rounded-xl bg-white/[0.06] px-6 py-4 text-center">
        <p className="font-mono text-2xl font-black tracking-[0.3em] text-white">{code}</p>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={copyCode} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black">
          {copied ? 'Copied' : 'Copy Code'}
        </button>
        <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-5 py-3 text-center text-sm font-semibold text-white/60">
          Share via WhatsApp
        </a>
      </div>
      <button type="button" onClick={regenerateCode} disabled={saving} className="mt-4 text-sm text-white/35 transition hover:text-white disabled:opacity-50">
        {saving ? 'Regenerating...' : 'Regenerate Code'}
      </button>
      {error ? <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}
    </section>
  );
}

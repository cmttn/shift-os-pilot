'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { contrastText } from '@/lib/utils/contrastText';

interface ClubFixtureSettingsProps {
  clubId: string;
  allowCoachFixtureImports: boolean;
  primaryColour: string;
}

export default function ClubFixtureSettings({ clubId, allowCoachFixtureImports, primaryColour }: ClubFixtureSettingsProps) {
  const [enabled, setEnabled] = useState(allowCoachFixtureImports);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const textColour = contrastText(primaryColour);

  async function saveFixtureControls() {
    setSaving(true);
    setMessage('');
    setError('');

    const { error: updateError } = await createClient()
      .from('clubs')
      .update({ allow_coach_fixture_imports: enabled })
      .eq('id', clubId);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage('Fixture controls saved');
    window.setTimeout(() => setMessage(''), 3000);
  }

  return (
    <section className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <h2 className="text-xl font-bold">Fixture Controls</h2>
      <p className="mt-2 text-sm text-white/40">Decide whether coaches can upload league fixtures for club-managed teams.</p>
      <button type="button" onClick={() => setEnabled((value) => !value)} className="mt-5 flex w-full items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left">
        <span>
          <span className="block text-sm font-semibold text-white">Allow coaches to import fixtures</span>
          <span className="mt-1 block text-xs text-white/40">
            When on, coaches can use the full fixture import wizard. When off, they can still add friendlies manually.
          </span>
        </span>
        <span className={`relative h-7 w-12 shrink-0 rounded-full transition-all duration-300 ease-out ${enabled ? 'bg-emerald-500' : 'bg-white/[0.12]'}`}>
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all duration-300 ease-out ${enabled ? 'left-6' : 'left-1'}`} />
        </span>
      </button>
      <button
        type="button"
        onClick={saveFixtureControls}
        disabled={saving}
        className="mt-5 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-300 ease-out disabled:opacity-50"
        style={{ backgroundColor: primaryColour, color: textColour }}
      >
        {saving ? 'Saving...' : 'Save Fixture Controls'}
      </button>
      {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}
    </section>
  );
}

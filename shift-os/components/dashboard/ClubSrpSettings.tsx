'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { contrastText } from '@/lib/utils/contrastText';

interface ClubSrpSettingsProps {
  clubId: string;
  initiallyEnabled: boolean;
  primaryColour: string;
}

export default function ClubSrpSettings({ clubId, initiallyEnabled, primaryColour }: ClubSrpSettingsProps) {
  const [enabled, setEnabled] = useState(initiallyEnabled);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const textColour = contrastText(primaryColour);

  async function save() {
    setSaving(true);
    setMessage('');
    setError('');
    const { error: saveError } = await createClient().from('feature_toggles').upsert({
      club_id: clubId,
      feature_key: 'squad_rotation_planner',
      is_enabled: enabled,
      updated_at: new Date().toISOString()
    }, { onConflict: 'club_id,feature_key' });
    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setMessage(enabled ? 'SRP enabled for coaches.' : 'SRP disabled for coaches.');
  }

  return (
    <section className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <h2 className="text-xl font-bold">Squad Rotation Planner</h2>
      <p className="mt-2 text-sm text-white/40">More minutes. Less subs. Less pressure. More smiles.</p>
      <button type="button" onClick={() => setEnabled((current) => !current)} className="mt-5 flex w-full items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left">
        <span>
          <span className="block text-sm font-semibold text-white">Enable SRP for club coaches</span>
          <span className="mt-1 block text-xs text-white/40">Coaches can create planned fair rotation weeks for active squads.</span>
        </span>
        <span className={`relative h-7 w-12 rounded-full transition-all duration-300 ease-out ${enabled ? 'bg-emerald-500' : 'bg-white/[0.12]'}`}>
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all duration-300 ease-out ${enabled ? 'left-6' : 'left-1'}`} />
        </span>
      </button>
      <button type="button" onClick={save} disabled={saving} className="mt-5 rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: primaryColour, color: textColour }}>
        {saving ? 'Saving...' : 'Save SRP Setting'}
      </button>
      {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}
    </section>
  );
}

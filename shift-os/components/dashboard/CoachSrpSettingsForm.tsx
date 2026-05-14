'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { contrastText } from '@/lib/utils/contrastText';

interface CoachSrpSettingsFormProps {
  userId: string;
  teamId: string;
  clubEnabled: boolean;
  primaryColour: string;
}

interface SrpCoachSettingsRow {
  is_enabled: boolean | null;
}

export default function CoachSrpSettingsForm({ userId, teamId, clubEnabled, primaryColour }: CoachSrpSettingsFormProps) {
  const [enabled, setEnabled] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const textColour = contrastText(primaryColour);

  useEffect(() => {
    async function load() {
      const { data } = await createClient()
        .from('srp_coach_settings')
        .select('is_enabled')
        .eq('user_id', userId)
        .eq('team_id', teamId)
        .maybeSingle<SrpCoachSettingsRow>();
      setEnabled(data?.is_enabled ?? true);
    }
    if (clubEnabled) void load();
  }, [clubEnabled, teamId, userId]);

  async function save() {
    setSaving(true);
    setMessage('');
    setError('');
    const { error: saveError } = await createClient().from('srp_coach_settings').upsert({
      user_id: userId,
      team_id: teamId,
      is_enabled: enabled,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,team_id' });
    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setMessage('SRP coach setting saved.');
  }

  return (
    <section className="mt-6 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <h2 className="text-xl font-bold">Squad Rotation Planner</h2>
      <p className="mt-2 text-sm text-white/40">Plan fair rotation weeks so matchdays have fewer subs and clearer expectations.</p>
      {!clubEnabled ? (
        <p className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-sm text-white/40">Your club has not enabled SRP yet.</p>
      ) : (
        <>
          <button type="button" onClick={() => setEnabled((current) => !current)} className="mt-5 flex w-full items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left">
            <span>
              <span className="block text-sm font-semibold text-white">Enable SRP for this team</span>
              <span className="mt-1 block text-xs text-white/40">Keep this on when you want SRP available in coach tools.</span>
            </span>
            <span className={`relative h-7 w-12 rounded-full transition-all duration-300 ease-out ${enabled ? 'bg-emerald-500' : 'bg-white/[0.12]'}`}>
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all duration-300 ease-out ${enabled ? 'left-6' : 'left-1'}`} />
            </span>
          </button>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={save} disabled={saving} className="rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: primaryColour, color: textColour }}>{saving ? 'Saving...' : 'Save SRP Setting'}</button>
            <Link href="/dashboard/coach/tools/srp" className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white">Open SRP</Link>
          </div>
        </>
      )}
      {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}
    </section>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface CoachPotmSettingsFormProps {
  userId: string;
  clubId: string | null;
  primaryColour: string;
}

interface ClubSettings {
  message_mode: string | null;
  club_message: string | null;
}

interface CoachSettings {
  coach_message: string | null;
}

export default function CoachPotmSettingsForm({ userId, clubId, primaryColour }: CoachPotmSettingsFormProps) {
  const [clubSettings, setClubSettings] = useState<ClubSettings | null>(null);
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: club }, { data: coach }] = await Promise.all([
        clubId ? supabase.from('potm_settings').select('message_mode,club_message').eq('club_id', clubId).maybeSingle<ClubSettings>() : Promise.resolve({ data: null }),
        supabase.from('potm_coach_settings').select('coach_message').eq('user_id', userId).maybeSingle<CoachSettings>()
      ]);
      setClubSettings(club ?? null);
      setMessage(coach?.coach_message ?? '');
    }
    void load();
  }, [clubId, userId]);

  async function save() {
    setError('');
    setSaved(false);
    const { error: upsertError } = await createClient().from('potm_coach_settings').upsert({
      user_id: userId,
      coach_message: message.trim() || null,
      first_access_complete: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
    if (upsertError) {
      setError(upsertError.message);
      return;
    }
    setSaved(true);
  }

  if (clubSettings?.message_mode === 'club') {
    return (
      <section className="mt-6 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <h2 className="text-xl font-bold">Player of the Match</h2>
        <blockquote className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-sm italic text-white/70">“{clubSettings.club_message ?? 'Your club has not added a message yet.'}”</blockquote>
        <p className="mt-3 text-sm text-white/35">Managed by your club admin.</p>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <h2 className="text-xl font-bold">Player of the Match</h2>
      <label className="mt-4 block">
        <span className="text-sm text-white/50">Your POTM Message</span>
        <textarea value={message} onChange={(event) => setMessage(event.target.value.slice(0, 200))} maxLength={200} className="mt-2 min-h-[120px] w-full rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 text-sm text-white outline-none" />
        <span className="mt-1 block text-right text-xs text-white/35">{message.length}/200</span>
      </label>
      {error ? <p className="mt-3 text-sm text-red-200">{error}</p> : null}
      <button type="button" onClick={save} className="mt-4 rounded-full px-5 py-3 text-sm font-semibold text-black" style={{ backgroundColor: primaryColour }}>{saved ? 'Message saved ✓' : 'Save'}</button>
    </section>
  );
}

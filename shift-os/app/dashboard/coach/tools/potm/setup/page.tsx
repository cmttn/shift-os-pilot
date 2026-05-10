'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface ClubSettings {
  message_mode: string;
  club_message: string | null;
  coach_vote_enabled: boolean | null;
}

interface TeamCoachRow {
  team_id: string;
}

interface TeamRow {
  club_id: string | null;
  clubs?: { primary_colour: string | null } | Array<{ primary_colour: string | null }> | null;
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default function PotmSetupPage() {
  const router = useRouter();
  const [primaryColour, setPrimaryColour] = useState('#00C851');
  const [clubId, setClubId] = useState<string | null>(null);
  const [clubSettings, setClubSettings] = useState<ClubSettings | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        router.push('/auth/login');
        return;
      }
      const { data: assignment } = await supabase.from('team_coaches').select('team_id').eq('user_id', user.id).limit(1).maybeSingle<TeamCoachRow>();
      if (!assignment) return;
      const { data: team } = await supabase.from('teams').select('club_id,clubs(primary_colour)').eq('id', assignment.team_id).maybeSingle<TeamRow>();
      const club = firstRelation(team?.clubs);
      setClubId(team?.club_id ?? null);
      setPrimaryColour(club?.primary_colour ?? '#00C851');
      if (team?.club_id) {
        const { data: settings } = await supabase.from('potm_settings').select('message_mode,club_message,coach_vote_enabled').eq('club_id', team.club_id).maybeSingle<ClubSettings>();
        setClubSettings(settings ?? null);
      }
      const { data: coachSettings } = await supabase.from('potm_coach_settings').select('coach_message').eq('user_id', user.id).maybeSingle<{ coach_message: string | null }>();
      setMessage(coachSettings?.coach_message ?? '');
    }
    void loadSettings();
  }, [router]);

  async function completeSetup() {
    setSaving(true);
    setError('');
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      router.push('/auth/login');
      return;
    }
    const payload = {
      user_id: user.id,
      coach_message: clubSettings?.message_mode === 'club' ? null : message.trim(),
      first_access_complete: true,
      updated_at: new Date().toISOString()
    };
    const { error: upsertError } = await supabase.from('potm_coach_settings').upsert(payload, { onConflict: 'user_id' });
    if (upsertError) {
      setError(upsertError.message);
      setSaving(false);
      return;
    }
    router.push('/dashboard/coach/tools/potm');
  }

  const lockedClubMessage = clubSettings?.message_mode === 'club' && Boolean(clubSettings.club_message?.trim());

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10 text-white" style={{ backgroundColor: '#080a0f' }}>
      <section className="w-full max-w-[560px] rounded-2xl border p-8" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <p className="text-xs uppercase tracking-[0.28em] text-white/30">Player of the Match</p>
        <h1 className="mt-3 text-3xl font-black">Set Up Player of the Match</h1>
        <p className="mt-2 text-sm text-white/40">This message appears on every POTM announcement and social card.</p>

        {lockedClubMessage ? (
          <div className="mt-6 rounded-xl border p-4" style={{ backgroundColor: `${primaryColour}14`, borderColor: `${primaryColour}33` }}>
            <p className="text-sm italic text-white/80">“{clubSettings?.club_message}”</p>
            <p className="mt-3 text-xs text-white/35">This message is set by your club and cannot be changed.</p>
          </div>
        ) : (
          <label className="mt-6 block">
            <span className="text-sm font-medium text-white/55">Your POTM Message</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, 200))}
              maxLength={200}
              placeholder="e.g. Outstanding performance today - you were brilliant from start to finish!"
              className="mt-2 min-h-[132px] w-full rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 text-sm text-white outline-none"
            />
            <span className="mt-2 flex justify-between text-xs text-white/35"><span>You can change this anytime in Settings.</span><span>{message.length}/200</span></span>
          </label>
        )}
        {clubId === null ? <p className="mt-4 text-xs text-white/30">Independent coaches can use their own message.</p> : null}
        {error ? <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p> : null}
        <button type="button" disabled={saving} onClick={completeSetup} className="mt-6 w-full rounded-full px-6 py-4 font-semibold text-black transition-all duration-300 ease-out disabled:opacity-50" style={{ backgroundColor: primaryColour }}>
          {saving ? 'Saving...' : lockedClubMessage ? 'Continue →' : 'Save & Continue →'}
        </button>
      </section>
    </main>
  );
}

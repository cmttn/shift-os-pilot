'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface ClubMemberRow {
  club_id: string;
}

interface ClubRow {
  name: string;
  primary_colour: string | null;
}

interface PotmSettingsRow {
  message_mode: string | null;
  club_message: string | null;
  coach_vote_enabled: boolean | null;
  p2p_vote_age_group: string | null;
}

interface CoachMessageRow {
  coach_message: string | null;
}

const ageGroups = ['U6', 'U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15', 'U16', 'U17', 'U18', 'Open Age', 'Veterans'];

export default function ClubPotmSettingsPage() {
  const router = useRouter();
  const [clubId, setClubId] = useState('');
  const [clubName, setClubName] = useState('Club');
  const [primaryColour, setPrimaryColour] = useState('#00C851');
  const [messageMode, setMessageMode] = useState<'club' | 'coach'>('coach');
  const [clubMessage, setClubMessage] = useState('');
  const [coachVoteEnabled, setCoachVoteEnabled] = useState(true);
  const [p2pAgeGroup, setP2pAgeGroup] = useState('U11');
  const [coachMessages, setCoachMessages] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        router.push('/auth/login');
        return;
      }
      const { data: membership } = await supabase.from('club_members').select('club_id').eq('user_id', user.id).eq('club_role', 'admin').eq('is_active', true).limit(1).maybeSingle<ClubMemberRow>();
      if (!membership) {
        router.push('/dashboard/club');
        return;
      }
      const [{ data: club }, { data: settings }, { data: messages }] = await Promise.all([
        supabase.from('clubs').select('name,primary_colour').eq('id', membership.club_id).maybeSingle<ClubRow>(),
        supabase.from('potm_settings').select('message_mode,club_message,coach_vote_enabled,p2p_vote_age_group').eq('club_id', membership.club_id).maybeSingle<PotmSettingsRow>(),
        supabase.from('potm_coach_settings').select('coach_message').not('coach_message', 'is', null).limit(20)
      ]);
      setClubId(membership.club_id);
      setClubName(club?.name ?? 'Club');
      setPrimaryColour(club?.primary_colour ?? '#00C851');
      setMessageMode(settings?.message_mode === 'club' ? 'club' : 'coach');
      setClubMessage(settings?.club_message ?? '');
      setCoachVoteEnabled(settings?.coach_vote_enabled ?? true);
      setP2pAgeGroup(settings?.p2p_vote_age_group ?? 'U11');
      setCoachMessages(((messages ?? []) as CoachMessageRow[]).map((row) => row.coach_message).filter((message): message is string => Boolean(message)));
    }
    void load();
  }, [router]);

  async function saveSettings() {
    setSaved(false);
    setError('');
    const { error: upsertError } = await createClient().from('potm_settings').upsert({
      club_id: clubId,
      message_mode: messageMode,
      club_message: clubMessage.trim() || null,
      coach_vote_enabled: coachVoteEnabled,
      p2p_vote_age_group: p2pAgeGroup,
      updated_at: new Date().toISOString()
    }, { onConflict: 'club_id' });
    if (upsertError) {
      setError(upsertError.message);
      return;
    }
    setSaved(true);
  }

  return (
    <main className="min-h-screen px-5 pb-20 pt-10 text-white md:ml-[260px]" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[760px]">
        <Link href="/dashboard/club/settings" className="text-sm text-white/40 transition-all duration-300 ease-out hover:text-white">Back to settings</Link>
        <header className="mt-6">
          <p className="text-xs uppercase tracking-[0.28em] text-white/30">{clubName}</p>
          <h1 className="mt-2 text-3xl font-black">Player of the Match Settings</h1>
        </header>

        <section className="mt-6 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-xl font-bold">Message Mode</h2>
          <div className="mt-4 grid gap-3">
            <button type="button" onClick={() => setMessageMode('club')} className="rounded-xl border p-4 text-left" style={{ borderColor: messageMode === 'club' ? primaryColour : 'rgba(255,255,255,0.08)', backgroundColor: messageMode === 'club' ? `${primaryColour}14` : 'rgba(255,255,255,0.03)' }}>
              <strong className="block">Club sets the message</strong>
              <span className="text-sm text-white/40">Locked for coaches. All coaches will use this message.</span>
            </button>
            {messageMode === 'club' ? (
              <label>
                <textarea value={clubMessage} onChange={(event) => setClubMessage(event.target.value.slice(0, 300))} maxLength={300} className="mt-2 min-h-[120px] w-full rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 text-sm text-white outline-none" />
                <span className="mt-1 block text-right text-xs text-white/35">{clubMessage.length}/300</span>
              </label>
            ) : null}
            <button type="button" onClick={() => setMessageMode('coach')} className="rounded-xl border p-4 text-left" style={{ borderColor: messageMode === 'coach' ? primaryColour : 'rgba(255,255,255,0.08)', backgroundColor: messageMode === 'coach' ? `${primaryColour}14` : 'rgba(255,255,255,0.03)' }}>
              <strong className="block">Coaches set their own messages</strong>
              <span className="text-sm text-white/40">Each coach writes their own message in their settings.</span>
            </button>
            {messageMode === 'coach' && coachMessages.length > 0 ? <div className="rounded-xl bg-white/[0.03] p-4 text-sm text-white/45">{coachMessages.map((message) => <p key={message} className="mb-2 last:mb-0">“{message}”</p>)}</div> : null}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <label className="flex items-center justify-between gap-4">
            <span><strong className="block">Coaches can vote</strong><span className="text-sm text-white/40">Coach votes count as 2 votes.</span></span>
            <input type="checkbox" checked={coachVoteEnabled} onChange={(event) => setCoachVoteEnabled(event.target.checked)} className="h-5 w-5" />
          </label>
          <label className="mt-5 block">
            <span className="text-sm text-white/50">Players vote for each other from age group</span>
            <select value={p2pAgeGroup} onChange={(event) => setP2pAgeGroup(event.target.value)} className="mt-2 w-full rounded-xl border border-white/[0.08] bg-[#0d1117] p-3 text-white">
              {ageGroups.map((ageGroup) => <option key={ageGroup} value={ageGroup}>{ageGroup}</option>)}
            </select>
            <span className="mt-2 block text-xs text-white/35">Below this age group, only parents vote. Above it, players also get a vote.</span>
          </label>
        </section>

        {error ? <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p> : null}
        <button type="button" onClick={saveSettings} className="mt-5 w-full rounded-full px-6 py-4 font-semibold text-black" style={{ backgroundColor: primaryColour }}>{saved ? 'Settings saved ✓' : 'Save Settings'}</button>
      </div>
    </main>
  );
}

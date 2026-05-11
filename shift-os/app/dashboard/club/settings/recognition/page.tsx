'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface ClubMembershipRow {
  club_id: string;
  clubs?: { name: string | null; primary_colour: string | null } | Array<{ name: string | null; primary_colour: string | null }> | null;
}

interface RecognitionSettingsRow {
  bronze_threshold: number | null;
  silver_threshold: number | null;
  gold_threshold: number | null;
  bronze_reward: string | null;
  silver_reward: string | null;
  gold_reward: string | null;
}

interface RecognitionTotalRow {
  coach_user_id: string;
  positive_ticket_count: number | null;
  current_tier: string | null;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
}

function getFirstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default function RecognitionSettingsPage() {
  const router = useRouter();
  const [clubId, setClubId] = useState('');
  const [clubName, setClubName] = useState('Club');
  const [primaryColour, setPrimaryColour] = useState('#00C851');
  const [bronzeThreshold, setBronzeThreshold] = useState(5);
  const [silverThreshold, setSilverThreshold] = useState(15);
  const [goldThreshold, setGoldThreshold] = useState(30);
  const [bronzeReward, setBronzeReward] = useState('Recognised Coach badge');
  const [silverReward, setSilverReward] = useState('Highly Regarded Coach badge');
  const [goldReward, setGoldReward] = useState('Outstanding Coach badge');
  const [leaderboard, setLeaderboard] = useState<Array<{ name: string; count: number; tier: string }>>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push('/auth/login');
        return;
      }
      const { data: membership } = await supabase
        .from('club_members')
        .select('club_id,clubs(name,primary_colour)')
        .eq('user_id', userData.user.id)
        .eq('club_role', 'admin')
        .eq('is_active', true)
        .maybeSingle<ClubMembershipRow>();
      if (!membership) {
        router.push('/dashboard/club');
        return;
      }
      const club = getFirstRelation(membership.clubs);
      setClubId(membership.club_id);
      setClubName(club?.name ?? 'Club');
      setPrimaryColour(club?.primary_colour ?? '#00C851');
      const [{ data: settings }, { data: totals }] = await Promise.all([
        supabase.from('coach_recognition_settings').select('bronze_threshold,silver_threshold,gold_threshold,bronze_reward,silver_reward,gold_reward').eq('club_id', membership.club_id).maybeSingle<RecognitionSettingsRow>(),
        supabase.from('coach_recognition_totals').select('coach_user_id,positive_ticket_count,current_tier').eq('club_id', membership.club_id).order('positive_ticket_count', { ascending: false })
      ]);
      if (settings) {
        setBronzeThreshold(settings.bronze_threshold ?? 5);
        setSilverThreshold(settings.silver_threshold ?? 15);
        setGoldThreshold(settings.gold_threshold ?? 30);
        setBronzeReward(settings.bronze_reward ?? 'Recognised Coach badge');
        setSilverReward(settings.silver_reward ?? 'Highly Regarded Coach badge');
        setGoldReward(settings.gold_reward ?? 'Outstanding Coach badge');
      }
      const totalRows = (totals ?? []) as RecognitionTotalRow[];
      const coachIds = Array.from(new Set(totalRows.map((row) => row.coach_user_id)));
      const { data: profiles } = coachIds.length > 0
        ? await supabase.from('users_profile').select('id,full_name').in('id', coachIds)
        : { data: [] as ProfileRow[] };
      setLeaderboard(totalRows.map((row) => ({
        name: ((profiles ?? []) as ProfileRow[]).find((profile) => profile.id === row.coach_user_id)?.full_name ?? 'Coach',
        count: row.positive_ticket_count ?? 0,
        tier: row.current_tier ?? 'none'
      })));
    }
    void loadSettings();
  }, [router]);

  async function saveSettings() {
    if (!clubId) return;
    const supabase = createClient();
    await supabase.from('coach_recognition_settings').upsert({
      club_id: clubId,
      bronze_threshold: bronzeThreshold,
      silver_threshold: silverThreshold,
      gold_threshold: goldThreshold,
      bronze_reward: bronzeReward,
      silver_reward: silverReward,
      gold_reward: goldReward,
      updated_at: new Date().toISOString()
    }, { onConflict: 'club_id' });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const tiers: Array<{
    label: string;
    threshold: number;
    setThreshold: (value: number) => void;
    reward: string;
    setReward: (value: string) => void;
  }> = [
    { label: 'Bronze', threshold: bronzeThreshold, setThreshold: setBronzeThreshold, reward: bronzeReward, setReward: setBronzeReward },
    { label: 'Silver', threshold: silverThreshold, setThreshold: setSilverThreshold, reward: silverReward, setReward: setSilverReward },
    { label: 'Gold', threshold: goldThreshold, setThreshold: setGoldThreshold, reward: goldReward, setReward: setGoldReward }
  ];

  return (
    <main className="min-h-screen px-5 pb-16 pt-10 text-white md:ml-[260px] md:px-8" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[820px]">
        <Link href="/dashboard/club/settings" className="text-sm text-white/40">Back to settings</Link>
        <p className="mt-6 text-xs uppercase tracking-[0.3em] text-white/30">{clubName}</p>
        <h1 className="mt-3 text-4xl font-black">Coach Recognition Programme</h1>
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {tiers.map(({ label, threshold, setThreshold, reward, setReward }) => (
            <article key={label} className="rounded-2xl border p-5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <h2 className="text-xl font-bold">{label}</h2>
              <label className="mt-4 block text-xs uppercase tracking-[0.2em] text-white/35">Threshold</label>
              <input value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} type="number" min={1} className="mt-2 w-full rounded-xl border bg-white/[0.04] p-3 text-white" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
              <label className="mt-4 block text-xs uppercase tracking-[0.2em] text-white/35">Reward</label>
              <input value={reward} onChange={(event) => setReward(event.target.value)} className="mt-2 w-full rounded-xl border bg-white/[0.04] p-3 text-white" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
            </article>
          ))}
        </section>
        <button type="button" onClick={() => void saveSettings()} className="mt-6 rounded-full px-5 py-3 text-sm font-black text-black" style={{ backgroundColor: primaryColour }}>{saved ? 'Saved' : 'Save Settings'}</button>

        <section className="mt-10 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-2xl font-bold">Coach Leaderboard</h2>
          <div className="mt-5 space-y-3">
            {leaderboard.length === 0 ? <p className="text-sm text-white/40">No positive coach tickets yet.</p> : leaderboard.map((coach, index) => (
              <div key={`${coach.name}-${index}`} className="flex items-center justify-between rounded-xl bg-white/[0.03] p-4">
                <p className="font-semibold text-white">{index + 1}. {coach.name}</p>
                <p className="text-sm text-white/45">{coach.count} positive tickets - {coach.tier}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

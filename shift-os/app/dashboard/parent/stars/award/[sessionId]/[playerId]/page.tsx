'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { awardStars } from '@/lib/tools/starAwarder';
import { getCategoryMeta, type ParentStarCategory, type StarCategory } from '@/lib/tools/starCategories';

interface SessionRow {
  id: string;
  team_id: string;
  opponent: string | null;
  title: string | null;
  session_date: string;
}

interface PlayerRow {
  id: string;
  team_id: string | null;
  first_name: string | null;
  last_name: string | null;
  parent_user_id: string | null;
}

interface TeamRow {
  name: string;
  club_id: string | null;
}

interface ClubRow {
  primary_colour: string | null;
}

interface FocusRow {
  category: ParentStarCategory;
}

interface AwardRow {
  stars_awarded: number;
  category: StarCategory;
}

function fullName(player: PlayerRow | null): string {
  return [player?.first_name, player?.last_name].map((part) => part?.trim()).filter(Boolean).join(' ') || 'Player';
}

function firstName(player: PlayerRow | null): string {
  return player?.first_name?.trim() || fullName(player).split(' ')[0] || 'Player';
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function AwardGoalsPage() {
  const params = useParams<{ sessionId: string; playerId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SessionRow | null>(null);
  const [player, setPlayer] = useState<PlayerRow | null>(null);
  const [team, setTeam] = useState<TeamRow | null>(null);
  const [primaryColour, setPrimaryColour] = useState('#00C851');
  const [focus, setFocus] = useState<FocusRow | null>(null);
  const [alreadyAwarded, setAlreadyAwarded] = useState<AwardRow | null>(null);
  const [goals, setGoals] = useState<1 | 2 | 3 | null>(null);
  const [confirmation, setConfirmation] = useState<{ added: number; total: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const title = useMemo(() => {
    if (!session) return '';
    const opponent = session.opponent ? ` vs ${session.opponent}` : session.title ? ` - ${session.title}` : '';
    return `${team?.name ?? 'Team'}${opponent} | ${formatDate(session.session_date)}`;
  }, [session, team?.name]);

  useEffect(() => {
    if (!confirmation || !player || !session) return;
    const timeout = window.setTimeout(() => {
      router.push(`/dashboard/parent/player/${player.id}/team/${session.team_id}`);
    }, 2000);
    return () => window.clearTimeout(timeout);
  }, [confirmation, player, router, session]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const [{ data: sessionData }, { data: playerData }, { data: focusData }, { data: awardData }] = await Promise.all([
        supabase.from('sessions').select('id,team_id,opponent,title,session_date').eq('id', params.sessionId).maybeSingle<SessionRow>(),
        supabase.from('players').select('id,team_id,first_name,last_name,parent_user_id').eq('id', params.playerId).eq('parent_user_id', user.id).maybeSingle<PlayerRow>(),
        supabase.from('player_star_goals').select('category').eq('session_id', params.sessionId).eq('player_id', params.playerId).maybeSingle<FocusRow>(),
        supabase.from('player_stars').select('stars_awarded,category').eq('session_id', params.sessionId).eq('player_id', params.playerId).maybeSingle<AwardRow>()
      ]);

      if (!sessionData || !playerData || sessionData.team_id !== playerData.team_id) {
        setError('Goals could not be loaded for this player.');
        return;
      }

      const { data: teamData } = await supabase.from('teams').select('name,club_id').eq('id', sessionData.team_id).maybeSingle<TeamRow>();
      const { data: clubData } = teamData?.club_id ? await supabase.from('clubs').select('primary_colour').eq('id', teamData.club_id).maybeSingle<ClubRow>() : { data: null };
      setSession(sessionData);
      setPlayer(playerData);
      setTeam(teamData ?? null);
      setPrimaryColour(clubData?.primary_colour ?? '#00C851');
      setFocus(focusData ?? null);
      setAlreadyAwarded(awardData ?? null);
    }

    void load();
  }, [params.playerId, params.sessionId, router]);

  async function giveGoals() {
    if (!player || !session || !goals || !player.parent_user_id) return;
    setSaving(true);
    setError('');
    const supabase = createClient();
    const result = await awardStars({
      player_id: player.id,
      parent_user_id: player.parent_user_id,
      session_id: session.id,
      stars: goals,
      category: focus?.category ?? 'effort',
      parent_message: null,
      supabase
    });

    if (!result.success) {
      setError('Goals could not be awarded yet. Please check the goals SQL has been run.');
      setSaving(false);
      return;
    }

    setConfirmation({ added: goals, total: result.new_total });
    setSaving(false);
  }

  if (confirmation && player) {
    return (
      <main className="min-h-screen px-5 py-10 text-center text-white" style={{ backgroundColor: '#080a0f' }}>
        <div className="mx-auto flex min-h-[70vh] max-w-[480px] flex-col items-center justify-center">
          <p className="text-5xl font-black">⚽ {confirmation.added}</p>
          <h1 className="mt-6 text-2xl font-black">{confirmation.added} goals added to {firstName(player)}&apos;s season total</h1>
          <p className="mt-3 text-sm text-white/45">{firstName(player)} now has {confirmation.total} goals this season</p>
        </div>
      </main>
    );
  }

  if (error) return <main className="min-h-screen px-5 py-10 text-white" style={{ backgroundColor: '#080a0f' }}>{error}</main>;

  const focusMeta = focus ? getCategoryMeta(focus.category) : null;
  const options: Array<{ value: 1 | 2 | 3; title: string; label: string; accent: string }> = [
    { value: 1, title: 'Good effort', label: '1 goal', accent: 'rgba(255,255,255,0.2)' },
    { value: 2, title: 'Great session', label: '2 goals', accent: primaryColour },
    { value: 3, title: 'Outstanding', label: '3 goals', accent: '#10b981' }
  ];

  return (
    <main className="min-h-screen px-5 pb-10 pt-8 text-white" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[480px]">
        <header>
          <h1 className="text-xl font-bold">{firstName(player)}&apos;s goals</h1>
          <p className="mt-2 text-sm text-white/40">{title}</p>
          {focusMeta ? (
            <p className="mt-3 border-l-2 pl-3 text-sm text-white/45" style={{ borderColor: focusMeta.colour }}>
              Today&apos;s focus was: <span className="text-white">{focusMeta.label}</span>
            </p>
          ) : null}
        </header>

        {alreadyAwarded ? (
          <section className="mt-8 rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
            <h2 className="text-lg font-bold text-white">Goals already awarded</h2>
            <p className="mt-2 text-sm text-white/45">{alreadyAwarded.stars_awarded} goals - {getCategoryMeta(alreadyAwarded.category).label}</p>
          </section>
        ) : (
          <>
            <section className="mt-8">
              <h2 className="text-base font-semibold text-white">How did {firstName(player)} do?</h2>
              <div className="mt-4 space-y-3">
                {options.map((option) => {
                  const selected = goals === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setGoals(option.value)}
                      className="flex min-h-16 w-full items-center justify-between rounded-xl border bg-white/[0.03] p-4 text-left transition-all duration-300 ease-out hover:bg-white/[0.05]"
                      style={{
                        borderColor: selected ? option.accent : 'rgba(255,255,255,0.06)',
                        borderLeft: `3px solid ${option.accent}`,
                        backgroundColor: selected ? `${option.accent}14` : 'rgba(255,255,255,0.03)'
                      }}
                    >
                      <span className="font-medium text-white">{option.title}</span>
                      <span className="text-sm text-white/45">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
            <button
              type="button"
              disabled={!goals || saving}
              onClick={() => void giveGoals()}
              className="mt-6 min-h-[52px] w-full rounded-full px-6 py-3 font-bold text-white transition-all duration-300 ease-out disabled:opacity-40"
              style={{ background: `linear-gradient(135deg, ${primaryColour}, #059669)` }}
            >
              {saving ? 'Saving...' : 'Award Goals'}
            </button>
          </>
        )}

        <Link href={player && session ? `/dashboard/parent/player/${player.id}/team/${session.team_id}` : '/dashboard/parent'} className="mt-8 block text-center text-sm text-white/35">Back</Link>
      </div>
    </main>
  );
}

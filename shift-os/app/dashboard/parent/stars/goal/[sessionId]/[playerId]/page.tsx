'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { STAR_CATEGORIES, type ParentStarCategory } from '@/lib/tools/starCategories';

interface SessionRow {
  id: string;
  team_id: string;
  type: string;
  opponent: string | null;
  title: string | null;
  session_date: string;
}

interface PlayerRow {
  id: string;
  team_id: string | null;
  first_name: string | null;
  last_name: string | null;
}

interface TeamRow {
  name: string;
  club_id: string | null;
}

interface ClubRow {
  primary_colour: string | null;
}

interface GoalRow {
  category: ParentStarCategory;
}

const goalCategories = STAR_CATEGORIES.filter((category) => category.id !== 'potm') as Array<typeof STAR_CATEGORIES[number] & { id: ParentStarCategory }>;

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

export default function SetGoalPage() {
  const params = useParams<{ sessionId: string; playerId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SessionRow | null>(null);
  const [player, setPlayer] = useState<PlayerRow | null>(null);
  const [team, setTeam] = useState<TeamRow | null>(null);
  const [primaryColour, setPrimaryColour] = useState('#00C851');
  const [selectedCategory, setSelectedCategory] = useState<ParentStarCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const title = useMemo(() => {
    if (!session) return '';
    const opponent = session.opponent ? ` vs ${session.opponent}` : session.title ? ` - ${session.title}` : '';
    return `${team?.name ?? 'Team'}${opponent} | ${formatDate(session.session_date)}`;
  }, [session, team?.name]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const [{ data: sessionData }, { data: playerData }, { data: goalData }] = await Promise.all([
        supabase.from('sessions').select('id,team_id,type,opponent,title,session_date').eq('id', params.sessionId).maybeSingle<SessionRow>(),
        supabase.from('players').select('id,team_id,first_name,last_name').eq('id', params.playerId).eq('parent_user_id', user.id).maybeSingle<PlayerRow>(),
        supabase.from('player_star_goals').select('category').eq('session_id', params.sessionId).eq('player_id', params.playerId).maybeSingle<GoalRow>()
      ]);

      if (!sessionData || !playerData || sessionData.team_id !== playerData.team_id) {
        setError('Goal not found for this player.');
        return;
      }

      const { data: teamData } = await supabase.from('teams').select('name,club_id').eq('id', sessionData.team_id).maybeSingle<TeamRow>();
      const { data: clubData } = teamData?.club_id ? await supabase.from('clubs').select('primary_colour').eq('id', teamData.club_id).maybeSingle<ClubRow>() : { data: null };
      setSession(sessionData);
      setPlayer(playerData);
      setTeam(teamData ?? null);
      setPrimaryColour(clubData?.primary_colour ?? '#00C851');
      setSelectedCategory(goalData?.category ?? null);
    }

    void load();
  }, [params.playerId, params.sessionId, router]);

  async function saveGoal() {
    if (!player || !session || !selectedCategory) return;
    setSaving(true);
    setError('');
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const { error: upsertError } = await supabase.from('player_star_goals').upsert({
      player_id: player.id,
      parent_user_id: user.id,
      session_id: session.id,
      category: selectedCategory,
      custom_text: null,
      parent_message: null
    }, { onConflict: 'player_id,session_id' });

    if (upsertError) {
      setError(upsertError.message);
      setSaving(false);
      return;
    }

    router.push(`/dashboard/parent/player/${player.id}/team/${session.team_id}`);
  }

  if (error) {
    return <main className="min-h-screen px-5 py-10 text-white" style={{ backgroundColor: '#080a0f' }}>{error}</main>;
  }

  return (
    <main className="min-h-screen px-5 pb-10 pt-8 text-white" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[480px]">
        <header>
          <h1 className="text-xl font-bold text-white">{firstName(player)}&apos;s goal</h1>
          <p className="mt-2 text-sm text-white/40">{title}</p>
        </header>

        <section className="mt-8">
          <div className="space-y-2">
            {goalCategories.map((category) => {
              const selected = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex w-full items-center justify-between rounded-xl border bg-white/[0.03] p-4 text-left transition-all duration-300 ease-out hover:bg-white/[0.05]"
                  style={{
                    borderColor: selected ? `${category.colour}66` : 'rgba(255,255,255,0.06)',
                    borderLeft: `3px solid ${category.colour}`,
                    backgroundColor: selected ? `${category.colour}14` : 'rgba(255,255,255,0.03)'
                  }}
                >
                  <span className="text-base font-medium text-white">{category.label}</span>
                  {selected ? <span className="h-5 w-5 rounded-full" style={{ backgroundColor: category.colour }} /> : null}
                </button>
              );
            })}
          </div>
        </section>

        <button
          type="button"
          disabled={!selectedCategory || saving}
          onClick={() => void saveGoal()}
          className="mt-6 min-h-[52px] w-full rounded-full px-6 py-3 font-bold text-white transition-all duration-300 ease-out disabled:opacity-40"
          style={{ background: `linear-gradient(135deg, ${primaryColour}, #059669)` }}
        >
          {saving ? 'Saving...' : 'Set Goal'}
        </button>
        <Link href={player && session ? `/dashboard/parent/player/${player.id}/team/${session.team_id}` : '/dashboard/parent'} className="mt-8 block text-center text-sm text-white/35">Back</Link>
      </div>
    </main>
  );
}

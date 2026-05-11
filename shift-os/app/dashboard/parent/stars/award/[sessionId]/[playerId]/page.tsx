'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { awardStars } from '@/lib/tools/starAwarder';
import { getCategoryMeta, STAR_CATEGORIES, type ParentStarCategory, type StarCategory } from '@/lib/tools/starCategories';

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
}

interface GoalRow {
  category: ParentStarCategory;
  custom_text: string | null;
  parent_message: string | null;
}

interface StarRow {
  stars_awarded: number;
  category: StarCategory;
  parent_message: string | null;
}

const parentCategories = STAR_CATEGORIES.filter((category) => category.id !== 'potm') as Array<typeof STAR_CATEGORIES[number] & { id: ParentStarCategory }>;

function fullName(player: PlayerRow | null): string {
  return [player?.first_name, player?.last_name].map((part) => part?.trim()).filter(Boolean).join(' ') || 'Player';
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function AwardStarsPage() {
  const params = useParams<{ sessionId: string; playerId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SessionRow | null>(null);
  const [player, setPlayer] = useState<PlayerRow | null>(null);
  const [team, setTeam] = useState<TeamRow | null>(null);
  const [goal, setGoal] = useState<GoalRow | null>(null);
  const [alreadyAwarded, setAlreadyAwarded] = useState<StarRow | null>(null);
  const [stars, setStars] = useState<1 | 2 | 3 | null>(null);
  const [category, setCategory] = useState<ParentStarCategory>('enjoyment');
  const [message, setMessage] = useState('');
  const [celebration, setCelebration] = useState<{ total: number; milestone: string | null } | null>(null);
  const [error, setError] = useState('');

  const selectedMeta = useMemo(() => getCategoryMeta(category), [category]);
  const title = session?.opponent ? `${team?.name ?? 'Team'} vs ${session.opponent}` : session?.title ?? 'Match';

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        router.push('/auth/login');
        return;
      }
      const [{ data: sessionData }, { data: playerData }, { data: goalData }, { data: starData }] = await Promise.all([
        supabase.from('sessions').select('id,team_id,opponent,title,session_date').eq('id', params.sessionId).maybeSingle<SessionRow>(),
        supabase.from('players').select('id,team_id,first_name,last_name,parent_user_id').eq('id', params.playerId).eq('parent_user_id', user.id).maybeSingle<PlayerRow>(),
        supabase.from('player_star_goals').select('category,custom_text,parent_message').eq('session_id', params.sessionId).eq('player_id', params.playerId).maybeSingle<GoalRow>(),
        supabase.from('player_stars').select('stars_awarded,category,parent_message').eq('session_id', params.sessionId).eq('player_id', params.playerId).maybeSingle<StarRow>()
      ]);
      if (!sessionData || !playerData || sessionData.team_id !== playerData.team_id) {
        setError('Stars could not be loaded for this player.');
        return;
      }
      const { data: teamData } = await supabase.from('teams').select('name').eq('id', sessionData.team_id).maybeSingle<TeamRow>();
      setSession(sessionData);
      setPlayer(playerData);
      setTeam(teamData ?? null);
      setGoal(goalData ?? null);
      setAlreadyAwarded(starData ?? null);
      if (goalData) setCategory(goalData.category);
    }
    void load();
  }, [params.playerId, params.sessionId, router]);

  async function giveStars() {
    if (!player || !session || !stars) return;
    setError('');
    const supabase = createClient();
    const result = await awardStars({
      player_id: player.id,
      parent_user_id: player.parent_user_id ?? '',
      session_id: session.id,
      stars,
      category,
      parent_message: message.trim() || null,
      supabase
    });
    if (!result.success) {
      setError('Stars could not be awarded yet. Please check the stars SQL has been run.');
      return;
    }
    setCelebration({ total: result.new_total, milestone: result.milestone_reached });
  }

  if (celebration && player && session) {
    return (
      <main className="relative min-h-screen overflow-hidden px-5 py-10 text-center text-[#fff7ed]" style={{ backgroundColor: '#0f0d09' }}>
        <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.25),transparent_20%),radial-gradient(circle_at_80%_30%,rgba(249,115,22,0.18),transparent_20%)]" />
        <div className="relative mx-auto flex min-h-[80vh] max-w-[480px] flex-col items-center justify-center">
          <p className="animate-bounce text-7xl font-black text-amber-300">{stars} ⭐</p>
          <h1 className="mt-6 text-3xl font-black">{fullName(player)} now has {celebration.total} stars this season!</h1>
          <p className="mt-4 text-5xl">{selectedMeta.emoji}</p>
          {message ? <p className="mt-5 rounded-3xl bg-amber-400/10 p-5 text-sm italic text-amber-100/75">“{message}”</p> : null}
          {celebration.milestone ? <div className="mt-6 rounded-3xl border border-amber-400/30 bg-amber-400/10 p-5"><p className="text-6xl">🎆</p><p className="mt-2 text-2xl font-black text-amber-300">{celebration.milestone}</p></div> : null}
          <p className="mt-6 text-sm text-amber-100/50">{fullName(player)} has been notified! 🎉</p>
          <button type="button" onClick={() => router.push(`/dashboard/parent/player/${player.id}/team/${session.team_id}`)} className="mt-8 rounded-full px-6 py-4 font-black text-white" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>Back to dashboard</button>
        </div>
      </main>
    );
  }

  if (error) return <main className="min-h-screen px-5 py-10 text-white" style={{ backgroundColor: '#0f0d09' }}>{error}</main>;

  return (
    <main className="min-h-screen px-5 pb-10 pt-8 text-[#fff7ed]" style={{ backgroundColor: '#0f0d09' }}>
      <div className="mx-auto max-w-[480px]">
        <header>
          <h1 className="text-3xl font-black">⭐ {fullName(player)}&apos;s Stars</h1>
          <p className="mt-2 text-sm text-amber-100/55">{title} | {session ? formatDate(session.session_date) : ''}</p>
        </header>

        {goal ? (
          <section className="mt-5 rounded-3xl border p-4" style={{ backgroundColor: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }}>
            <p className="text-sm text-amber-100/55">Goal reminder</p>
            <p className="mt-2 text-lg font-black">{getCategoryMeta(goal.category).emoji} {getCategoryMeta(goal.category).label}</p>
          </section>
        ) : null}

        {alreadyAwarded ? (
          <section className="mt-8 rounded-3xl border p-6 text-center" style={{ backgroundColor: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }}>
            <p className="text-6xl">{'⭐'.repeat(alreadyAwarded.stars_awarded)}</p>
            <h2 className="mt-4 text-2xl font-black">Stars already awarded</h2>
            <p className="mt-2 text-sm text-amber-100/60">{getCategoryMeta(alreadyAwarded.category).label}</p>
            {alreadyAwarded.parent_message ? <p className="mt-4 text-sm italic text-amber-100/70">“{alreadyAwarded.parent_message}”</p> : null}
          </section>
        ) : (
          <>
            <section className="mt-8 space-y-3">
              <h2 className="text-xl font-black">How did {fullName(player)} do today?</h2>
              {[
                { value: 1, title: '⭐ Good effort today', sub: '1 star' },
                { value: 2, title: '⭐⭐ Great work!', sub: '2 stars' },
                { value: 3, title: '⭐⭐⭐ Amazing performance!', sub: '3 stars' }
              ].map((option) => (
                <button key={option.value} type="button" onClick={() => setStars(option.value as 1 | 2 | 3)} className="min-h-[72px] w-full rounded-3xl border-2 p-4 text-left transition-all duration-300 ease-out" style={{ borderColor: '#f59e0b', background: stars === option.value ? 'linear-gradient(135deg, #f59e0b, #f97316)' : option.value === 2 ? 'rgba(245,158,11,0.12)' : 'transparent' }}>
                  <span className="block text-lg font-black">{option.title}</span>
                  <span className="text-sm text-amber-100/70">{option.sub}</span>
                </button>
              ))}
            </section>

            <section className="mt-6 grid grid-cols-2 gap-3">
              {parentCategories.map((item) => <button key={item.id} type="button" onClick={() => setCategory(item.id)} className="rounded-3xl border p-3 text-center text-sm font-semibold" style={{ borderColor: item.id === category ? item.colour : 'rgba(245,158,11,0.2)', backgroundColor: item.id === category ? `${item.colour}2b` : 'rgba(245,158,11,0.04)' }}><span className="block text-3xl">{item.emoji}</span>{item.label}</button>)}
            </section>
            <textarea value={message} onChange={(event) => setMessage(event.target.value.slice(0, 150))} placeholder="Add a little message..." className="mt-5 min-h-[112px] w-full rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-white outline-none placeholder:text-amber-100/35" />
            <button type="button" disabled={!stars} onClick={giveStars} className="mt-5 min-h-14 w-full rounded-full px-6 py-4 font-black text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>Give Stars! →</button>
          </>
        )}
        <Link href={player && session ? `/dashboard/parent/player/${player.id}/team/${session.team_id}` : '/dashboard/parent'} className="mt-8 block text-center text-sm text-amber-100/45">Back</Link>
      </div>
    </main>
  );
}

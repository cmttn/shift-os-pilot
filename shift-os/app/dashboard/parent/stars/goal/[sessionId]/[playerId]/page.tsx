'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { STAR_CATEGORIES, type ParentStarCategory } from '@/lib/tools/starCategories';

interface SessionRow {
  id: string;
  team_id: string;
  opponent: string | null;
  title: string | null;
  session_date: string;
}

interface PlayerRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  parent_user_id: string | null;
}

interface TeamRow {
  id: string;
  name: string;
  club_id: string | null;
}

interface ClubRow {
  badge_url: string | null;
}

interface GoalRow {
  category: ParentStarCategory;
  custom_text: string | null;
  parent_message: string | null;
}

const goalCategories = STAR_CATEGORIES.filter((category) => category.id !== 'potm') as Array<typeof STAR_CATEGORIES[number] & { id: ParentStarCategory }>;

function fullName(player: PlayerRow | null): string {
  return [player?.first_name, player?.last_name].map((part) => part?.trim()).filter(Boolean).join(' ') || 'Player';
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function StarGoalPage() {
  const params = useParams<{ sessionId: string; playerId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SessionRow | null>(null);
  const [player, setPlayer] = useState<PlayerRow | null>(null);
  const [team, setTeam] = useState<TeamRow | null>(null);
  const [club, setClub] = useState<ClubRow | null>(null);
  const [existingGoal, setExistingGoal] = useState<GoalRow | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ParentStarCategory>('enjoyment');
  const [customText, setCustomText] = useState('');
  const [parentMessage, setParentMessage] = useState('');
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

  const selectedMeta = useMemo(() => goalCategories.find((category) => category.id === selectedCategory) ?? goalCategories[0], [selectedCategory]);
  const title = session?.opponent ? `${team?.name ?? 'Team'} vs ${session.opponent}` : session?.title ?? 'Match day';

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
        supabase.from('sessions').select('id,team_id,opponent,title,session_date').eq('id', params.sessionId).maybeSingle<SessionRow>(),
        supabase.from('players').select('id,first_name,last_name,parent_user_id').eq('id', params.playerId).eq('parent_user_id', user.id).maybeSingle<PlayerRow>(),
        supabase.from('player_star_goals').select('category,custom_text,parent_message').eq('session_id', params.sessionId).eq('player_id', params.playerId).maybeSingle<GoalRow>()
      ]);
      if (!sessionData || !playerData) {
        setError('Goal not found for this player.');
        return;
      }
      const { data: teamData } = await supabase.from('teams').select('id,name,club_id').eq('id', sessionData.team_id).maybeSingle<TeamRow>();
      const { data: clubData } = teamData?.club_id ? await supabase.from('clubs').select('badge_url').eq('id', teamData.club_id).maybeSingle<ClubRow>() : { data: null };
      setSession(sessionData);
      setPlayer(playerData);
      setTeam(teamData ?? null);
      setClub(clubData ?? null);
      setExistingGoal(goalData ?? null);
      if (goalData) {
        setSelectedCategory(goalData.category);
        setCustomText(goalData.custom_text ?? '');
        setParentMessage(goalData.parent_message ?? '');
      }
    }
    void load();
  }, [params.playerId, params.sessionId, router]);

  async function saveGoal() {
    if (!player || !session) return;
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
      custom_text: selectedCategory === 'special' ? customText.trim() || null : null,
      parent_message: parentMessage.trim() || null
    }, { onConflict: 'player_id,session_id' });
    if (upsertError) {
      setError(upsertError.message);
      return;
    }
    router.push(`/dashboard/parent/player/${player.id}/team/${session.team_id}`);
  }

  if (error) {
    return <main className="min-h-screen px-5 py-10 text-white" style={{ backgroundColor: '#0f0d09' }}>{error}</main>;
  }

  return (
    <main className="min-h-screen px-5 pb-10 pt-8 text-[#fff7ed]" style={{ backgroundColor: '#0f0d09' }}>
      <div className="mx-auto max-w-[480px]">
        <header className="flex items-center gap-3">
          {club?.badge_url ? <img src={club.badge_url} alt="" className="h-12 w-12 rounded-full object-cover shadow-[0_0_24px_rgba(245,158,11,0.2)]" /> : <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-xl">⭐</span>}
          <div>
            <h1 className="text-2xl font-black">{fullName(player)}&apos;s Match Day Goal</h1>
            <p className="text-sm text-amber-100/60">{title} · Today at {session ? formatTime(session.session_date) : ''}</p>
          </div>
        </header>

        {existingGoal && !editing ? (
          <section className="mt-8 rounded-3xl border p-6 text-center" style={{ backgroundColor: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }}>
            <p className="text-6xl">{selectedMeta.emoji}</p>
            <h2 className="mt-4 text-2xl font-black" style={{ color: selectedMeta.colour }}>{selectedMeta.label}</h2>
            {customText ? <p className="mt-3 text-sm italic text-amber-100/70">{customText}</p> : null}
            {parentMessage ? <p className="mt-4 border-t border-amber-400/20 pt-4 text-sm italic text-amber-100/70">“{parentMessage}”</p> : null}
            <button type="button" onClick={() => setEditing(true)} className="mt-6 rounded-full border border-amber-400/25 px-5 py-3 text-sm font-semibold text-amber-200">Change Goal</button>
          </section>
        ) : (
          <>
            <section className="mt-8 grid grid-cols-2 gap-3">
              {goalCategories.map((category) => {
                const selected = selectedCategory === category.id;
                return (
                  <button key={category.id} type="button" onClick={() => setSelectedCategory(category.id)} className="rounded-3xl border-2 p-5 text-center transition-all duration-300 ease-out hover:scale-[1.03]" style={{ borderColor: category.colour, backgroundColor: selected ? `${category.colour}33` : 'rgba(255,255,255,0.03)', transform: selected ? 'scale(1.05)' : undefined }}>
                    <span className="block text-4xl">{category.emoji}</span>
                    <span className="mt-3 block text-sm font-semibold">{category.label}</span>
                  </button>
                );
              })}
            </section>
            {selectedCategory === 'special' ? (
              <input value={customText} onChange={(event) => setCustomText(event.target.value.slice(0, 80))} placeholder="What special thing should they try?" className="mt-4 w-full rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-white outline-none placeholder:text-amber-100/35" />
            ) : null}
            <label className="mt-5 block">
              <span className="text-sm font-semibold text-amber-100/70">Personal message</span>
              <textarea value={parentMessage} onChange={(event) => setParentMessage(event.target.value.slice(0, 150))} placeholder="e.g. I'm so proud of you whatever happens today!" className="mt-2 min-h-[112px] w-full rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-white outline-none placeholder:text-amber-100/35" />
              <span className="mt-1 block text-right text-xs text-amber-100/40">{parentMessage.length}/150</span>
            </label>
            <button type="button" onClick={saveGoal} className="mt-5 min-h-14 w-full rounded-full px-6 py-4 text-base font-black text-white shadow-[0_0_24px_rgba(245,158,11,0.2)]" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>Set Today&apos;s Goal →</button>
          </>
        )}
        <Link href={player && session ? `/dashboard/parent/player/${player.id}/team/${session.team_id}` : '/dashboard/parent'} className="mt-8 block text-center text-sm text-amber-100/45">Back</Link>
      </div>
    </main>
  );
}

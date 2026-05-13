'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import GoalAwardSheet, { type GoalAwardSession } from '@/components/dashboard/GoalAwardSheet';
import { createClient } from '@/lib/supabase/client';
import { getCategoryMeta, type StarCategory } from '@/lib/tools/starCategories';

interface SessionRow extends GoalAwardSession {
  team_id: string;
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

function sessionTitle(session: SessionRow | null, team: TeamRow | null): string {
  if (!session) return '';
  const opponent = session.opponent ? ` vs ${session.opponent}` : session.title ? ` - ${session.title}` : '';
  return `${team?.name ?? 'Team'}${opponent}`;
}

export default function AwardGoalsFallbackPage() {
  const params = useParams<{ sessionId: string; playerId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SessionRow | null>(null);
  const [player, setPlayer] = useState<PlayerRow | null>(null);
  const [team, setTeam] = useState<TeamRow | null>(null);
  const [primaryColour, setPrimaryColour] = useState('#00C851');
  const [alreadyAwarded, setAlreadyAwarded] = useState<AwardRow | null>(null);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');

  const backHref = useMemo(() => player && session ? `/dashboard/parent/player/${player.id}/team/${session.team_id}` : '/dashboard/parent', [player, session]);

  useEffect(() => {
    if (!completed) return;
    const timeout = window.setTimeout(() => router.push(backHref), 1200);
    return () => window.clearTimeout(timeout);
  }, [backHref, completed, router]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const [{ data: sessionData }, { data: playerData }, { data: awardData }] = await Promise.all([
        supabase.from('sessions').select('id,team_id,type,opponent,title,session_date').eq('id', params.sessionId).maybeSingle<SessionRow>(),
        supabase.from('players').select('id,team_id,first_name,last_name').eq('id', params.playerId).or(`parent_user_id.eq.${user.id},co_parent_user_id.eq.${user.id}`).maybeSingle<PlayerRow>(),
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
      setAlreadyAwarded(awardData ?? null);
    }

    void load();
  }, [params.playerId, params.sessionId, router]);

  if (error) return <main className="min-h-screen px-5 py-10 text-white" style={{ backgroundColor: '#080a0f' }}>{error}</main>;

  return (
    <main className="min-h-screen px-5 pb-10 pt-8 text-white" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[480px]">
        <Link href={backHref} className="text-sm text-white/40 transition-colors duration-300 ease-out hover:text-white">Back</Link>
        <h1 className="mt-6 text-xl font-bold">{firstName(player)}&apos;s goals</h1>
        <p className="mt-2 text-sm text-white/40">{sessionTitle(session, team)}</p>

        {completed ? <p className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">Goals awarded. Returning to dashboard.</p> : null}

        {alreadyAwarded ? (
          <section className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
            <h2 className="text-lg font-bold text-white">Goals already awarded</h2>
            <p className="mt-2 text-sm text-white/45">{alreadyAwarded.stars_awarded} goals - {getCategoryMeta(alreadyAwarded.category).label}</p>
          </section>
        ) : session && player ? (
          <div className="mt-6">
            <GoalAwardSheet
              playerId={player.id}
              playerName={firstName(player)}
              session={session}
              primaryColour={primaryColour}
              variant="page"
              onClose={() => router.push(backHref)}
              onComplete={() => setCompleted(true)}
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}

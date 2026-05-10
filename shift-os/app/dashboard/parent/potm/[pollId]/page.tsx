'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface PollRow {
  id: string;
  session_id: string;
  team_id: string;
  status: string;
  total_votes: number | null;
}

interface SessionRow {
  id: string;
  opponent: string | null;
  title: string | null;
  session_date: string;
}

interface TeamRow {
  id: string;
  name: string;
  club_id: string | null;
}

interface ClubRow {
  id: string;
  name: string;
  badge_url: string | null;
  primary_colour: string | null;
}

interface PlayerRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  parent_user_id: string | null;
}

interface VoteRow {
  voted_for_player_id: string;
}

interface CoachRow {
  user_id: string;
}

function fullName(player: PlayerRow | null | undefined): string {
  return [player?.first_name, player?.last_name].map((part) => part?.trim()).filter(Boolean).join(' ') || 'Player';
}

function initials(player: PlayerRow | null | undefined): string {
  const name = fullName(player);
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'P';
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function ParentPotmVotePage() {
  const params = useParams<{ pollId: string }>();
  const router = useRouter();
  const pollId = params.pollId;
  const [userId, setUserId] = useState('');
  const [poll, setPoll] = useState<PollRow | null>(null);
  const [session, setSession] = useState<SessionRow | null>(null);
  const [team, setTeam] = useState<TeamRow | null>(null);
  const [club, setClub] = useState<ClubRow | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [existingVote, setExistingVote] = useState<VoteRow | null>(null);
  const [isCoach, setIsCoach] = useState(false);
  const [randomMode, setRandomMode] = useState(false);
  const [error, setError] = useState('');
  const primaryColour = club?.primary_colour ?? '#00C851';
  const selectedPlayer = players.find((player) => player.id === selectedPlayerId) ?? null;
  const votedPlayer = players.find((player) => player.id === existingVote?.voted_for_player_id) ?? null;
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
      setUserId(user.id);
      const { data: pollData } = await supabase.from('potm_polls').select('id,session_id,team_id,status,total_votes').eq('id', pollId).maybeSingle<PollRow>();
      if (!pollData) {
        setError('Poll not found.');
        return;
      }
      const [{ data: sessionData }, { data: teamData }, { data: responsesData }, { data: voteData }, { data: coachData }] = await Promise.all([
        supabase.from('sessions').select('id,opponent,title,session_date').eq('id', pollData.session_id).maybeSingle<SessionRow>(),
        supabase.from('teams').select('id,name,club_id').eq('id', pollData.team_id).maybeSingle<TeamRow>(),
        supabase.from('poll_responses').select('player_id').eq('session_id', pollData.session_id).eq('status', 'available'),
        supabase.from('potm_votes').select('voted_for_player_id').eq('poll_id', pollId).eq('voter_user_id', user.id).maybeSingle<VoteRow>(),
        supabase.from('team_coaches').select('user_id').eq('team_id', pollData.team_id).eq('user_id', user.id).maybeSingle<CoachRow>()
      ]);
      const availablePlayerIds = (responsesData ?? []).map((response) => response.player_id as string);
      const { data: playerData } = availablePlayerIds.length > 0
        ? await supabase.from('players').select('id,first_name,last_name,parent_user_id').in('id', availablePlayerIds).order('first_name', { ascending: true })
        : { data: [] as PlayerRow[] };
      const { data: clubData } = teamData?.club_id
        ? await supabase.from('clubs').select('id,name,badge_url,primary_colour').eq('id', teamData.club_id).maybeSingle<ClubRow>()
        : { data: null };
      setPoll(pollData);
      setSession(sessionData ?? null);
      setTeam(teamData ?? null);
      setClub(clubData ?? null);
      setPlayers((playerData ?? []) as PlayerRow[]);
      setExistingVote(voteData ?? null);
      setIsCoach(Boolean(coachData));
    }
    void load();
  }, [pollId, router]);

  const ownPlayerIds = useMemo(() => new Set(players.filter((player) => player.parent_user_id === userId).map((player) => player.id)), [players, userId]);

  async function confirmVote() {
    if (!poll || !selectedPlayer) return;
    const supabase = createClient();
    const voterType = randomMode ? 'random' : isCoach ? 'coach' : 'parent';
    const voteWeight = isCoach ? 2 : 1;
    const { error: voteError } = await supabase.from('potm_votes').insert({
      poll_id: poll.id,
      voter_user_id: userId,
      voted_for_player_id: selectedPlayer.id,
      voter_type: voterType,
      vote_weight: voteWeight,
      is_random: randomMode
    });
    if (voteError) {
      setError(voteError.message);
      return;
    }
    await supabase.from('potm_polls').update({ total_votes: (poll.total_votes ?? 0) + voteWeight }).eq('id', poll.id);
    setExistingVote({ voted_for_player_id: selectedPlayer.id });
    setPoll({ ...poll, total_votes: (poll.total_votes ?? 0) + voteWeight });
  }

  function pickRandom() {
    if (players.length === 0) return;
    const player = players[Math.floor(Math.random() * players.length)];
    setSelectedPlayerId(player.id);
    setRandomMode(true);
  }

  if (error) {
    return <main className="min-h-screen px-5 py-10 text-white" style={{ backgroundColor: '#080a0f' }}>{error}</main>;
  }

  return (
    <main className="min-h-screen px-5 pb-12 pt-8 text-white" style={{ background: `radial-gradient(ellipse at top, ${primaryColour}12 0%, transparent 50%), #080a0f` }}>
      <div className="mx-auto max-w-[480px]">
        <header className="text-center">
          {club?.badge_url ? <img src={club.badge_url} alt="" className="mx-auto h-[60px] w-[60px] rounded-full object-cover" /> : <span className="mx-auto flex h-[60px] w-[60px] items-center justify-center rounded-full text-xl font-black text-black" style={{ backgroundColor: primaryColour }}>S</span>}
          <h1 className="mt-4 text-3xl font-black">🏆 Player of the Match</h1>
          <p className="mt-2 text-sm text-white/45">{title} | {session ? formatDate(session.session_date) : ''}</p>
          <p className="mt-4 text-lg font-semibold">Who stood out today?</p>
        </header>

        {poll?.status !== 'open' ? (
          <section className="mt-8 rounded-2xl border p-6 text-center" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="text-xl font-bold">{poll?.status === 'closed' ? 'Poll is closed' : 'Poll not started yet'}</h2>
            <p className="mt-2 text-sm text-white/40">Check back when your coach opens voting.</p>
          </section>
        ) : existingVote ? (
          <section className="mt-8 rounded-2xl border p-6 text-center" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: `${primaryColour}66` }}>
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-2xl font-black text-black" style={{ backgroundColor: primaryColour }}>{initials(votedPlayer)}</span>
            <h2 className="mt-4 text-2xl font-black">You voted for {fullName(votedPlayer)}!</h2>
            <p className="mt-2 text-sm text-white/40">Results announced when the poll closes.</p>
            <p className="mt-3 text-sm text-white/35">{poll.total_votes ?? 0} votes cast so far</p>
          </section>
        ) : (
          <>
            <section className="mt-8 space-y-2">
              {players.map((player) => {
                const ownChild = ownPlayerIds.has(player.id) && !isCoach;
                const selected = selectedPlayerId === player.id;
                return (
                  <button key={player.id} type="button" disabled={ownChild} onClick={() => { setSelectedPlayerId(player.id); setRandomMode(false); }} className="flex min-h-14 w-full items-center gap-3 rounded-xl border p-4 text-left transition-all duration-300 ease-out disabled:cursor-not-allowed disabled:opacity-45" style={{ backgroundColor: selected ? `${primaryColour}18` : 'rgba(255,255,255,0.03)', borderColor: selected ? primaryColour : 'rgba(255,255,255,0.06)' }}>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-black" style={{ backgroundColor: primaryColour }}>{initials(player)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-white">{fullName(player)}</span>
                      {ownChild ? <span className="text-xs text-white/35">Your child</span> : null}
                    </span>
                    <span className="text-white/25">→</span>
                  </button>
                );
              })}
            </section>
            <button type="button" onClick={pickRandom} className="mt-4 w-full rounded-full border border-white/10 px-4 py-3 text-sm font-semibold text-white">🎲 Random — Let the app choose</button>
            <p className="mt-2 text-center text-xs text-white/35">Includes your child in the random selection.</p>
            {selectedPlayer ? (
              <section className="mt-5 rounded-2xl border p-5 text-center" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: `${primaryColour}55` }}>
                <p className="text-sm text-white/45">{randomMode ? `Your random vote goes to ${fullName(selectedPlayer)}!` : `Vote for ${fullName(selectedPlayer)}?`}</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button type="button" onClick={confirmVote} className="rounded-full px-4 py-3 text-sm font-semibold text-black" style={{ backgroundColor: primaryColour }}>Confirm Vote</button>
                  <button type="button" onClick={() => { setSelectedPlayerId(''); setRandomMode(false); }} className="rounded-full border border-white/10 px-4 py-3 text-sm font-semibold text-white">Cancel</button>
                </div>
              </section>
            ) : null}
          </>
        )}
        <Link href="/" className="mt-10 block text-center text-xs text-white/20">Manage your child&apos;s football on Shift OS →</Link>
      </div>
    </main>
  );
}

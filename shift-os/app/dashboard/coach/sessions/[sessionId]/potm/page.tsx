'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface SessionRow {
  id: string;
  team_id: string;
  type: string;
  opponent: string | null;
  title: string | null;
  session_date: string;
}

interface TeamRow {
  id: string;
  name: string;
  club_id: string | null;
  clubs?: { primary_colour: string | null } | Array<{ primary_colour: string | null }> | null;
}

interface PotmPollRow {
  id: string;
  session_id: string;
  team_id: string;
  status: string;
  poll_opens_at: string;
  poll_closes_at: string;
  winner_player_id: string | null;
  total_votes: number | null;
  coach_message_used: string | null;
  social_card_url: string | null;
}

interface PotmSettings {
  coach_vote_enabled: boolean | null;
  message_mode: string | null;
  club_message: string | null;
}

interface CoachSettings {
  coach_message: string | null;
  first_access_complete: boolean | null;
}

interface PlayerRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return `${date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} at ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

function playerName(player: PlayerRow | null): string {
  return [player?.first_name, player?.last_name].map((part) => part?.trim()).filter(Boolean).join(' ') || 'Player';
}

export default function SessionPotmPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const sessionId = params.sessionId;
  const [session, setSession] = useState<SessionRow | null>(null);
  const [team, setTeam] = useState<TeamRow | null>(null);
  const [primaryColour, setPrimaryColour] = useState('#00C851');
  const [poll, setPoll] = useState<PotmPollRow | null>(null);
  const [settings, setSettings] = useState<PotmSettings | null>(null);
  const [winner, setWinner] = useState<PlayerRow | null>(null);
  const [matchLength, setMatchLength] = useState(60);
  const [koTime, setKoTime] = useState('');
  const [message, setMessage] = useState('Outstanding performance today - you were brilliant from start to finish!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [generatingCard, setGeneratingCard] = useState(false);
  const [copied, setCopied] = useState(false);

  const title = session?.opponent ? `${team?.name ?? 'Team'} vs ${session.opponent}` : session?.title ?? 'Match';
  const closesIn = useMemo(() => {
    if (!poll?.poll_closes_at) return '';
    const diff = new Date(poll.poll_closes_at).valueOf() - Date.now();
    if (diff <= 0) return 'closing now';
    const mins = Math.floor(diff / 60000);
    return `${Math.floor(mins / 60)} hours ${mins % 60} mins`;
  }, [poll?.poll_closes_at]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      router.push('/auth/login');
      return;
    }
    const { data: coach } = await supabase.from('potm_coach_settings').select('coach_message,first_access_complete').eq('user_id', user.id).maybeSingle<CoachSettings>();
    if (!coach?.first_access_complete) {
      router.push('/dashboard/coach/tools/potm/setup');
      return;
    }
    const { data: sessionData } = await supabase.from('sessions').select('id,team_id,type,opponent,title,session_date').eq('id', sessionId).maybeSingle<SessionRow>();
    if (!sessionData) {
      setError('Session not found.');
      setLoading(false);
      return;
    }
    const [{ data: teamData }, { data: pollData }] = await Promise.all([
      supabase.from('teams').select('id,name,club_id,clubs(primary_colour)').eq('id', sessionData.team_id).maybeSingle<TeamRow>(),
      supabase.from('potm_polls').select('id,session_id,team_id,status,poll_opens_at,poll_closes_at,winner_player_id,total_votes,coach_message_used,social_card_url').eq('session_id', sessionId).maybeSingle<PotmPollRow>()
    ]);
    const club = firstRelation(teamData?.clubs);
    const { data: clubSettings } = teamData?.club_id
      ? await supabase.from('potm_settings').select('coach_vote_enabled,message_mode,club_message').eq('club_id', teamData.club_id).maybeSingle<PotmSettings>()
      : { data: null };
    const winnerResult = pollData?.winner_player_id
      ? await supabase.from('players').select('id,first_name,last_name').eq('id', pollData.winner_player_id).maybeSingle<PlayerRow>()
      : { data: null };
    setSession(sessionData);
    setTeam(teamData ?? null);
    setPrimaryColour(club?.primary_colour ?? '#00C851');
    setPoll(pollData ?? null);
    setSettings(clubSettings ?? null);
    setWinner(winnerResult.data ?? null);
    const ko = new Date(sessionData.session_date);
    setKoTime(Number.isNaN(ko.valueOf()) ? '' : ko.toISOString().slice(11, 16));
    setMessage(clubSettings?.message_mode === 'club' && clubSettings.club_message ? clubSettings.club_message : coach.coach_message ?? 'Outstanding performance today - you were brilliant from start to finish!');
    setLoading(false);
  }, [router, sessionId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function enablePoll() {
    if (!session || !team) return;
    setError('');
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id ?? null;
    const ko = new Date(session.session_date);
    const [hours, mins] = koTime.split(':').map(Number);
    if (!Number.isNaN(hours) && !Number.isNaN(mins)) {
      ko.setHours(hours, mins, 0, 0);
    }
    const opensAt = ko.toISOString();
    const closesAt = new Date(ko.valueOf() + 60 * 60 * 1000).toISOString();
    const { error: insertError } = await supabase.from('potm_polls').insert({
      session_id: session.id,
      team_id: team.id,
      created_by: userId,
      status: 'open',
      poll_opens_at: opensAt,
      poll_closes_at: closesAt,
      coach_message_used: message
    });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: session.id, team_id: team.id, title: 'Vote for Player of the Match!', message: `${team.name} vs ${session.opponent ?? 'Opponent'} - tap to vote!`, audience: 'team' })
    });
    await loadData();
  }

  async function cancelPoll() {
    if (!poll) return;
    await createClient().from('potm_polls').update({ status: 'cancelled' }).eq('id', poll.id);
    await loadData();
  }

  async function closePoll() {
    if (!poll) return;
    setClosing(true);
    setError('');
    const response = await fetch('/api/potm-close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pollId: poll.id })
    });
    if (!response.ok) {
      const data = await response.json() as { error?: string };
      setError(data.error ?? 'Unable to close poll.');
      setClosing(false);
      return;
    }
    await loadData();
    setClosing(false);
  }

  async function generateCard() {
    if (!poll) return;
    setGeneratingCard(true);
    setError('');
    const response = await fetch('/api/potm-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pollId: poll.id })
    });
    if (!response.ok) {
      const data = await response.json() as { error?: string };
      setError(data.error ?? 'Unable to generate card.');
      setGeneratingCard(false);
      return;
    }
    await loadData();
    setGeneratingCard(false);
  }

  async function copyShareLink() {
    if (!poll?.social_card_url) return;
    await navigator.clipboard.writeText(poll.social_card_url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <main className="min-h-screen px-5 py-10 text-white" style={{ backgroundColor: '#080a0f' }}>Loading POTM...</main>;
  }

  return (
    <main className="min-h-screen px-5 pb-24 pt-8 text-white md:ml-[260px]" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[760px]">
        <Link href={`/dashboard/coach/sessions/${sessionId}`} className="text-sm text-white/40 transition-all duration-300 ease-out hover:text-white">Back to session</Link>
        <header className="mt-6">
          <p className="text-xs uppercase tracking-[0.28em] text-white/30">Player of the Match</p>
          <h1 className="mt-2 text-3xl font-black">{title}</h1>
          <p className="mt-2 text-sm text-white/40">Poll opens at KO for now. Final-whistle timing arrives with Vercel Pro cron.</p>
        </header>

        {!poll || poll.status === 'cancelled' ? (
          <section className="mt-6 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="text-xl font-bold">POTM poll not enabled for this match</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label><span className="text-sm text-white/50">KO Time</span><input value={koTime} onChange={(event) => setKoTime(event.target.value)} type="time" className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 text-white" /></label>
              <label><span className="text-sm text-white/50">Match Length</span><input value={matchLength} onChange={(event) => setMatchLength(Number(event.target.value))} type="number" className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 text-white" /></label>
            </div>
            <p className="mt-4 text-sm text-white/40">Future: poll auto-opens {Math.max(0, matchLength - 10)} mins after KO. Coming with Pro.</p>
            <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-white/30">Current message</p>
              <p className="mt-2 text-sm italic text-white/70">&ldquo;{message}&rdquo;</p>
              {settings?.message_mode === 'club' ? <p className="mt-2 text-xs text-white/35">Set by your club.</p> : <Link href="/dashboard/coach/settings" className="mt-2 inline-block text-xs text-white/40">Edit in Settings</Link>}
            </div>
            <button type="button" onClick={enablePoll} className="mt-6 w-full rounded-full px-6 py-4 font-semibold text-black" style={{ backgroundColor: primaryColour }}>Enable POTM Poll</button>
          </section>
        ) : null}

        {poll?.status === 'scheduled' ? (
          <section className="mt-6 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-6">
            <h2 className="text-xl font-bold text-emerald-300">POTM Poll Scheduled</h2>
            <p className="mt-2 text-sm text-white/50">Opens: {formatDateTime(poll.poll_opens_at)}</p>
            <p className="text-sm text-white/50">Closes: {formatDateTime(poll.poll_closes_at)}</p>
            <p className="mt-3 text-xs text-white/35">Auto-timing near final whistle is coming with Shift OS Pro.</p>
            <button type="button" onClick={cancelPoll} className="mt-4 rounded-full border border-white/10 px-4 py-2 text-sm text-white">Cancel Poll</button>
          </section>
        ) : null}

        {poll?.status === 'open' ? (
          <section className="mt-6 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-6">
            <h2 className="text-xl font-bold text-amber-300">Voting is Open</h2>
            <p className="mt-2 text-sm text-white/50">Closes in {closesIn}</p>
            <p className="mt-2 text-sm text-white/50">{poll.total_votes ?? 0} votes cast</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[1, 2, 3].map((rank) => <span key={rank} className="rounded-xl bg-black/20 p-3 text-center text-sm text-white/50">Top {rank}<br />Initials hidden</span>)}
            </div>
            <button type="button" disabled={closing} onClick={closePoll} className="mt-5 w-full rounded-full px-6 py-4 font-semibold text-black disabled:opacity-50" style={{ backgroundColor: primaryColour }}>{closing ? 'Closing and creating card...' : 'Close Poll & Announce Winner'}</button>
          </section>
        ) : null}

        {poll?.status === 'closed' ? (
          <section className="mt-6 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(245,158,11,0.4)', boxShadow: '0 20px 60px rgba(245,158,11,0.08)' }}>
            <div className="text-center">
              <p className="text-5xl">🏆</p>
              <h2 className="mt-3 text-3xl font-black text-amber-300">{playerName(winner)}</h2>
              <p className="mt-2 text-sm text-white/50">Player of the Match - {title}</p>
              <p className="mt-1 text-xs text-white/35">{poll.total_votes ?? 0} votes counted</p>
            </div>
            {poll.coach_message_used ? (
              <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/30">Winning message</p>
                <p className="mt-2 text-sm italic text-white/70">&ldquo;{poll.coach_message_used}&rdquo;</p>
              </div>
            ) : null}
            {poll.social_card_url ? (
              <>
                <img src={poll.social_card_url} alt={`${playerName(winner)} Player of the Match card`} className="mt-5 w-full rounded-2xl border border-white/10" />
                <div className="mt-5 grid gap-2 sm:grid-cols-3">
                  <a href={poll.social_card_url} download className="rounded-full px-4 py-3 text-center text-sm font-semibold text-black" style={{ backgroundColor: primaryColour }}>Download card</a>
                  <button type="button" onClick={copyShareLink} className="rounded-full border border-white/10 px-4 py-3 text-sm font-semibold text-white">{copied ? 'Copied' : 'Copy share link'}</button>
                  <a href={`https://wa.me/?text=${encodeURIComponent(`${playerName(winner)} is Player of the Match for ${title}! ${poll.social_card_url}`)}`} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-4 py-3 text-center text-sm font-semibold text-white">Share to WhatsApp</a>
                </div>
              </>
            ) : (
              <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-center">
                <p className="text-sm text-white/45">{generatingCard ? 'Generating card...' : 'The winner is saved, but the social card has not been generated yet.'}</p>
                <button type="button" disabled={generatingCard} onClick={generateCard} className="mt-4 rounded-full px-5 py-3 text-sm font-semibold text-black disabled:opacity-50" style={{ backgroundColor: primaryColour }}>{generatingCard ? 'Generating...' : 'Generate card'}</button>
              </div>
            )}
          </section>
        ) : null}
        {error ? <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p> : null}
      </div>
    </main>
  );
}

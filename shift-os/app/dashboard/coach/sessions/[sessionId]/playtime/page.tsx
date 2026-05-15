'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  calculatePlaytime,
  formatMinutes,
  getAllowedGoalkeeperCounts,
  getPitchPlaces,
  validateGoalkeeperCount,
  type CalculationMode,
  type GameFormat,
  type GamePeriods,
  type Player,
  type PlaytimeResult
} from '@/lib/tools/playtimeCalculator';

interface RawSession {
  id: string;
  team_id: string;
  type: string;
  title: string | null;
  opponent: string | null;
  session_date: string;
}

interface RawTeam {
  id: string;
  name: string;
  club_id: string | null;
  clubs?: { primary_colour: string | null } | Array<{ primary_colour: string | null }> | null;
}

interface RawPlayer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean | null;
}

interface RawPollResponse {
  player_id: string;
  status: string | null;
}

interface PlaytimePlayer extends Player {
  included: boolean;
  starts: boolean;
}

interface GameTimeRow {
  id: string;
  player_id: string;
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function fullName(player: RawPlayer): string {
  return [player.first_name, player.last_name].map((part) => part?.trim()).filter(Boolean).join(' ') || 'Player';
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'P';
}

function sessionTitle(session: RawSession | null): string {
  if (!session) return 'Playtime Calculator';
  if (session.type === 'match') return `vs ${session.opponent ?? 'Opponent TBC'}`;
  return session.title ?? session.opponent ?? session.type;
}

function resultToWhatsApp(result: PlaytimeResult, players: PlaytimePlayer[], format: GameFormat, totalMinutes: number, fixtureName: string): string {
  const starters = result.allocations.filter((allocation) => allocation.starts).map((allocation) => allocation.player_name);
  const subs = result.allocations.filter((allocation) => !allocation.starts).map((allocation) => allocation.player_name);
  const schedule = result.substitution_order.map((event) => {
    if (event.reason === 'gk_swap') return `Min ${event.minute} - GK SWAP: ${event.player_off_name} out - ${event.player_on_name} in`;
    return `Min ${event.minute} - ${event.player_off_name} OFF - ${event.player_on_name} ON`;
  });
  return [
    fixtureName,
    `Fair play time: ${result.fair_share_minutes} mins per player`,
    `${players.length} players - ${format} - ${totalMinutes} mins`,
    result.goalkeeper_rule_applied,
    '',
    'Starting lineup:',
    ...(starters.length > 0 ? starters : ['Time only - no starting lineup selected']),
    '',
    `Substitutes: ${subs.length > 0 ? subs.join(', ') : 'None'}`,
    '',
    'Substitution schedule:',
    ...(schedule.length > 0 ? schedule : ['No substitutions generated']),
    '',
    'Shift OS Playtime Calculator'
  ].join('\n');
}

export default function PlaytimeCalculatorPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const sessionId = params.sessionId;
  const [session, setSession] = useState<RawSession | null>(null);
  const [team, setTeam] = useState<RawTeam | null>(null);
  const [primaryColour, setPrimaryColour] = useState('#00C851');
  const [players, setPlayers] = useState<PlaytimePlayer[]>([]);
  const [loadNote, setLoadNote] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [totalMinutes, setTotalMinutes] = useState(40);
  const [format, setFormat] = useState<GameFormat>('5v5');
  const [periods, setPeriods] = useState<GamePeriods>(2);
  const [mode, setMode] = useState<CalculationMode>(1);
  const [allowShortSquad, setAllowShortSquad] = useState(false);
  const [result, setResult] = useState<PlaytimeResult | null>(null);
  const [officialSaved, setOfficialSaved] = useState(false);
  const [officialSaving, setOfficialSaving] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('id,team_id,type,title,opponent,session_date')
        .eq('id', sessionId)
        .maybeSingle<RawSession>();
      if (sessionError || !sessionData) {
        setError(sessionError?.message ?? 'Session not found.');
        return;
      }
      const [{ data: teamData }, { data: playerRows }, { data: responseRows }] = await Promise.all([
        supabase.from('teams').select('id,name,club_id,clubs(primary_colour)').eq('id', sessionData.team_id).maybeSingle<RawTeam>(),
        supabase.from('players').select('id,first_name,last_name,is_active').eq('team_id', sessionData.team_id).eq('is_active', true).order('first_name', { ascending: true }),
        supabase.from('poll_responses').select('player_id,status').eq('session_id', sessionData.id)
      ]);
      const teamRow = teamData ?? null;
      const club = firstRelation(teamRow?.clubs);
      const allPlayers = ((playerRows ?? []) as RawPlayer[]).map((player): PlaytimePlayer => ({
        id: player.id,
        first_name: player.first_name ?? '',
        last_name: player.last_name ?? '',
        full_name: fullName(player),
        is_goalkeeper: false,
        goalkeeper_periods: [],
        included: true,
        starts: false
      }));
      const responses = (responseRows ?? []) as RawPollResponse[];
      const availableIds = new Set(responses.filter((response) => response.status === 'available').map((response) => response.player_id));
      const hasPoll = responses.length > 0;
      setSession(sessionData);
      setTeam(teamRow);
      setPrimaryColour(club?.primary_colour ?? '#00C851');
      setPlayers(allPlayers.map((player) => ({ ...player, included: hasPoll ? availableIds.has(player.id) : true })));
      setLoadNote(hasPoll ? 'Available players imported from your poll.' : 'No poll sent - showing full squad.');
    }
    void loadData();
  }, [sessionId]);

  const selectedPlayers = useMemo(() => {
    return players.filter((player) => player.included).map((player): Player => ({
      id: player.id,
      first_name: player.first_name,
      last_name: player.last_name,
      full_name: player.full_name,
      is_goalkeeper: player.is_goalkeeper,
      goalkeeper_periods: []
    }));
  }, [players]);

  const keepers = selectedPlayers.filter((player) => player.is_goalkeeper);
  const fullTimeKeeper = format !== '3v3' && keepers.length === 1 ? keepers[0] : null;
  const goalkeeperValidation = format === '3v3' ? null : validateGoalkeeperCount(keepers.length, periods);
  const effectiveRule = format === '3v3' || keepers.length === 0 ? 'none' : keepers.length === 1 ? 'full_game' : 'option_b';
  const starters = players
    .filter((player) => player.included && (player.starts || player.id === fullTimeKeeper?.id))
    .map((player) => player.id);
  const preview = selectedPlayers.length > 0 ? calculatePlaytime({ total_minutes: totalMinutes, format, periods, players: selectedPlayers, goalkeeper_rule: effectiveRule, calculation_mode: mode, starters }) : null;
  const shortSquad = selectedPlayers.length > 0 && selectedPlayers.length < getPitchPlaces(format);
  const outfieldStarterSlots = Math.max(0, getPitchPlaces(format) - (fullTimeKeeper ? 1 : 0));
  const selectedOutfieldStarterCount = players.filter((player) => player.included && player.starts && player.id !== fullTimeKeeper?.id).length;
  const canCalculate = selectedPlayers.length > 0 && totalMinutes > 0 && !goalkeeperValidation && (!shortSquad || allowShortSquad);

  useEffect(() => {
    if (!timerRunning) return undefined;
    const interval = window.setInterval(() => setTimerSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  function toggleIncluded(playerId: string) {
    setPlayers((current) => current.map((player) => player.id === playerId ? { ...player, included: !player.included, starts: false, is_goalkeeper: false } : player));
  }

  function toggleStarter(playerId: string) {
    if (playerId === fullTimeKeeper?.id) return;
    setPlayers((current) => current.map((player) => {
      if (player.id !== playerId) return player;
      if (!player.starts && selectedOutfieldStarterCount >= outfieldStarterSlots) return player;
      return { ...player, starts: !player.starts };
    }));
  }

  function toggleGoalkeeper(playerId: string) {
    const maxGoalkeepers = Math.max(...getAllowedGoalkeeperCounts(periods));
    setPlayers((current) => {
      const selectedGoalkeepers = current.filter((player) => player.included && player.is_goalkeeper).length;
      return current.map((player) => {
        if (player.id !== playerId || !player.included || format === '3v3') return player;
        if (!player.is_goalkeeper && selectedGoalkeepers >= maxGoalkeepers) return player;
        return { ...player, is_goalkeeper: !player.is_goalkeeper, starts: player.is_goalkeeper ? player.starts : true };
      });
    });
  }

  function calculate() {
    if (!canCalculate) return;
    setResult(calculatePlaytime({ total_minutes: totalMinutes, format, periods, players: selectedPlayers, goalkeeper_rule: effectiveRule, calculation_mode: mode, starters }));
    setSaved(false);
    setOfficialSaved(false);
    setTimerSeconds(0);
    setTimerRunning(false);
  }

  async function saveResult() {
    if (!result || !team) return;
    setError('');
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id ?? null;
    const { error: calcError } = await supabase.from('playtime_calculations').insert({
      session_id: sessionId,
      team_id: team.id,
      created_by: userId,
      total_minutes: totalMinutes,
      format,
      periods,
      goalkeeper_rule: effectiveRule,
      calculation_mode: mode,
      fair_share_minutes: result.fair_share_minutes,
      result_json: result
    });
    if (calcError) {
      setError(calcError.message);
      return;
    }
    await supabase.from('tool_usage').insert({ club_id: team.club_id, team_id: team.id, user_id: userId, tool_name: 'playtime_calculator', session_id: sessionId });
    setSaved(true);
  }

  async function shareWhatsApp() {
    if (!result) return;
    const message = resultToWhatsApp(result, players.filter((player) => player.included), format, totalMinutes, sessionTitle(session));
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  async function markOfficial() {
    if (!result) return;
    setOfficialSaving(true);
    setOfficialSaved(false);
    setError('');
    const supabase = createClient();
    const playerIds = result.allocations.map((allocation) => allocation.player_id);
    const { data: existingRows, error: existingError } = await supabase
      .from('game_time')
      .select('id,player_id')
      .eq('session_id', sessionId)
      .in('player_id', playerIds);
    if (existingError) {
      setOfficialSaving(false);
      setError(existingError.message);
      return;
    }

    const existing = (existingRows ?? []) as GameTimeRow[];
    const now = new Date().toISOString();
    await Promise.all(result.allocations.map(async (allocation) => {
      const minutesPlayed = Math.round(allocation.total_minutes);
      const row = existing.find((item) => item.player_id === allocation.player_id);
      if (row) {
        await supabase.from('game_time').update({ minutes_played: minutesPlayed, updated_at: now }).eq('id', row.id);
        return;
      }
      await supabase.from('game_time').insert({
        session_id: sessionId,
        player_id: allocation.player_id,
        minutes_played: minutesPlayed,
        updated_at: now
      });
    }));
    setOfficialSaving(false);
    setOfficialSaved(true);
  }

  const nextSub = result?.substitution_order.find((event) => event.minute * 60 > timerSeconds) ?? null;

  return (
    <main className="min-h-screen px-5 pb-24 pt-8 text-white" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[680px]">
        <Link href={`/dashboard/coach/sessions/${sessionId}`} className="text-sm text-white/40 transition-all duration-300 ease-out hover:text-white">Back to session</Link>
        <header className="mt-6">
          <p className="text-xs uppercase tracking-[0.28em] text-white/30">Playtime Calculator</p>
          <h1 className="mt-2 text-3xl font-black text-white">{sessionTitle(session)}</h1>
          <p className="mt-2 text-sm text-white/40">{team?.name ?? 'Loading team'} · fair minutes, keepers and subs in one place.</p>
        </header>

        <section className="mt-6 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-xl font-bold text-white">Players in Calculation</h2>
          <p className="mt-1 text-sm text-white/40">{loadNote || 'Loading available players.'}</p>
          <div className="mt-4 space-y-2">
            {players.map((player) => (
              <article key={player.id} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-black" style={{ backgroundColor: primaryColour }}>{initials(player.full_name)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-white">{player.full_name}</span>
                  <span className="mt-1 flex flex-wrap gap-2">
                    {format !== '3v3' && player.included ? (
                      <button type="button" onClick={() => toggleGoalkeeper(player.id)} className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold" style={{ backgroundColor: player.is_goalkeeper ? `${primaryColour}24` : 'rgba(255,255,255,0.03)', color: player.is_goalkeeper ? primaryColour : 'rgba(255,255,255,0.45)' }}>
                        GK
                      </button>
                    ) : null}
                    {mode === 2 && player.included ? <button type="button" disabled={player.id === fullTimeKeeper?.id} onClick={() => toggleStarter(player.id)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/55 disabled:opacity-70">{player.id === fullTimeKeeper?.id ? 'Starting GK' : player.starts ? 'Starting' : 'Sub'}</button> : null}
                  </span>
                </span>
                <button type="button" onClick={() => toggleIncluded(player.id)} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: player.included ? `${primaryColour}24` : 'rgba(255,255,255,0.06)', color: player.included ? primaryColour : 'rgba(255,255,255,0.45)' }}>{player.included ? 'Included' : 'Excluded'}</button>
              </article>
            ))}
          </div>
          <p className="mt-4 text-sm text-white/45">{selectedPlayers.length} players selected</p>
          {fullTimeKeeper ? <p className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-sm text-white/50">{fullTimeKeeper.full_name} plays full game in goal - excluded from outfield rotation.</p> : null}
          {mode === 2 && fullTimeKeeper ? <p className="mt-3 rounded-xl border p-3 text-sm" style={{ backgroundColor: `${primaryColour}14`, borderColor: `${primaryColour}33`, color: primaryColour }}>Goalkeeper locked as starter. Choose {outfieldStarterSlots} outfield starters.</p> : null}
          {goalkeeperValidation ? <p className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">{goalkeeperValidation}</p> : null}
        </section>

        <section className="mt-4 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-xl font-bold text-white">Game Setup</h2>
          <label className="mt-4 block text-sm text-white/50">Total game time</label>
          <input value={totalMinutes} onChange={(event) => setTotalMinutes(Number(event.target.value))} type="number" min={1} className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 text-white outline-none" />
          <div className="mt-3 flex flex-wrap gap-2">
            {[30, 40, 50, 60, 70, 80, 90].map((minutes) => <button key={minutes} type="button" onClick={() => setTotalMinutes(minutes)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/60">{minutes}</button>)}
          </div>

          <p className="mt-5 text-sm text-white/50">Format</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(['3v3', '5v5', '7v7', '9v9', '11v11'] as GameFormat[]).map((item) => <button key={item} type="button" onClick={() => setFormat(item)} className="rounded-full px-4 py-2 text-sm font-semibold" style={{ backgroundColor: format === item ? primaryColour : 'rgba(255,255,255,0.06)', color: format === item ? '#000000' : 'rgba(255,255,255,0.55)' }}>{item}</button>)}
          </div>

          <p className="mt-5 text-sm text-white/50">Game split</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {([{ label: 'Halves', value: 2 }, { label: 'Thirds', value: 3 }, { label: 'Quarters', value: 4 }] as Array<{ label: string; value: GamePeriods }>).map((item) => <button key={item.value} type="button" onClick={() => setPeriods(item.value)} className="rounded-full px-4 py-2 text-sm font-semibold" style={{ backgroundColor: periods === item.value ? primaryColour : 'rgba(255,255,255,0.06)', color: periods === item.value ? '#000000' : 'rgba(255,255,255,0.55)' }}>{item.label}</button>)}
          </div>

          <div className="mt-5 rounded-xl border p-4" style={{ backgroundColor: `${primaryColour}14`, borderColor: `${primaryColour}33` }}>
            <p className="text-sm text-white/70">{selectedPlayers.length} players · {totalMinutes} min game · {format} · {periods} periods</p>
            <p className="mt-1 text-lg font-bold" style={{ color: primaryColour }}>Fair play time: {preview ? `${preview.fair_share_minutes} mins each` : 'Select players'}</p>
            {preview?.rotation_interval_minutes ? <p className="mt-1 text-sm text-white/45">Rotation interval: every {formatMinutes(preview.rotation_interval_minutes)}</p> : null}
          </div>
        </section>

        <section className="mt-4 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-xl font-bold text-white">Calculation Mode</h2>
          <div className="mt-4 grid gap-3">
            {([{ id: 1, title: 'Time Only', sub: 'Fair share only, no sub order.' }, { id: 2, title: "I'll Pick the Starters", sub: 'Set starting/sub per player above.' }, { id: 3, title: 'Generate Everything', sub: 'Auto starting lineup and sub order.' }] as Array<{ id: CalculationMode; title: string; sub: string }>).map((item) => (
              <button key={item.id} type="button" onClick={() => setMode(item.id)} className="rounded-xl border p-4 text-left transition-all duration-300 ease-out" style={{ borderColor: mode === item.id ? primaryColour : 'rgba(255,255,255,0.08)', backgroundColor: mode === item.id ? `${primaryColour}14` : 'rgba(255,255,255,0.03)' }}>
                <span className="block font-semibold text-white">{item.title}</span>
                <span className="text-sm text-white/40">{item.sub}</span>
              </button>
            ))}
          </div>
        </section>

        {shortSquad ? (
          <section className="mt-4 rounded-xl border p-4 text-sm" style={{ backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>
            Squad has fewer players than pitch places. <button type="button" onClick={() => setAllowShortSquad(true)} className="font-bold underline">Calculate anyway</button>
          </section>
        ) : null}

        <button type="button" disabled={!canCalculate} onClick={calculate} className="mt-5 w-full rounded-full px-8 py-4 font-semibold text-black transition-all duration-300 ease-out disabled:cursor-not-allowed disabled:opacity-40" style={{ background: `linear-gradient(135deg, ${primaryColour}, ${primaryColour}cc)` }}>Calculate Playtime</button>

        {result ? (
          <section className="mt-6 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-xs uppercase tracking-[0.24em] text-white/35">Fair Play Time</p>
            <p className="mt-2 text-6xl font-black" style={{ color: primaryColour }}>{result.fair_share_minutes}</p>
            <p className="mt-1 text-sm text-white/40">minutes per player ({formatMinutes(result.fair_share_minutes)})</p>
            <p className="mt-3 text-sm text-white/45">{result.goalkeeper_rule_applied}</p>
            <div className="mt-5 space-y-2">
              {result.allocations.map((allocation) => (
                <article key={allocation.player_id} className="rounded-xl bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-white">{allocation.player_name}</span>
                    <span className="font-bold" style={{ color: primaryColour }}>{allocation.total_minutes} mins</span>
                  </div>
                  {allocation.is_goalkeeper ? <p className="mt-1 text-xs text-white/35">{allocation.goal_minutes} goal + {allocation.outfield_minutes} outfield = {allocation.total_minutes} total</p> : null}
                </article>
              ))}
            </div>
            {result.substitution_order.length > 0 ? (
              <div className="mt-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/35">Substitution Order</p>
                <div className="mt-3 space-y-2">
                  {result.substitution_order.map((event, index) => <p key={`${event.minute}-${event.player_on_id}-${index}`} className="rounded-xl bg-white/[0.03] p-3 text-sm text-white/70"><strong style={{ color: primaryColour }}>Min {event.minute}</strong> - {event.reason === 'gk_swap' ? `GK SWAP: ${event.player_off_name} leaves goal · ${event.player_on_name} enters goal` : `${event.player_off_name} OFF → ${event.player_on_name} ON`}</p>)}
                </div>
              </div>
            ) : null}
            {result.substitution_order.length > 0 ? (
              <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/35">Game Day Timer</p>
                <p className="mt-2 text-3xl font-black text-white">{Math.floor(timerSeconds / 60)}:{String(timerSeconds % 60).padStart(2, '0')}</p>
                <p className="mt-2 text-sm text-white/45">
                  {nextSub ? `At ${nextSub.minute} mins: ${nextSub.reason === 'gk_swap' ? `${nextSub.player_off_name} GK -> ${nextSub.player_on_name} GK` : `${nextSub.player_off_name} OFF -> ${nextSub.player_on_name} ON`}` : 'No more substitutions scheduled.'}
                </p>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  <button type="button" onClick={() => setTimerRunning(true)} className="rounded-full bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white">Start</button>
                  <button type="button" onClick={() => setTimerRunning(false)} className="rounded-full bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white">Pause</button>
                  <button type="button" onClick={() => { if (nextSub) setTimerSeconds(Math.round(nextSub.minute * 60)); }} className="rounded-full bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white">Next Sub</button>
                  <button type="button" onClick={() => { setTimerSeconds(0); setTimerRunning(false); }} className="rounded-full bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white">Reset</button>
                </div>
              </div>
            ) : null}
            {result.warnings.map((warning) => <p key={warning} className="mt-3 rounded-xl border p-3 text-sm text-amber-300" style={{ backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.2)' }}>{warning}</p>)}
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <button type="button" onClick={saveResult} className="rounded-full px-4 py-3 font-semibold text-black" style={{ backgroundColor: primaryColour }}>{saved ? 'Saved' : 'Save'}</button>
              <button type="button" onClick={shareWhatsApp} className="rounded-full bg-[#25D366] px-4 py-3 font-semibold text-white">WhatsApp</button>
              <button type="button" onClick={markOfficial} disabled={officialSaving} className="rounded-full border border-white/10 px-4 py-3 font-semibold text-white disabled:opacity-50">{officialSaved ? 'Official minutes saved' : officialSaving ? 'Saving...' : 'Mark as official'}</button>
            </div>
            <button type="button" onClick={() => router.refresh()} className="mt-3 w-full rounded-full border border-white/10 px-4 py-3 font-semibold text-white">Recalculate</button>
          </section>
        ) : null}
        {error ? <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p> : null}
      </div>
    </main>
  );
}

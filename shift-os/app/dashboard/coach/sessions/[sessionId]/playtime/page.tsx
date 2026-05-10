'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  calculatePlaytime,
  formatMinutes,
  getPitchPlaces,
  type CalculationMode,
  type GameFormat,
  type GamePeriods,
  type GoalkeeperRule,
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

function resultToWhatsApp(result: PlaytimeResult, players: PlaytimePlayer[], format: GameFormat, totalMinutes: number): string {
  const starters = result.allocations.filter((allocation) => allocation.starts).map((allocation) => allocation.player_name);
  const subs = result.allocations.filter((allocation) => !allocation.starts).map((allocation) => allocation.player_name);
  const schedule = result.substitution_order.map((event) => {
    if (event.reason === 'gk_swap') return `Min ${event.minute} - GK SWAP: ${event.player_off_name} out - ${event.player_on_name} in`;
    return `Min ${event.minute} - ${event.player_off_name} OFF - ${event.player_on_name} ON`;
  });
  return [
    `Fair play time: ${result.fair_share_minutes} mins per player`,
    `${players.length} players - ${format} - ${totalMinutes} mins`,
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
  const [goalkeeperRule, setGoalkeeperRule] = useState<GoalkeeperRule>('option_a');
  const [mode, setMode] = useState<CalculationMode>(1);
  const [gkSlots, setGkSlots] = useState<Array<string | null>>([null, null]);
  const [allowShortSquad, setAllowShortSquad] = useState(false);
  const [result, setResult] = useState<PlaytimeResult | null>(null);

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

  useEffect(() => {
    setGkSlots((current) => Array.from({ length: periods }, (_, index) => current[index] ?? null));
  }, [periods]);

  const selectedPlayers = useMemo(() => {
    const periodMap = new Map<string, number[]>();
    gkSlots.forEach((playerId, index) => {
      if (!playerId) return;
      periodMap.set(playerId, [...(periodMap.get(playerId) ?? []), index + 1]);
    });
    return players.filter((player) => player.included).map((player): Player => ({
      id: player.id,
      first_name: player.first_name,
      last_name: player.last_name,
      full_name: player.full_name,
      is_goalkeeper: periodMap.has(player.id),
      goalkeeper_periods: periodMap.get(player.id) ?? []
    }));
  }, [gkSlots, players]);

  const keepers = selectedPlayers.filter((player) => player.is_goalkeeper);
  const effectiveRule: GoalkeeperRule = format === '3v3' || keepers.length === 0 ? 'none' : keepers.length === 1 ? 'full_game' : goalkeeperRule;
  const starters = players.filter((player) => player.included && player.starts).map((player) => player.id);
  const preview = selectedPlayers.length > 0 ? calculatePlaytime({ total_minutes: totalMinutes, format, periods, players: selectedPlayers, goalkeeper_rule: effectiveRule, calculation_mode: mode, starters }) : null;
  const shortSquad = selectedPlayers.length > 0 && selectedPlayers.length < getPitchPlaces(format);
  const canCalculate = selectedPlayers.length > 0 && totalMinutes > 0 && (!shortSquad || allowShortSquad);

  function toggleIncluded(playerId: string) {
    setPlayers((current) => current.map((player) => player.id === playerId ? { ...player, included: !player.included, starts: false } : player));
  }

  function toggleStarter(playerId: string) {
    setPlayers((current) => current.map((player) => player.id === playerId ? { ...player, starts: !player.starts } : player));
  }

  function calculate() {
    if (!canCalculate) return;
    setResult(calculatePlaytime({ total_minutes: totalMinutes, format, periods, players: selectedPlayers, goalkeeper_rule: effectiveRule, calculation_mode: mode, starters }));
    setSaved(false);
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
    const message = resultToWhatsApp(result, players.filter((player) => player.included), format, totalMinutes);
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

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
                  {mode === 2 && player.included ? <button type="button" onClick={() => toggleStarter(player.id)} className="mt-1 rounded-full border border-white/10 px-3 py-1 text-xs text-white/55">{player.starts ? 'Starting' : 'Sub'}</button> : null}
                </span>
                <button type="button" onClick={() => toggleIncluded(player.id)} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: player.included ? `${primaryColour}24` : 'rgba(255,255,255,0.06)', color: player.included ? primaryColour : 'rgba(255,255,255,0.45)' }}>{player.included ? 'Included' : 'Excluded'}</button>
              </article>
            ))}
          </div>
          <p className="mt-4 text-sm text-white/45">{selectedPlayers.length} players selected</p>
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
          </div>
        </section>

        {format !== '3v3' ? (
          <section className="mt-4 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="text-xl font-bold text-white">Goalkeepers</h2>
            <p className="mt-1 text-sm text-white/40">Select players taking turns in goal this match.</p>
            <div className="mt-4 space-y-3">
              {gkSlots.map((playerId, index) => (
                <label key={index} className="block">
                  <span className="text-xs uppercase tracking-wider text-white/35">Period {index + 1} Goalkeeper</span>
                  <select value={playerId ?? ''} onChange={(event) => setGkSlots((current) => current.map((value, slot) => slot === index ? event.target.value || null : value))} className="mt-2 w-full rounded-xl border border-white/[0.08] bg-[#0d1117] p-3 text-white">
                    <option value="">No goalkeeper</option>
                    {selectedPlayers.map((player) => <option key={player.id} value={player.id}>{player.full_name}</option>)}
                  </select>
                </label>
              ))}
            </div>
            {keepers.length > 1 ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={() => setGoalkeeperRule('option_a')} className="rounded-xl border p-4 text-left text-sm" style={{ borderColor: goalkeeperRule === 'option_a' ? primaryColour : 'rgba(255,255,255,0.08)', backgroundColor: goalkeeperRule === 'option_a' ? `${primaryColour}14` : 'rgba(255,255,255,0.03)' }}><strong className="block text-white">Keepers play full game</strong><span className="text-white/40">Recommended for simpler touchline rotation.</span></button>
                <button type="button" onClick={() => setGoalkeeperRule('option_b')} className="rounded-xl border p-4 text-left text-sm" style={{ borderColor: goalkeeperRule === 'option_b' ? primaryColour : 'rgba(255,255,255,0.08)', backgroundColor: goalkeeperRule === 'option_b' ? `${primaryColour}14` : 'rgba(255,255,255,0.03)' }}><strong className="block text-white">Equal time for all</strong><span className="text-white/40">Keepers return outfield after goal stint.</span></button>
              </div>
            ) : null}
            {preview ? <p className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-sm text-white/45">{preview.goalkeeper_rule_applied}</p> : null}
          </section>
        ) : null}

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
            {result.warnings.map((warning) => <p key={warning} className="mt-3 rounded-xl border p-3 text-sm text-amber-300" style={{ backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.2)' }}>{warning}</p>)}
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <button type="button" onClick={saveResult} className="rounded-full px-4 py-3 font-semibold text-black" style={{ backgroundColor: primaryColour }}>{saved ? 'Saved' : 'Save'}</button>
              <button type="button" onClick={shareWhatsApp} className="rounded-full bg-[#25D366] px-4 py-3 font-semibold text-white">WhatsApp</button>
              <button type="button" onClick={() => router.refresh()} className="rounded-full border border-white/10 px-4 py-3 font-semibold text-white">Recalculate</button>
            </div>
          </section>
        ) : null}
        {error ? <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p> : null}
      </div>
    </main>
  );
}

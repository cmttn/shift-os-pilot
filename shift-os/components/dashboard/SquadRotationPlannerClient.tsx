'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  calculateCycleLength,
  generateWeekendSlots,
  isWeekend,
  randomlyAssignPlayersToOpenSlots,
  validateManualAssignments,
  type ManualAssignment,
  type SrpPlayer,
  type SrpSlot
} from '@/lib/tools/squadRotationPlanner';
import { contrastText } from '@/lib/utils/contrastText';

export interface SrpPlanRow {
  id: string;
  club_id: string | null;
  team_id: string;
  created_by: string;
  title: string | null;
  start_date: string;
  cycle_weeks: number;
  include_goalkeeper: boolean | null;
  excluded_goalkeeper_player_id: string | null;
  allocation_method: 'random' | 'manual' | 'parent_choice';
  parent_note: string | null;
  parent_token: string | null;
  status: 'draft' | 'parent_choice_open' | 'finalised' | 'archived';
}

export interface SrpSlotRow {
  id: string;
  plan_id: string;
  slot_date: string;
  player_id: string | null;
  assigned_by: 'coach_manual' | 'random_fill' | 'parent_choice' | null;
  locked: boolean | null;
}

export interface SrpChoiceRow {
  id: string;
  plan_id: string;
  player_id: string;
  selected_slot_id: string | null;
  choice_type: 'selected_date' | 'no_preference';
  submitted_at: string | null;
}

interface SquadRotationPlannerClientProps {
  userId: string;
  team: {
    id: string;
    name: string;
    clubId: string | null;
  };
  players: SrpPlayer[];
  primaryColour: string;
  enabled: boolean;
  initialPlan: SrpPlanRow | null;
  initialSlots: SrpSlotRow[];
  initialChoices: SrpChoiceRow[];
  setupError?: string | null;
}

type AllocationMethod = 'random' | 'manual' | 'parent_choice';

function formatDate(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

function playerName(players: SrpPlayer[], playerId: string | null): string {
  return players.find((player) => player.id === playerId)?.name ?? 'Unassigned';
}

function defaultParentNote(startDate: string): string {
  const dateText = startDate ? formatDate(startDate) : '[start date]';
  return `Hi, we will be using Squad Rotation Planner from ${dateText}. Please follow the link to choose a rotation day that suits you.`;
}

export default function SquadRotationPlannerClient({
  userId,
  team,
  players,
  primaryColour,
  enabled,
  initialPlan,
  initialSlots,
  initialChoices,
  setupError
}: SquadRotationPlannerClientProps) {
  const textColour = contrastText(primaryColour);
  const [introSeen, setIntroSeen] = useState(Boolean(initialPlan));
  const [excludeGoalkeeper, setExcludeGoalkeeper] = useState(false);
  const [goalkeeperId, setGoalkeeperId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [allocationMethod, setAllocationMethod] = useState<AllocationMethod>('random');
  const [parentNote, setParentNote] = useState('');
  const [manualAssignments, setManualAssignments] = useState<Record<string, string>>({});
  const [plan, setPlan] = useState<SrpPlanRow | null>(initialPlan);
  const [slots, setSlots] = useState<SrpSlotRow[]>(initialSlots);
  const [choices] = useState<SrpChoiceRow[]>(initialChoices);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(setupError ?? '');
  const [saving, setSaving] = useState(false);
  const eligiblePlayers = useMemo(() => players.filter((player) => player.id !== (excludeGoalkeeper ? goalkeeperId : '')), [excludeGoalkeeper, goalkeeperId, players]);
  const cycleLength = calculateCycleLength(players, excludeGoalkeeper ? goalkeeperId || null : null);
  const plannedDates = useMemo(() => {
    if (!startDate || cycleLength < 2) return [];
    try {
      return generateWeekendSlots(startDate, cycleLength);
    } catch {
      return [];
    }
  }, [cycleLength, startDate]);
  const parentChoiceUrl = plan?.parent_token && typeof window !== 'undefined' ? `${window.location.origin}/srp/${plan.parent_token}` : '';

  function validateSetup(): string | null {
    if (!enabled) return 'SRP is not enabled for this team.';
    if (players.length < 2) return 'SRP needs at least two active players.';
    if (excludeGoalkeeper && !goalkeeperId) return 'Choose a goalkeeper to exclude.';
    if (cycleLength < 2) return 'Rotation cycle must include at least two players.';
    if (!startDate) return 'Choose a start date.';
    const parsedStart = new Date(`${startDate}T12:00:00`);
    if (Number.isNaN(parsedStart.valueOf()) || !isWeekend(parsedStart)) return 'Start date must be a Saturday or Sunday.';
    if (startDate < todayInput()) return 'Start date cannot be in the past.';
    if (allocationMethod === 'manual') {
      const manualError = validateManualAssignments(plannedDates.map((slotDate): ManualAssignment => ({ slotDate, playerId: manualAssignments[slotDate] ?? null })));
      if (manualError) return manualError;
    }
    return null;
  }

  async function createPlan() {
    setError('');
    setMessage('');
    const validationError = validateSetup();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    const token = allocationMethod === 'parent_choice' ? crypto.randomUUID() : null;
    const note = allocationMethod === 'parent_choice' ? (parentNote.trim() || defaultParentNote(startDate)) : null;
    const status = allocationMethod === 'parent_choice' ? 'parent_choice_open' : allocationMethod === 'random' ? 'finalised' : 'draft';
    const supabase = createClient();
    const { data: insertedPlan, error: planError } = await supabase
      .from('srp_plans')
      .insert({
        club_id: team.clubId,
        team_id: team.id,
        created_by: userId,
        start_date: startDate,
        cycle_weeks: cycleLength,
        include_goalkeeper: !excludeGoalkeeper,
        excluded_goalkeeper_player_id: excludeGoalkeeper ? goalkeeperId : null,
        allocation_method: allocationMethod,
        parent_note: note,
        parent_token: token,
        status
      })
      .select('id,club_id,team_id,created_by,title,start_date,cycle_weeks,include_goalkeeper,excluded_goalkeeper_player_id,allocation_method,parent_note,parent_token,status')
      .single<SrpPlanRow>();

    if (planError || !insertedPlan) {
      setSaving(false);
      setError(planError?.message ?? 'Could not create SRP plan.');
      return;
    }

    const baseSlots: SrpSlot[] = plannedDates.map((slotDate) => ({ slot_date: slotDate, player_id: null, locked: false }));
    const slotDrafts =
      allocationMethod === 'random'
        ? randomlyAssignPlayersToOpenSlots(eligiblePlayers, baseSlots)
        : baseSlots.map((slot) => ({
            ...slot,
            player_id: allocationMethod === 'manual' ? manualAssignments[slot.slot_date] ?? null : null,
            assigned_by: allocationMethod === 'manual' && manualAssignments[slot.slot_date] ? 'coach_manual' : null
          }));

    const { data: insertedSlots, error: slotError } = await supabase
      .from('srp_slots')
      .insert(slotDrafts.map((slot) => ({
        plan_id: insertedPlan.id,
        slot_date: slot.slot_date,
        player_id: slot.player_id,
        assigned_by: slot.assigned_by ?? null,
        locked: slot.locked ?? false
      })))
      .select('id,plan_id,slot_date,player_id,assigned_by,locked');

    setSaving(false);
    if (slotError) {
      setError(slotError.message);
      return;
    }

    setPlan(insertedPlan);
    setSlots((insertedSlots ?? []) as SrpSlotRow[]);
    setMessage(allocationMethod === 'parent_choice' ? 'Parent choice link created.' : 'SRP plan created.');
  }

  async function randomFillRemaining() {
    if (!plan) return;
    setError('');
    const next = randomlyAssignPlayersToOpenSlots(eligiblePlayers, slots);
    const changed = next.filter((slot, index) => slot.player_id !== slots[index]?.player_id);
    if (changed.length === 0) {
      setMessage('No open slots to fill.');
      return;
    }

    const supabase = createClient();
    const results = await Promise.all(changed.map((slot) => supabase.from('srp_slots').update({ player_id: slot.player_id, assigned_by: 'random_fill' }).eq('id', slot.id)));
    const failed = results.find((result) => result.error);
    if (failed?.error) {
      setError(failed.error.message);
      return;
    }
    setSlots(next as SrpSlotRow[]);
    setMessage('Remaining slots filled.');
  }

  async function updateSlot(slotId: string, playerId: string) {
    setError('');
    if (playerId && slots.some((slot) => slot.id !== slotId && slot.player_id === playerId)) {
      setError('That player is already assigned to another week.');
      return;
    }
    const { error: updateError } = await createClient()
      .from('srp_slots')
      .update({ player_id: playerId || null, assigned_by: playerId ? 'coach_manual' : null, locked: false })
      .eq('id', slotId);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSlots((current) => current.map((slot) => (slot.id === slotId ? { ...slot, player_id: playerId || null, assigned_by: playerId ? 'coach_manual' : null, locked: false } : slot)));
  }

  async function copyParentLink() {
    if (!parentChoiceUrl) return;
    await navigator.clipboard.writeText(parentChoiceUrl);
    setMessage('Parent choice link copied.');
  }

  if (!enabled) {
    return (
      <main className="min-h-screen px-5 pb-24 pt-8 text-white md:ml-[260px]" style={{ backgroundColor: '#080a0f' }}>
        <section className="mx-auto max-w-[720px] rounded-2xl border border-white/[0.06] p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)' }}>
          <p className="text-xs uppercase tracking-[0.28em] text-white/30">Coach tool</p>
          <h1 className="mt-2 text-3xl font-black">Squad Rotation Planner</h1>
          <p className="mt-3 text-sm text-white/45">SRP is not enabled for this club yet. Ask your club admin to enable Squad Rotation Planner in club settings.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 pb-24 pt-8 text-white md:ml-[260px]" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[900px]">
        <header>
          <p className="text-xs uppercase tracking-[0.28em] text-white/30">Coach tool</p>
          <h1 className="mt-2 text-3xl font-black">Squad Rotation Planner</h1>
          <p className="mt-2 text-sm font-semibold" style={{ color: primaryColour }}>More minutes. Less subs. Less pressure. More smiles.</p>
        </header>

        {error ? <p className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</p> : null}
        {message ? <p className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">{message}</p> : null}

        {!introSeen ? (
          <section className="mt-6 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="text-2xl font-black">Squad Rotation Planner</h2>
            <p className="mt-2 text-base font-semibold" style={{ color: primaryColour }}>More minutes. Less subs. Less pressure. More smiles.</p>
            <p className="mt-5 text-sm leading-relaxed text-white/55">SRP helps coaches create a fair planned rotation schedule across the squad. Instead of children spending long periods on the sideline, each player has a planned rotation week across the cycle. Families can use that weekend constructively, and coaches can plan matchdays with fewer subs and clearer expectations.</p>
            <p className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-sm font-semibold text-white">This does not reduce a player&apos;s fair playing minutes across the season. It helps reduce wasted sideline minutes on individual matchdays.</p>
            <button type="button" onClick={() => setIntroSeen(true)} className="mt-6 rounded-full px-6 py-3 text-sm font-bold" style={{ backgroundColor: primaryColour, color: textColour }}>Start Planning</button>
          </section>
        ) : null}

        {introSeen && !plan ? (
          <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
            <section className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <h2 className="text-xl font-bold">Squad overview</h2>
              <p className="mt-2 text-sm text-white/40">{team.name} · {players.length} active players</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {players.map((player) => <p key={player.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white/70">{player.name}</p>)}
              </div>
              <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                <label className="flex items-center gap-3 text-sm font-semibold text-white">
                  <input type="checkbox" checked={excludeGoalkeeper} onChange={(event) => setExcludeGoalkeeper(event.target.checked)} />
                  Exclude goalkeeper from rotation
                </label>
                {excludeGoalkeeper ? (
                  <select value={goalkeeperId} onChange={(event) => setGoalkeeperId(event.target.value)} className="mt-3 w-full rounded-xl border border-white/[0.08] bg-[#080a0f] px-4 py-3 text-sm text-white">
                    <option value="">Choose goalkeeper</option>
                    {players.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
                  </select>
                ) : null}
                <p className="mt-3 text-xs leading-relaxed text-white/35">We recommend including the goalkeeper where possible so the rotation remains fully fair across the squad.</p>
                <p className="mt-3 text-sm text-white/50">Suggested cycle: <span className="font-semibold text-white">{cycleLength || players.length} weeks</span></p>
              </div>
            </section>

            <section className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <h2 className="text-xl font-bold">Create plan</h2>
              <label className="mt-4 block">
                <span className="text-sm font-semibold text-white/70">Start date</span>
                <input type="date" min={todayInput()} value={startDate} onChange={(event) => { setStartDate(event.target.value); setParentNote(defaultParentNote(event.target.value)); }} className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white" />
                <span className="mt-2 block text-xs text-white/35">Choose a Saturday or Sunday. Past dates are not allowed.</span>
              </label>
              <div className="mt-5 space-y-2">
                {(['random', 'manual', 'parent_choice'] as const).map((method) => (
                  <button key={method} type="button" onClick={() => setAllocationMethod(method)} className="w-full rounded-xl border p-4 text-left transition" style={{ borderColor: allocationMethod === method ? primaryColour : 'rgba(255,255,255,0.06)', backgroundColor: allocationMethod === method ? `${primaryColour}14` : 'rgba(255,255,255,0.02)' }}>
                    <span className="block text-sm font-semibold text-white">{method === 'random' ? 'Set random' : method === 'manual' ? 'Set manual' : 'Push to parent with note'}</span>
                    <span className="mt-1 block text-xs text-white/35">{method === 'random' ? 'Automatically assigns one player per week.' : method === 'manual' ? 'Choose each player yourself.' : 'Create a parent choice link.'}</span>
                  </button>
                ))}
              </div>
              {allocationMethod === 'parent_choice' ? (
                <label className="mt-4 block">
                  <span className="text-sm font-semibold text-white/70">Parent note</span>
                  <textarea value={parentNote || defaultParentNote(startDate)} onChange={(event) => setParentNote(event.target.value)} className="mt-2 min-h-[120px] w-full rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 text-sm text-white" />
                </label>
              ) : null}
              {allocationMethod === 'manual' && plannedDates.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {plannedDates.map((slotDate) => (
                    <label key={slotDate} className="block rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                      <span className="block text-xs text-white/35">{formatDate(slotDate)}</span>
                      <select value={manualAssignments[slotDate] ?? ''} onChange={(event) => setManualAssignments((current) => ({ ...current, [slotDate]: event.target.value }))} className="mt-2 w-full rounded-lg border border-white/[0.08] bg-[#080a0f] px-3 py-2 text-sm text-white">
                        <option value="">Unassigned</option>
                        {eligiblePlayers.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
              ) : null}
              <button type="button" onClick={createPlan} disabled={saving} className="mt-6 w-full rounded-full px-6 py-3 text-sm font-bold disabled:opacity-50" style={{ backgroundColor: primaryColour, color: textColour }}>{saving ? 'Creating...' : 'Create SRP Plan'}</button>
            </section>
          </div>
        ) : null}

        {plan ? (
          <section className="mt-6 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-2xl font-black">Current rotation plan</h2>
                <p className="mt-1 text-sm text-white/40">Starts {formatDate(plan.start_date)} · {plan.cycle_weeks} week cycle · {plan.status.replace(/_/g, ' ')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={randomFillRemaining} className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white">Random fill remaining</button>
                {parentChoiceUrl ? <button type="button" onClick={copyParentLink} className="rounded-full px-4 py-2 text-sm font-semibold" style={{ backgroundColor: primaryColour, color: textColour }}>Copy parent choice link</button> : null}
              </div>
            </div>
            {parentChoiceUrl ? <code className="mt-4 block break-all rounded-xl bg-white/[0.04] p-3 text-xs text-white/50">{parentChoiceUrl}</code> : null}
            <div className="mt-6 space-y-3">
              {slots.map((slot) => {
                const choice = choices.find((item) => item.player_id === slot.player_id);
                return (
                  <div key={slot.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{formatDate(slot.slot_date)}</p>
                        <p className="mt-1 text-xs text-white/35">{slot.assigned_by === 'parent_choice' ? 'Parent selected' : slot.assigned_by === 'coach_manual' ? 'Coach manual' : slot.assigned_by === 'random_fill' ? 'Random fill' : 'Open slot'}{slot.locked ? ' · locked' : ''}</p>
                      </div>
                      <select value={slot.player_id ?? ''} disabled={Boolean(slot.locked)} onChange={(event) => { void updateSlot(slot.id, event.target.value); }} className="rounded-xl border border-white/[0.08] bg-[#080a0f] px-3 py-2 text-sm text-white disabled:opacity-60">
                        <option value="">Unassigned</option>
                        {eligiblePlayers.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
                      </select>
                    </div>
                    <p className="mt-2 text-xs text-white/30">{playerName(players, slot.player_id)}{choice?.choice_type === 'no_preference' ? ' · no preference' : ''}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl bg-white/[0.03] p-4"><p className="text-xs text-white/30">Unassigned players</p><p className="mt-1 text-sm text-white">{eligiblePlayers.filter((player) => !slots.some((slot) => slot.player_id === player.id)).map((player) => player.name).join(', ') || 'None'}</p></div>
              <div className="rounded-xl bg-white/[0.03] p-4"><p className="text-xs text-white/30">Don&apos;t mind</p><p className="mt-1 text-sm text-white">{choices.filter((choice) => choice.choice_type === 'no_preference').length}</p></div>
              <div className="rounded-xl bg-white/[0.03] p-4"><p className="text-xs text-white/30">No response</p><p className="mt-1 text-sm text-white">{eligiblePlayers.filter((player) => !choices.some((choice) => choice.player_id === player.id) && !slots.some((slot) => slot.player_id === player.id)).length}</p></div>
            </div>
          </section>
        ) : null}
        <Link href="/dashboard/coach" className="mt-8 inline-flex text-sm text-white/35">Back to coach dashboard</Link>
      </div>
    </main>
  );
}

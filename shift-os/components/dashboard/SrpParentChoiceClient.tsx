'use client';

import { useMemo, useState } from 'react';
import { contrastText } from '@/lib/utils/contrastText';

export interface SrpChoicePlayer {
  id: string;
  name: string;
}

export interface SrpChoiceSlot {
  id: string;
  slotDate: string;
  playerId: string | null;
}

interface SrpParentChoiceClientProps {
  token: string;
  teamName: string;
  players: SrpChoicePlayer[];
  slots: SrpChoiceSlot[];
  primaryColour: string;
  note: string | null;
}

function formatDate(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function SrpParentChoiceClient({ token, teamName, players, slots, primaryColour, note }: SrpParentChoiceClientProps) {
  const textColour = contrastText(primaryColour);
  const [playerId, setPlayerId] = useState('');
  const [choiceType, setChoiceType] = useState<'selected_date' | 'no_preference'>('selected_date');
  const [slotId, setSlotId] = useState('');
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState('');
  const openSlots = useMemo(() => slots.filter((slot) => !slot.playerId || slot.playerId === playerId), [playerId, slots]);

  async function submitChoice() {
    setError('');
    if (!playerId) {
      setError('Choose a player.');
      return;
    }
    if (choiceType === 'selected_date' && !slotId) {
      setError('Choose a rotation date or select no preference.');
      return;
    }

    setSaving(true);
    const response = await fetch('/api/srp/parent-choice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        playerId,
        choiceType,
        slotId: choiceType === 'selected_date' ? slotId : null
      })
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    setSaving(false);
    if (!response.ok) {
      setError(payload.error ?? 'Could not save that preference.');
      return;
    }
    setComplete(true);
  }

  if (complete) {
    return (
      <section className="rounded-2xl border border-white/[0.06] p-8 text-center" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)' }}>
        <h1 className="text-2xl font-black text-white">Thanks — your preference has been saved.</h1>
        <p className="mt-3 text-sm text-white/45">Your coach can now use this when finalising the squad rotation plan.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/[0.06] p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)' }}>
      <p className="text-xs uppercase tracking-[0.28em] text-white/30">{teamName}</p>
      <h1 className="mt-2 text-3xl font-black text-white">Choose your squad rotation week</h1>
      <p className="mt-4 text-sm leading-relaxed text-white/50">This tool is designed to lower minutes spent on the sideline, allowing families to use that time constructively and helping coaches plan matchdays more fairly. Your chosen week can be a weekend you already cannot make, or simply planned downtime. This does not reduce playing minutes across the season — it helps reduce sideline minutes on individual matchdays.</p>
      {note ? <p className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-sm text-white/55">{note}</p> : null}

      <label className="mt-6 block">
        <span className="text-sm font-semibold text-white/70">Player</span>
        <select value={playerId} onChange={(event) => { setPlayerId(event.target.value); setSlotId(''); }} className="mt-2 w-full rounded-xl border border-white/[0.08] bg-[#080a0f] px-4 py-3 text-sm text-white">
          <option value="">Choose player</option>
          {players.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
        </select>
      </label>

      <div className="mt-5 grid gap-2">
        <button type="button" onClick={() => setChoiceType('selected_date')} className="rounded-xl border p-4 text-left" style={{ borderColor: choiceType === 'selected_date' ? primaryColour : 'rgba(255,255,255,0.06)', backgroundColor: choiceType === 'selected_date' ? `${primaryColour}14` : 'rgba(255,255,255,0.02)' }}>
          <span className="text-sm font-semibold text-white">Choose a rotation date</span>
        </button>
        <button type="button" onClick={() => { setChoiceType('no_preference'); setSlotId(''); }} className="rounded-xl border p-4 text-left" style={{ borderColor: choiceType === 'no_preference' ? primaryColour : 'rgba(255,255,255,0.06)', backgroundColor: choiceType === 'no_preference' ? `${primaryColour}14` : 'rgba(255,255,255,0.02)' }}>
          <span className="text-sm font-semibold text-white">No preference / don&apos;t mind</span>
        </button>
      </div>

      {choiceType === 'selected_date' ? (
        <label className="mt-5 block">
          <span className="text-sm font-semibold text-white/70">Rotation date</span>
          <select value={slotId} onChange={(event) => setSlotId(event.target.value)} className="mt-2 w-full rounded-xl border border-white/[0.08] bg-[#080a0f] px-4 py-3 text-sm text-white">
            <option value="">Choose date</option>
            {openSlots.map((slot) => <option key={slot.id} value={slot.id}>{formatDate(slot.slotDate)}</option>)}
          </select>
          <span className="mt-2 block text-xs text-white/30">Dates disappear once another family chooses them.</span>
        </label>
      ) : null}

      {error ? <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}
      <button type="button" onClick={submitChoice} disabled={saving} className="mt-6 w-full rounded-full px-6 py-3 text-sm font-bold disabled:opacity-50" style={{ backgroundColor: primaryColour, color: textColour }}>{saving ? 'Saving...' : 'Save preference'}</button>
    </section>
  );
}

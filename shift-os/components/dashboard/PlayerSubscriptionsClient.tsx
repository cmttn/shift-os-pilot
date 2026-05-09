'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface SubscriptionPlayerRow {
  player_id: string;
  player_name: string;
  team_name: string;
  status: 'paid' | 'overdue' | 'exempt';
  amount_due: number | null;
  due_date: string | null;
  last_contacted: string | null;
}

interface PlayerSubscriptionsClientProps {
  clubId: string;
  clubName: string;
  primaryColour: string;
  rows: SubscriptionPlayerRow[];
}

function statusColour(status: string): string {
  if (status === 'paid') return '#10b981';
  if (status === 'overdue') return '#ef4444';
  return 'rgba(255,255,255,0.25)';
}

export default function PlayerSubscriptionsClient({ clubId, clubName, primaryColour, rows }: PlayerSubscriptionsClientProps) {
  const [players, setPlayers] = useState(rows);
  const [message, setMessage] = useState('');

  async function updateStatus(playerId: string, status: 'paid' | 'overdue' | 'exempt') {
    const { error } = await createClient().from('player_subscriptions').upsert({ player_id: playerId, club_id: clubId, status }, { onConflict: 'player_id,club_id' });
    if (!error) setPlayers((current) => current.map((row) => row.player_id === playerId ? { ...row, status } : row));
  }

  async function suspend(player: SubscriptionPlayerRow) {
    const reason = window.prompt('Suspension reason: subscription_overdue, disciplinary, other', 'subscription_overdue');
    if (reason !== 'subscription_overdue' && reason !== 'disciplinary' && reason !== 'other') return;
    const notes = window.prompt('Internal notes', '') ?? '';
    await createClient().from('player_suspensions').insert({ player_id: player.player_id, club_id: clubId, reason, internal_notes: notes, start_date: new Date().toISOString().slice(0, 10), is_active: true });
  }

  async function reinstate(player: SubscriptionPlayerRow) {
    await createClient().from('player_suspensions').update({ is_active: false, reinstated_at: new Date().toISOString() }).eq('player_id', player.player_id).eq('club_id', clubId).eq('is_active', true);
  }

  async function sendReminder(player: SubscriptionPlayerRow) {
    const amount = player.amount_due ? `£${player.amount_due.toFixed(2)}` : 'your subscription';
    const dueDate = player.due_date ?? 'the due date';
    const copy = `Hi ${player.player_name}, your subscription of ${amount} for ${player.team_name} is due on ${dueDate}. Please contact ${clubName} to arrange payment.`;
    await navigator.clipboard.writeText(copy);
    await createClient().from('subscription_contact_log').insert({ player_id: player.player_id, contact_method: 'whatsapp', message_sent: copy });
    setMessage(`Reminder copied for ${player.player_name}.`);
    window.open(`https://wa.me/?text=${encodeURIComponent(copy)}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <section className="overflow-hidden rounded-2xl border" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      {message ? <p className="border-b border-white/[0.06] bg-white/[0.03] p-4 text-sm text-white/50">{message}</p> : null}
      <div className="hidden grid-cols-7 gap-3 border-b border-white/[0.06] px-5 py-3 text-xs uppercase tracking-[0.18em] text-white/25 md:grid">
        <span>Player</span><span>Team</span><span>Status</span><span>Amount</span><span>Due</span><span>Last Contacted</span><span>Actions</span>
      </div>
      {players.map((player) => (
        <article key={player.player_id} className="grid gap-3 border-b border-white/[0.06] p-5 text-sm md:grid-cols-7 md:items-center">
          <span className="font-semibold text-white">{player.player_name}</span>
          <span className="text-white/40">{player.team_name}</span>
          <span><span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: statusColour(player.status) }}>{player.status}</span></span>
          <span className="text-white/40">{player.amount_due ? `£${player.amount_due.toFixed(2)}` : '-'}</span>
          <span className="text-white/40">{player.due_date ?? '-'}</span>
          <span className="text-white/40">{player.last_contacted ?? '-'}</span>
          <span className="flex flex-wrap gap-2">
            <button type="button" onClick={() => sendReminder(player)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white">Reminder</button>
            <button type="button" onClick={() => updateStatus(player.player_id, 'paid')} className="rounded-full px-3 py-1.5 text-xs font-semibold text-black" style={{ backgroundColor: primaryColour }}>Paid</button>
            <button type="button" onClick={() => updateStatus(player.player_id, 'exempt')} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white">Exempt</button>
            <button type="button" onClick={() => suspend(player)} className="rounded-full border border-red-400/40 px-3 py-1.5 text-xs text-red-200">Suspend</button>
            <button type="button" onClick={() => reinstate(player)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white">Reinstate</button>
          </span>
        </article>
      ))}
    </section>
  );
}

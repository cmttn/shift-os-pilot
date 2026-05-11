'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { TicketStatus } from '@/lib/tools/ticketTypes';

interface TicketStatusActionsProps {
  ticketId: string;
  currentStatus: TicketStatus;
  actorRole: 'coach' | 'club_admin';
  primaryColour: string;
  notifyTitle?: string;
  notifyMessage?: string;
}

const statuses: Array<{ value: TicketStatus; label: string }> = [
  { value: 'viewed', label: 'Mark Viewed' },
  { value: 'in_progress', label: 'Mark In Progress' },
  { value: 'resolved', label: 'Mark Resolved' }
];

export default function TicketStatusActions({ ticketId, currentStatus, actorRole, primaryColour, notifyTitle, notifyMessage }: TicketStatusActionsProps) {
  const [status, setStatus] = useState<TicketStatus>(currentStatus);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState<TicketStatus | null>(null);

  async function updateStatus(nextStatus: TicketStatus) {
    setSaving(nextStatus);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id ?? null;
    await supabase
      .from('tickets')
      .update({
        status: nextStatus,
        resolution_note: nextStatus === 'resolved' ? note.trim() || null : undefined,
        resolved_by: nextStatus === 'resolved' ? userId : undefined,
        resolved_at: nextStatus === 'resolved' ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);
    await supabase.from('ticket_events').insert({
      ticket_id: ticketId,
      event_type: nextStatus === 'resolved' ? 'resolved' : 'status_changed',
      actor_id: userId,
      actor_role: actorRole,
      note: note.trim() || `Status changed to ${nextStatus}`
    });
    if (notifyTitle && notifyMessage) {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: ticketId, team_id: '', audience: 'ticket_raiser', title: notifyTitle, message: notifyMessage })
      });
    }
    setStatus(nextStatus);
    setSaving(null);
  }

  return (
    <div className="mt-4">
      <textarea value={note} onChange={(event) => setNote(event.target.value.slice(0, 200))} rows={2} placeholder="Internal note or resolution note..." className="w-full resize-none rounded-xl border bg-white/[0.04] p-3 text-xs text-white outline-none placeholder:text-white/25" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <div className="mt-3 flex flex-wrap gap-2">
        {statuses.map((item) => (
          <button key={item.value} type="button" disabled={saving !== null || status === item.value} onClick={() => void updateStatus(item.value)} className="rounded-full border px-3 py-2 text-xs font-semibold transition-all duration-300 ease-out disabled:opacity-40" style={status === item.value ? { backgroundColor: primaryColour, borderColor: primaryColour, color: '#000000' } : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)' }}>
            {saving === item.value ? 'Saving...' : item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { COACH_TICKET_TYPES, type TicketOutcome, type TicketTypeDefinition } from '@/lib/tools/ticketTypes';

interface CoachTicketTeam {
  teamId: string;
  teamName: string;
  clubId: string;
  clubName: string;
  primaryColour: string;
}

interface AssignmentRow {
  team_id: string;
}

interface TeamRow {
  id: string;
  name: string;
  club_id: string | null;
  clubs?: { id: string; name: string | null; primary_colour: string | null } | Array<{ id: string; name: string | null; primary_colour: string | null }> | null;
}

interface TicketInsertResult {
  id: string;
  ticket_ref: string | null;
}

function getFirstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function getContrast(hexColour: string): string {
  const hex = hexColour.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#000000' : '#ffffff';
}

export default function NewCoachTicketPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<CoachTicketTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [outcome, setOutcome] = useState<TicketOutcome>('log_only');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedTeam = teams.find((team) => team.teamId === selectedTeamId) ?? teams[0] ?? null;
  const selectedType = (COACH_TICKET_TYPES as readonly TicketTypeDefinition[]).find((type) => type.id === selectedTypeId) ?? null;
  const primaryColour = selectedTeam?.primaryColour ?? '#00C851';
  const contrast = getContrast(primaryColour);
  const forcedFollowUp = Boolean(selectedType && (selectedType.is_safeguarding || !selectedType.can_log_only));

  useEffect(() => {
    async function loadTeams() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        router.push('/auth/login');
        return;
      }
      const { data: assignmentsData } = await supabase.from('team_coaches').select('team_id').eq('user_id', user.id);
      const assignments = (assignmentsData ?? []) as AssignmentRow[];
      const teamIds = assignments.map((assignment) => assignment.team_id);
      const { data: teamsData } = teamIds.length > 0
        ? await supabase.from('teams').select('id,name,club_id,clubs(id,name,primary_colour)').in('id', teamIds)
        : { data: [] as TeamRow[] };
      const mapped = ((teamsData ?? []) as TeamRow[]).flatMap((team) => {
        if (!team.club_id) return [];
        const club = getFirstRelation(team.clubs);
        return [{
          teamId: team.id,
          teamName: team.name,
          clubId: team.club_id,
          clubName: club?.name ?? 'Club',
          primaryColour: club?.primary_colour ?? '#00C851'
        }];
      });
      setTeams(mapped);
      setSelectedTeamId(mapped[0]?.teamId ?? '');
      setLoading(false);
    }
    void loadTeams();
  }, [router]);

  useEffect(() => {
    if (!selectedType) return;
    setOutcome(forcedFollowUp ? 'followup' : selectedType.default_outcome);
  }, [forcedFollowUp, selectedType]);

  async function submitTicket() {
    if (!selectedTeam || !selectedType) return;
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      router.push('/auth/login');
      return;
    }
    const { data: ticket, error: insertError } = await supabase
      .from('tickets')
      .insert({
        raised_by: user.id,
        raiser_role: 'coach',
        team_id: selectedTeam.teamId,
        club_id: selectedTeam.clubId,
        ticket_type: selectedType.id,
        is_safeguarding: selectedType.is_safeguarding,
        is_positive: selectedType.is_positive,
        priority: selectedType.is_safeguarding ? 'urgent' : selectedType.priority,
        outcome_type: forcedFollowUp ? 'followup' : outcome,
        was_duplicate: false,
        routes_to: ['club'],
        coach_recipient_id: null,
        message: message.trim() || null,
        status: 'open'
      })
      .select('id,ticket_ref')
      .single<TicketInsertResult>();
    if (insertError || !ticket) {
      setError(insertError?.message ?? 'Could not raise ticket.');
      setSubmitting(false);
      return;
    }
    await supabase.from('ticket_events').insert({ ticket_id: ticket.id, event_type: 'created', actor_id: user.id, actor_role: 'coach', note: 'Ticket created' });
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: ticket.id,
        team_id: selectedTeam.teamId,
        club_id: selectedTeam.clubId,
        audience: 'club_admins',
        title: selectedType.is_safeguarding ? 'URGENT - Coach Safeguarding Ticket' : 'Coach Ticket Raised',
        message: `${selectedType.label} raised for ${selectedTeam.teamName}`
      })
    });
    router.push(`/dashboard/coach/tickets?raised=${encodeURIComponent(ticket.ticket_ref ?? 'ticket')}`);
  }

  if (loading) return <main className="min-h-screen px-5 py-10 text-white" style={{ backgroundColor: '#080a0f' }}>Loading tickets...</main>;

  return (
    <main className="min-h-screen px-5 pb-24 pt-8 text-white md:ml-[260px]" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[480px]">
        <Link href="/dashboard/coach/tickets" className="text-sm text-white/40">Back to tickets</Link>
        <h1 className="mt-5 text-3xl font-black">Raise a Ticket</h1>
        <p className="mt-2 text-sm text-white/40">Use tickets for structured club follow-up outside the app.</p>
        {teams.length > 1 ? (
          <section className="mt-5 rounded-2xl border p-4" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <label className="text-xs uppercase tracking-[0.24em] text-white/35" htmlFor="team">Team</label>
            <select id="team" value={selectedTeamId} onChange={(event) => setSelectedTeamId(event.target.value)} className="mt-3 w-full rounded-xl border bg-white/[0.04] p-3 text-white" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              {teams.map((team) => <option key={team.teamId} value={team.teamId}>{team.teamName}</option>)}
            </select>
          </section>
        ) : null}

        <section className="mt-6 grid grid-cols-2 gap-3">
          {(COACH_TICKET_TYPES as readonly TicketTypeDefinition[]).map((type) => {
            const selected = type.id === selectedTypeId;
            const borderColour = type.is_safeguarding ? '#ef4444' : type.is_positive ? '#10b981' : 'rgba(255,255,255,0.08)';
            return (
              <button key={type.id} type="button" onClick={() => setSelectedTypeId(type.id)} className="rounded-2xl border p-4 text-left transition-all duration-300 ease-out hover:-translate-y-0.5" style={{ backgroundColor: selected ? `${primaryColour}18` : type.is_positive ? 'rgba(16,185,129,0.08)' : type.is_safeguarding ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)', borderColor: selected ? primaryColour : borderColour }}>
                <span className="text-2xl">{type.emoji}</span>
                <span className="mt-3 block text-sm font-semibold text-white">{type.label}</span>
                <span className="mt-2 block text-xs text-white/40">{type.description}</span>
                {type.is_safeguarding ? <span className="mt-3 inline-flex rounded-full bg-red-500/15 px-2 py-1 text-[10px] font-bold uppercase text-red-300">Urgent</span> : null}
              </button>
            );
          })}
        </section>

        {selectedType ? (
          <section className="mt-6 rounded-2xl border p-5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="text-lg font-bold">Outcome</h2>
            <div className="mt-4 space-y-3">
              {selectedType.can_log_only && !selectedType.is_safeguarding ? (
                <button type="button" onClick={() => setOutcome('log_only')} className="w-full rounded-2xl border p-4 text-left" style={{ borderColor: outcome === 'log_only' ? primaryColour : 'rgba(255,255,255,0.08)', backgroundColor: outcome === 'log_only' ? `${primaryColour}14` : 'rgba(255,255,255,0.03)' }}>
                  <span className="font-semibold">Log Only</span>
                  <span className="mt-1 block text-xs text-white/40">Record the issue. No follow-up needed.</span>
                </button>
              ) : null}
              <button type="button" onClick={() => setOutcome('followup')} className="w-full rounded-2xl border p-4 text-left" style={{ borderColor: outcome === 'followup' ? primaryColour : 'rgba(255,255,255,0.08)', backgroundColor: outcome === 'followup' ? `${primaryColour}14` : 'rgba(255,255,255,0.03)' }}>
                <span className="font-semibold">Request Follow-up</span>
                <span className="mt-1 block text-xs text-white/40">{selectedType.is_safeguarding ? 'Safeguarding tickets always require follow-up.' : 'Club admin will contact you outside the app.'}</span>
              </button>
            </div>
          </section>
        ) : null}

        <section className="mt-6 rounded-2xl border p-5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <label htmlFor="message" className="text-sm font-semibold">Message <span className="text-white/35">(optional)</span></label>
          <textarea id="message" value={message} onChange={(event) => setMessage(event.target.value.slice(0, 150))} rows={4} placeholder="Add a short note..." className="mt-3 w-full resize-none rounded-xl border bg-white/[0.04] p-3 text-sm text-white outline-none placeholder:text-white/25" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
          <p className="mt-2 text-right text-xs text-white/25">{message.length}/150</p>
        </section>

        {error ? <p className="mt-4 rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}
        <button type="button" disabled={!selectedType || !selectedTeam || submitting} onClick={() => void submitTicket()} className="mt-6 w-full rounded-full px-5 py-4 text-sm font-black disabled:opacity-40" style={{ backgroundColor: primaryColour, color: contrast }}>
          {submitting ? 'Raising ticket...' : 'Raise Ticket'}
        </button>
      </div>
    </main>
  );
}

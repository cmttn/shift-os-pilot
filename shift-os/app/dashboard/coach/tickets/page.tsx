import Link from 'next/link';
import { redirect } from 'next/navigation';
import TicketStatusActions from '@/components/dashboard/TicketStatusActions';
import { getCoachData } from '@/lib/dashboard/getCoachData';
import { createClient } from '@/lib/supabase/server';
import { COACH_TICKET_TYPES, PARENT_TICKET_TYPES, type TicketStatus, type TicketTypeDefinition } from '@/lib/tools/ticketTypes';

interface CoachTicketsPageProps {
  searchParams?: {
    raised?: string;
  };
}

interface TicketRow {
  id: string;
  ticket_ref: string | null;
  ticket_type: string;
  raiser_role: 'parent' | 'coach';
  is_safeguarding: boolean | null;
  is_positive: boolean | null;
  priority: string | null;
  outcome_type: string;
  was_duplicate: boolean | null;
  message: string | null;
  status: TicketStatus;
  created_at: string | null;
  teams?: { name: string | null } | Array<{ name: string | null }> | null;
}

function getFirstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function getTicketType(id: string, role: 'parent' | 'coach'): TicketTypeDefinition | null {
  const source = role === 'coach' ? COACH_TICKET_TYPES : PARENT_TICKET_TYPES;
  return (source as readonly TicketTypeDefinition[]).find((type) => type.id === id) ?? null;
}

function formatDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function TicketCard({ ticket, primaryColour, showActions }: { ticket: TicketRow; primaryColour: string; showActions: boolean }) {
  const type = getTicketType(ticket.ticket_type, ticket.raiser_role);
  const team = getFirstRelation(ticket.teams);
  const border = ticket.is_safeguarding ? '#ef4444' : ticket.was_duplicate || ticket.priority === 'urgent' ? '#f59e0b' : ticket.is_positive ? '#10b981' : 'rgba(255,255,255,0.15)';
  return (
    <article className="rounded-2xl border p-4" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)', borderLeft: `3px solid ${border}` }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-white/30">{ticket.ticket_ref ?? 'TKT'} - {formatDate(ticket.created_at)}</p>
          <h2 className="mt-2 text-base font-semibold text-white">{type?.emoji ?? '!'} {type?.label ?? ticket.ticket_type}</h2>
          <p className="mt-1 text-xs text-white/35">{team?.name ?? 'Team'} - {ticket.outcome_type === 'followup' ? 'Follow-up requested' : 'Log only'}</p>
        </div>
        <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/55">{ticket.status.replace('_', ' ')}</span>
      </div>
      {ticket.message ? <p className="mt-3 line-clamp-2 text-sm italic text-white/40">{ticket.message}</p> : null}
      {showActions && ticket.status !== 'resolved' ? (
        <TicketStatusActions
          ticketId={ticket.id}
          currentStatus={ticket.status}
          actorRole="coach"
          primaryColour={primaryColour}
          notifyTitle="Ticket Updated"
          notifyMessage={`Your ticket ${ticket.ticket_ref ?? ''} is now ${ticket.status}`}
        />
      ) : null}
    </article>
  );
}

export default async function CoachTicketsPage({ searchParams }: CoachTicketsPageProps) {
  const coachData = await getCoachData();
  if (!coachData) redirect('/dashboard/coach/welcome');
  const supabase = await createClient();
  const primaryColour = coachData.teams[0]?.club_primary_colour ?? '#00C851';
  const [{ data: incomingData }, { data: raisedData }] = await Promise.all([
    supabase
      .from('tickets')
      .select('id,ticket_ref,ticket_type,raiser_role,is_safeguarding,is_positive,priority,outcome_type,was_duplicate,message,status,created_at,teams(name)')
      .eq('coach_recipient_id', coachData.coach.id)
      .eq('is_safeguarding', false)
      .order('created_at', { ascending: false }),
    supabase
      .from('tickets')
      .select('id,ticket_ref,ticket_type,raiser_role,is_safeguarding,is_positive,priority,outcome_type,was_duplicate,message,status,created_at,teams(name)')
      .eq('raised_by', coachData.coach.id)
      .eq('raiser_role', 'coach')
      .order('created_at', { ascending: false })
  ]);
  const incoming = (incomingData ?? []) as TicketRow[];
  const raised = (raisedData ?? []) as TicketRow[];

  return (
    <main className="min-h-screen px-5 pb-24 pt-8 text-white md:ml-[260px]" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[760px]">
        <p className="text-xs uppercase tracking-[0.3em] text-white/30">Structured Tickets</p>
        <h1 className="mt-3 text-3xl font-black">Tickets</h1>
        {searchParams?.raised ? <p className="mt-5 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">Ticket raised. Reference: {searchParams.raised}</p> : null}
        <Link href="/dashboard/coach/tickets/new" className="mt-6 inline-flex rounded-full px-5 py-3 text-sm font-black text-black" style={{ backgroundColor: primaryColour }}>Raise a Ticket +</Link>

        <section className="mt-8">
          <h2 className="text-xl font-bold">Incoming</h2>
          <p className="mt-1 text-sm text-white/35">Parent tickets routed to you. Safeguarding tickets are handled by club admins only.</p>
          <div className="mt-4 space-y-3">
            {incoming.length === 0 ? <p className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 text-sm text-white/40">No incoming tickets.</p> : incoming.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} primaryColour={primaryColour} showActions />)}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold">Raised By Me</h2>
          <div className="mt-4 space-y-3">
            {raised.length === 0 ? <p className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 text-sm text-white/40">You have not raised any tickets.</p> : raised.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} primaryColour={primaryColour} showActions={false} />)}
          </div>
        </section>
      </div>
    </main>
  );
}

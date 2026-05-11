import Link from 'next/link';
import { redirect } from 'next/navigation';
import BottomNav from '@/components/mobile/BottomNav';
import { getParentDashboardData } from '@/lib/dashboard/getParentDashboardData';
import { createClient } from '@/lib/supabase/server';
import { PARENT_TICKET_TYPES, type TicketStatus, type TicketTypeDefinition } from '@/lib/tools/ticketTypes';

interface ParentTicketsPageProps {
  searchParams?: {
    raised?: string;
  };
}

interface TicketRow {
  id: string;
  ticket_ref: string | null;
  ticket_type: string;
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

function getTicketType(id: string): TicketTypeDefinition | null {
  return (PARENT_TICKET_TYPES as readonly TicketTypeDefinition[]).find((type) => type.id === id) ?? null;
}

function statusLabel(status: TicketStatus): string {
  if (status === 'in_progress') return 'In Progress';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function TicketCard({ ticket }: { ticket: TicketRow }) {
  const type = getTicketType(ticket.ticket_type);
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
        <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/55">{statusLabel(ticket.status)}</span>
      </div>
      {ticket.is_safeguarding ? <p className="mt-3 inline-flex rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-300">Safeguarding</p> : null}
      {ticket.message ? <p className="mt-3 line-clamp-2 text-sm italic text-white/40">{ticket.message}</p> : null}
    </article>
  );
}

export default async function ParentTicketsPage({ searchParams }: ParentTicketsPageProps) {
  const parentData = await getParentDashboardData();
  if (!parentData) redirect('/dashboard/parent');
  const supabase = await createClient();
  const { data: ticketsData } = await supabase
    .from('tickets')
    .select('id,ticket_ref,ticket_type,is_safeguarding,is_positive,priority,outcome_type,was_duplicate,message,status,created_at,teams(name)')
    .eq('raised_by', parentData.userId)
    .order('created_at', { ascending: false });
  const tickets = (ticketsData ?? []) as TicketRow[];
  const openTickets = tickets.filter((ticket) => ticket.status !== 'resolved');
  const pastTickets = tickets.filter((ticket) => ticket.status === 'resolved');
  const primaryColour = parentData.allSameClub ? parentData.globalPrimaryColour : '#f0f4ff';

  return (
    <main className="min-h-screen px-5 pb-24 pt-8 text-white" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[480px]">
        <p className="text-xs uppercase tracking-[0.3em] text-white/30">Structured Tickets</p>
        <h1 className="mt-3 text-3xl font-black">My Tickets</h1>
        {searchParams?.raised ? (
          <section className="mt-5 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            Ticket raised. Reference: {searchParams.raised}. {searchParams.raised === 'ticket' ? '' : 'You can track it here.'}
          </section>
        ) : null}

        <Link href="/dashboard/parent/tickets/new" className="mt-6 inline-flex w-full justify-center rounded-full px-5 py-4 text-sm font-black text-black" style={{ backgroundColor: primaryColour === '#080a0f' ? '#f0f4ff' : primaryColour }}>
          Raise a New Ticket +
        </Link>

        <section className="mt-8">
          <h2 className="text-xl font-bold">Open Tickets</h2>
          <div className="mt-4 space-y-3">
            {openTickets.length === 0 ? <p className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 text-sm text-white/40">No open tickets.</p> : openTickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)}
          </div>
        </section>

        <details className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <summary className="cursor-pointer text-sm font-semibold text-white/65">Past Tickets ({pastTickets.length})</summary>
          <div className="mt-4 space-y-3 opacity-75">
            {pastTickets.length === 0 ? <p className="text-sm text-white/35">No resolved tickets yet.</p> : pastTickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)}
          </div>
        </details>
      </div>
      <BottomNav primaryColour={primaryColour} items={[
        { href: '/dashboard/parent', label: 'Home', icon: 'H' },
        { href: '/dashboard/parent', label: 'Fixtures', icon: 'F' },
        { href: '/dashboard/parent', label: 'Avail', icon: 'A' },
        { href: '/dashboard/parent/tickets', label: 'Tickets', icon: 'T', badgeCount: openTickets.length },
        { href: '/dashboard/parent/settings', label: 'Settings', icon: 'S' }
      ]} />
    </main>
  );
}

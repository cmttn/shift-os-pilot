import Link from 'next/link';
import { redirect } from 'next/navigation';
import TicketStatusActions from '@/components/dashboard/TicketStatusActions';
import { getClubData } from '@/lib/dashboard/getClubData';
import { createClient } from '@/lib/supabase/server';
import { COACH_TICKET_TYPES, PARENT_TICKET_TYPES, type TicketStatus, type TicketTypeDefinition } from '@/lib/tools/ticketTypes';

interface TicketRow {
  id: string;
  ticket_ref: string | null;
  raised_by: string;
  raiser_role: 'parent' | 'coach';
  team_id: string;
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

function trafficForTeam(tickets: TicketRow[]): { light: 'green' | 'amber' | 'red'; label: string; openConcerns: number; positives: number } {
  const open = tickets.filter((ticket) => ticket.status !== 'resolved');
  const openConcerns = open.filter((ticket) => !ticket.is_positive && !ticket.is_safeguarding).length;
  const openSafeguarding = open.filter((ticket) => ticket.is_safeguarding).length;
  const duplicateOpen = open.filter((ticket) => ticket.was_duplicate).length;
  const since = Date.now() - 30 * 86400000;
  const positives = tickets.filter((ticket) => ticket.is_positive && ticket.created_at && new Date(ticket.created_at).valueOf() > since).length;
  if (openSafeguarding > 0) return { light: 'red', label: 'Safeguarding open', openConcerns, positives };
  if (openConcerns >= 3 || duplicateOpen > 0) return { light: 'red', label: `${openConcerns} urgent`, openConcerns, positives };
  if (openConcerns >= 1) return { light: 'amber', label: `${openConcerns} concerns`, openConcerns, positives };
  if (positives === 0) return { light: 'amber', label: 'No positives in 30 days', openConcerns, positives };
  return { light: 'green', label: `${positives} positive tickets this month`, openConcerns, positives };
}

function TicketCard({ ticket, primaryColour }: { ticket: TicketRow; primaryColour: string }) {
  const type = getTicketType(ticket.ticket_type, ticket.raiser_role);
  const team = getFirstRelation(ticket.teams);
  const border = ticket.is_safeguarding ? '#ef4444' : ticket.was_duplicate || ticket.priority === 'urgent' ? '#f59e0b' : ticket.is_positive ? '#10b981' : 'rgba(255,255,255,0.15)';
  return (
    <article className="rounded-2xl border p-4" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)', borderLeft: `3px solid ${border}` }}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            {ticket.priority === 'urgent' ? <span className="rounded-full bg-red-500 px-2 py-1 text-[10px] font-black text-white">URGENT</span> : null}
            {ticket.is_safeguarding ? <span className="rounded-full bg-red-500/15 px-2 py-1 text-[10px] font-black text-red-300">SAFEGUARDING</span> : null}
          </div>
          <p className="mt-2 text-xs text-white/30">{ticket.ticket_ref ?? 'TKT'} - {team?.name ?? 'Team'} - {formatDate(ticket.created_at)}</p>
          <h2 className="mt-2 text-base font-semibold text-white">{type?.emoji ?? '!'} {type?.label ?? ticket.ticket_type}</h2>
          <p className="mt-1 text-xs text-white/35">{ticket.raiser_role === 'coach' ? 'Coach raised' : 'Parent raised'} - {ticket.outcome_type === 'followup' ? 'Follow-up' : 'Log only'}</p>
        </div>
        <span className="w-fit rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/55">{ticket.status.replace('_', ' ')}</span>
      </div>
      {ticket.message ? <p className="mt-3 line-clamp-2 text-sm italic text-white/40">{ticket.message}</p> : null}
      {ticket.status !== 'resolved' ? <TicketStatusActions ticketId={ticket.id} currentStatus={ticket.status} actorRole="club_admin" primaryColour={primaryColour} /> : null}
    </article>
  );
}

export default async function ClubTicketsPage() {
  const clubData = await getClubData();
  if (!clubData) redirect('/onboarding');
  const supabase = await createClient();
  const { data: ticketsData } = await supabase
    .from('tickets')
    .select('id,ticket_ref,raised_by,raiser_role,team_id,ticket_type,is_safeguarding,is_positive,priority,outcome_type,was_duplicate,message,status,created_at,teams(name)')
    .eq('club_id', clubData.club.id)
    .order('created_at', { ascending: false });
  const tickets = (ticketsData ?? []) as TicketRow[];
  const open = tickets.filter((ticket) => ticket.status !== 'resolved');
  const urgent = open.filter((ticket) => ticket.priority === 'urgent' || ticket.is_safeguarding);
  const positive = tickets.filter((ticket) => ticket.is_positive);
  const resolved = tickets.filter((ticket) => ticket.status === 'resolved');

  return (
    <main className="min-h-screen px-5 pb-16 pt-10 text-white md:ml-[260px] md:px-8" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[920px]">
        <p className="text-xs uppercase tracking-[0.3em] text-white/30">Structured Conversations</p>
        <h1 className="mt-3 text-4xl font-black">Club Tickets</h1>
        <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ['Open', open.length],
            ['Urgent', urgent.length],
            ['Positive', positive.length],
            ['Resolved', resolved.length]
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border p-4" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="text-3xl font-black" style={{ color: clubData.club.primary_colour }}>{value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/35">{label}</p>
            </div>
          ))}
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold">Team Traffic Lights</h2>
          <div className="mt-4 space-y-2">
            {clubData.teams.map((team) => {
              const summary = trafficForTeam(tickets.filter((ticket) => ticket.team_id === team.id));
              const dot = summary.light === 'green' ? '#10b981' : summary.light === 'amber' ? '#f59e0b' : '#ef4444';
              return (
                <div key={team.id} className="flex items-center gap-4 rounded-2xl border p-4" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
                  <span className={`h-4 w-4 rounded-full ${summary.light === 'red' ? 'animate-pulse' : ''}`} style={{ backgroundColor: dot }} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">{team.name}</p>
                    <p className="text-xs text-white/35">{summary.openConcerns} open - {summary.positives} positive this month - {team.coach_name ?? 'No coach'}</p>
                  </div>
                  <p className="text-right text-sm text-white/55">{summary.label}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Full Ticket List</h2>
            <Link href="/dashboard/club/settings/recognition" className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70">Recognition Settings</Link>
          </div>
          <div className="mt-4 space-y-3">
            {tickets.length === 0 ? <p className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 text-sm text-white/40">No tickets raised yet.</p> : tickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} primaryColour={clubData.club.primary_colour} />)}
          </div>
        </section>
      </div>
    </main>
  );
}

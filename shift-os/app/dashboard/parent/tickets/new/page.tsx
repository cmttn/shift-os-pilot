'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PARENT_TICKET_TYPES, getTicketSeason, type TicketOutcome, type TicketTypeDefinition } from '@/lib/tools/ticketTypes';

interface ParentTicketTeam {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  clubId: string;
  clubName: string;
  primaryColour: string;
  coachUserId: string | null;
}

interface PlayerRow {
  id: string;
  team_id: string | null;
  first_name: string | null;
  last_name: string | null;
}

interface TeamRow {
  id: string;
  name: string;
  club_id: string | null;
  clubs?: { id: string; name: string | null; primary_colour: string | null } | Array<{ id: string; name: string | null; primary_colour: string | null }> | null;
}

interface CoachRow {
  team_id: string;
  user_id: string;
}

interface DuplicateTicketRow {
  created_at: string | null;
}

interface TicketInsertResult {
  id: string;
  ticket_ref: string | null;
}

interface RecognitionSettingsRow {
  bronze_threshold: number | null;
  silver_threshold: number | null;
  gold_threshold: number | null;
}

interface RecognitionTotalRow {
  id: string;
  positive_ticket_count: number | null;
}

function getFirstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function getFullName(player: PlayerRow): string {
  return [player.first_name, player.last_name].map((part) => part?.trim()).filter(Boolean).join(' ') || 'Player';
}

function getContrast(hexColour: string): string {
  const hex = hexColour.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#000000' : '#ffffff';
}

function getTier(count: number, settings: RecognitionSettingsRow | null): 'none' | 'bronze' | 'silver' | 'gold' {
  const bronze = settings?.bronze_threshold ?? 5;
  const silver = settings?.silver_threshold ?? 15;
  const gold = settings?.gold_threshold ?? 30;
  if (count >= gold) return 'gold';
  if (count >= silver) return 'silver';
  if (count >= bronze) return 'bronze';
  return 'none';
}

export default function NewParentTicketPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<ParentTicketTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<'coach' | 'club'>('coach');
  const [outcome, setOutcome] = useState<TicketOutcome>('log_only');
  const [message, setMessage] = useState('');
  const [duplicateDate, setDuplicateDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTeam = teams.find((team) => team.teamId === selectedTeamId) ?? teams[0] ?? null;
  const selectedType = (PARENT_TICKET_TYPES as readonly TicketTypeDefinition[]).find((type) => type.id === selectedTypeId) ?? null;
  const primaryColour = selectedTeam?.primaryColour ?? '#00C851';
  const contrast = getContrast(primaryColour);
  const duplicateActive = Boolean(duplicateDate && selectedType && !selectedType.is_positive);
  const forcedFollowUp = Boolean(selectedType && (selectedType.is_safeguarding || !selectedType.can_log_only || duplicateActive));
  const resolvedRoutes = useMemo(() => {
    if (!selectedType) return [] as Array<'coach' | 'club'>;
    if (selectedType.is_safeguarding) return ['club'];
    if (selectedType.routes_to.includes('choice')) return [selectedRoute];
    return selectedType.routes_to.filter((route): route is 'coach' | 'club' => route === 'coach' || route === 'club');
  }, [selectedRoute, selectedType]);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        router.push('/auth/login');
        return;
      }
      const { data: playersData } = await supabase.from('players').select('id,team_id,first_name,last_name').or(`parent_user_id.eq.${user.id},co_parent_user_id.eq.${user.id}`).eq('is_active', true);
      const players = (playersData ?? []) as PlayerRow[];
      const teamIds = Array.from(new Set(players.map((player) => player.team_id).filter((id): id is string => Boolean(id))));
      const [{ data: teamsData }, { data: coachData }] = await Promise.all([
        teamIds.length > 0 ? supabase.from('teams').select('id,name,club_id,clubs(id,name,primary_colour)').in('id', teamIds) : Promise.resolve({ data: [] as TeamRow[] }),
        teamIds.length > 0 ? supabase.from('team_coaches').select('team_id,user_id').in('team_id', teamIds).eq('is_lead', true) : Promise.resolve({ data: [] as CoachRow[] })
      ]);
      const teamRows = (teamsData ?? []) as TeamRow[];
      const coachRows = (coachData ?? []) as CoachRow[];
      const mapped = players.flatMap((player) => {
        const team = teamRows.find((item) => item.id === player.team_id);
        if (!team || !team.club_id) return [];
        const club = getFirstRelation(team.clubs);
        return [{
          playerId: player.id,
          playerName: getFullName(player),
          teamId: team.id,
          teamName: team.name,
          clubId: team.club_id,
          clubName: club?.name ?? 'Club',
          primaryColour: club?.primary_colour ?? '#00C851',
          coachUserId: coachRows.find((coach) => coach.team_id === team.id)?.user_id ?? null
        }];
      });
      setTeams(mapped);
      setSelectedTeamId(mapped[0]?.teamId ?? '');
      setLoading(false);
    }
    void loadData();
  }, [router]);

  useEffect(() => {
    async function checkDuplicate() {
      setDuplicateDate(null);
      if (!selectedType || !selectedTeam || selectedType.is_positive) return;
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const since = new Date(Date.now() - 90 * 86400000).toISOString();
      const { data } = await supabase
        .from('tickets')
        .select('created_at')
        .eq('raised_by', userData.user.id)
        .eq('ticket_type', selectedType.id)
        .eq('team_id', selectedTeam.teamId)
        .eq('is_positive', false)
        .gt('created_at', since)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle<DuplicateTicketRow>();
      setDuplicateDate(data?.created_at ?? null);
    }
    void checkDuplicate();
  }, [selectedTeam, selectedType]);

  useEffect(() => {
    if (!selectedType) return;
    if (forcedFollowUp) {
      setOutcome('followup');
      return;
    }
    setOutcome(selectedType.default_outcome);
  }, [forcedFollowUp, selectedType]);

  async function updateRecognition(team: ParentTicketTeam, userId: string) {
    if (!team.coachUserId) return;
    const supabase = createClient();
    const season = getTicketSeason();
    const [{ data: settings }, { data: total }] = await Promise.all([
      supabase.from('coach_recognition_settings').select('bronze_threshold,silver_threshold,gold_threshold').eq('club_id', team.clubId).maybeSingle<RecognitionSettingsRow>(),
      supabase.from('coach_recognition_totals').select('id,positive_ticket_count').eq('coach_user_id', team.coachUserId).eq('team_id', team.teamId).eq('season', season).maybeSingle<RecognitionTotalRow>()
    ]);
    const nextCount = (total?.positive_ticket_count ?? 0) + 1;
    const currentTier = getTier(nextCount, settings ?? null);
    if (total?.id) {
      await supabase.from('coach_recognition_totals').update({ positive_ticket_count: nextCount, current_tier: currentTier, updated_at: new Date().toISOString() }).eq('id', total.id);
      return;
    }
    await supabase.from('coach_recognition_totals').insert({
      coach_user_id: team.coachUserId,
      team_id: team.teamId,
      club_id: team.clubId,
      season,
      positive_ticket_count: nextCount,
      current_tier: currentTier,
      updated_at: new Date().toISOString()
    });
  }

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
    const coachRecipient = resolvedRoutes.includes('coach') && !selectedType.is_safeguarding ? selectedTeam.coachUserId : null;
    const { data: ticket, error: insertError } = await supabase
      .from('tickets')
      .insert({
        raised_by: user.id,
        raiser_role: 'parent',
        team_id: selectedTeam.teamId,
        club_id: selectedTeam.clubId,
        ticket_type: selectedType.id,
        is_safeguarding: selectedType.is_safeguarding,
        is_positive: selectedType.is_positive,
        priority: selectedType.is_safeguarding ? 'urgent' : selectedType.priority,
        outcome_type: forcedFollowUp ? 'followup' : outcome,
        was_duplicate: duplicateActive,
        routes_to: resolvedRoutes,
        coach_recipient_id: coachRecipient,
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
    await supabase.from('ticket_events').insert({ ticket_id: ticket.id, event_type: 'created', actor_id: user.id, actor_role: 'parent', note: 'Ticket created' });
    if (selectedType.is_positive && resolvedRoutes.includes('coach')) {
      await updateRecognition(selectedTeam, user.id);
    }
    const title = selectedType.is_safeguarding ? 'URGENT - Safeguarding Ticket' : selectedType.is_positive ? 'Positive Ticket Raised' : 'Ticket Raised';
    const body = `${selectedType.label} raised for ${selectedTeam.teamName}`;
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: ticket.id,
        team_id: selectedTeam.teamId,
        club_id: selectedTeam.clubId,
        audience: selectedType.is_safeguarding || resolvedRoutes.includes('club') ? 'club_admins' : 'coaches',
        title,
        message: body
      })
    });
    router.push(`/dashboard/parent/tickets?raised=${encodeURIComponent(ticket.ticket_ref ?? 'ticket')}`);
  }

  if (loading) {
    return <main className="min-h-screen px-5 py-10 text-white" style={{ backgroundColor: '#080a0f' }}>Loading tickets...</main>;
  }

  return (
    <main className="min-h-screen px-5 pb-24 pt-8 text-white" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[480px]">
        <Link href="/dashboard/parent/tickets" className="text-sm text-white/40">Back to tickets</Link>
        <h1 className="mt-5 text-3xl font-black">What would you like to raise?</h1>
        <p className="mt-2 text-sm text-white/40">Tickets create a structured flag for follow-up outside the app.</p>

        {teams.length > 1 ? (
          <section className="mt-5 rounded-2xl border p-4" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <label className="text-xs uppercase tracking-[0.24em] text-white/35" htmlFor="team">Team</label>
            <select id="team" value={selectedTeamId} onChange={(event) => setSelectedTeamId(event.target.value)} className="mt-3 w-full rounded-xl border bg-white/[0.04] p-3 text-white" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              {teams.map((team) => <option key={`${team.playerId}-${team.teamId}`} value={team.teamId}>{team.playerName} - {team.teamName}</option>)}
            </select>
          </section>
        ) : null}

        <section className="mt-6 grid grid-cols-2 gap-3">
          {(PARENT_TICKET_TYPES as readonly TicketTypeDefinition[]).map((type) => {
            const selected = type.id === selectedTypeId;
            const borderColour = type.is_safeguarding ? '#ef4444' : type.is_positive ? '#10b981' : 'rgba(255,255,255,0.08)';
            return (
              <button key={type.id} type="button" onClick={() => setSelectedTypeId(type.id)} className="rounded-2xl border p-4 text-left transition-all duration-300 ease-out hover:-translate-y-0.5" style={{ backgroundColor: selected ? `${primaryColour}18` : type.is_positive ? 'rgba(16,185,129,0.08)' : type.is_safeguarding ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)', borderColor: selected ? primaryColour : borderColour }}>
                <span className="text-2xl">{type.emoji}</span>
                <span className="mt-3 block text-sm font-semibold text-white">{type.label}</span>
                <span className="mt-2 block text-xs text-white/40">{type.description}</span>
                {type.is_safeguarding ? <span className="mt-3 inline-flex rounded-full bg-red-500/15 px-2 py-1 text-[10px] font-bold uppercase text-red-300">Confidential</span> : null}
              </button>
            );
          })}
        </section>

        {selectedType?.routes_to.includes('choice') ? (
          <section className="mt-6 rounded-2xl border p-5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="text-lg font-bold">Who would you like to contact?</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {(['coach', 'club'] as const).map((route) => (
                <button key={route} type="button" onClick={() => setSelectedRoute(route)} className="rounded-full px-4 py-3 text-sm font-bold" style={selectedRoute === route ? { backgroundColor: primaryColour, color: contrast } : { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)' }}>{route === 'coach' ? 'My Coach' : 'Club Admin'}</button>
              ))}
            </div>
          </section>
        ) : null}

        {duplicateDate ? (
          <section className="mt-6 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-100">
            You raised this concern on {new Date(duplicateDate).toLocaleDateString('en-GB')}. This now requires a follow-up.
          </section>
        ) : null}

        {selectedType ? (
          <section className="mt-6 rounded-2xl border p-5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="text-lg font-bold">What would you like to happen?</h2>
            <div className="mt-4 space-y-3">
              {selectedType.can_log_only && !duplicateActive && !selectedType.is_safeguarding ? (
                <button type="button" onClick={() => setOutcome('log_only')} className="w-full rounded-2xl border p-4 text-left" style={{ borderColor: outcome === 'log_only' ? primaryColour : 'rgba(255,255,255,0.08)', backgroundColor: outcome === 'log_only' ? `${primaryColour}14` : 'rgba(255,255,255,0.03)' }}>
                  <span className="font-semibold">Log Only</span>
                  <span className="mt-1 block text-xs text-white/40">Record privately. No follow-up needed.</span>
                </button>
              ) : null}
              <button type="button" onClick={() => setOutcome('followup')} className="w-full rounded-2xl border p-4 text-left" style={{ borderColor: outcome === 'followup' ? primaryColour : 'rgba(255,255,255,0.08)', backgroundColor: outcome === 'followup' ? `${primaryColour}14` : 'rgba(255,255,255,0.03)' }}>
                <span className="font-semibold">Request Follow-up</span>
                <span className="mt-1 block text-xs text-white/40">{selectedType.is_safeguarding ? 'This concern always requires a follow-up for your safety.' : 'Someone will contact you outside the app.'}</span>
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
        <button type="button" disabled={!selectedType || !selectedTeam || submitting} onClick={() => void submitTicket()} className="mt-6 w-full rounded-full px-5 py-4 text-sm font-black transition-all duration-300 ease-out disabled:opacity-40" style={{ backgroundColor: primaryColour, color: contrast }}>
          {submitting ? 'Raising ticket...' : 'Raise Ticket'}
        </button>
      </div>
    </main>
  );
}

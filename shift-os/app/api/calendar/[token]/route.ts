import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

interface CalendarRouteProps {
  params: {
    token: string;
  };
}

interface CalendarUserRow {
  id: string;
  user_id: string | null;
  full_name: string | null;
  system_role: string | null;
  intended_role: string | null;
  calendar_include_pending: boolean | null;
  calendar_include_training: boolean | null;
  calendar_include_tournaments: boolean | null;
}

interface PlayerRow {
  id: string;
  team_id: string | null;
  first_name: string | null;
}

interface FamilyRow {
  player_id: string;
}

interface TeamRow {
  id: string;
  name: string;
}

interface SessionRow {
  id: string;
  team_id: string;
  type: string;
  title: string | null;
  opponent: string | null;
  session_date: string;
  location: string | null;
  full_address: string | null;
  postcode: string | null;
  coach_notes: string | null;
  opposition_contact_name: string | null;
  opposition_contact_phone: string | null;
}

interface PollResponseRow {
  session_id: string;
  player_id: string;
  status: string | null;
}

interface TeamCoachRow {
  team_id: string;
}

interface CalendarEvent {
  session: SessionRow;
  teamName: string;
  playerName: string | null;
  viewPath: string;
}

function toICalDate(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
}

function escapeICal(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\r?\n/g, '\\n');
}

function durationMinutes(type: string): number {
  if (type === 'match') return 90;
  if (type === 'tournament') return 240;
  return 60;
}

function eventTitle(event: CalendarEvent, multiplePlayers: boolean): string {
  const { session, teamName, playerName } = event;
  const suffix = multiplePlayers && playerName ? ` | ${playerName}` : '';
  if (session.type === 'match') return `${teamName} v ${session.opponent ?? 'Opponent TBC'}${suffix}`;
  if (session.type === 'tournament') return `${teamName} Tournament${session.opponent ? ` - ${session.opponent}` : ''}${suffix}`;
  return `${teamName} Training${suffix}`;
}

function address(session: SessionRow): string {
  if (session.full_address) {
    return session.postcode && !session.full_address.includes(session.postcode)
      ? `${session.full_address}, ${session.postcode}`
      : session.full_address;
  }
  return session.location ?? '';
}

function description(event: CalendarEvent, origin: string): string {
  const { session } = event;
  const date = new Date(session.session_date);
  const lines = [
    `${session.type.charAt(0).toUpperCase()}${session.type.slice(1)} - ${date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}`,
    `KO/Start: ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
    address(session),
    [session.opposition_contact_name, session.opposition_contact_phone].filter(Boolean).join(' - '),
    session.coach_notes ? session.coach_notes.slice(0, 200) : '',
    '',
    `View on SHIFT OS: ${origin}${event.viewPath}`
  ];
  return lines.filter((line, index) => index === 5 || line.length > 0).join('\n');
}

function buildCalendar(name: string, events: CalendarEvent[], origin: string, multiplePlayers: boolean): string {
  const now = toICalDate(new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SHIFT OS//Football Calendar//EN',
    `X-WR-CALNAME:${escapeICal(`SHIFT OS - ${name}`)}`,
    'X-WR-CALDESC:Football fixtures and sessions from SHIFT OS',
    'X-WR-TIMEZONE:Europe/London',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  events.forEach((event) => {
    const start = new Date(event.session.session_date);
    const end = new Date(start.getTime() + durationMinutes(event.session.type) * 60000);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.session.id}${event.playerName ? `-${event.playerName.replace(/\s+/g, '-').toLowerCase()}` : ''}@shiftos.co.uk`,
      `DTSTAMP:${now}`,
      `DTSTART:${toICalDate(start)}`,
      `DTEND:${toICalDate(end)}`,
      `SUMMARY:${escapeICal(eventTitle(event, multiplePlayers))}`,
      `LOCATION:${escapeICal(address(event.session))}`,
      `DESCRIPTION:${escapeICal(description(event, origin))}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

async function getTeams(teamIds: string[]): Promise<Map<string, TeamRow>> {
  const supabase = createServiceClient();
  const { data } = teamIds.length > 0
    ? await supabase.from('teams').select('id,name').in('id', teamIds)
    : { data: [] as TeamRow[] };
  return new Map(((data ?? []) as TeamRow[]).map((team) => [team.id, team]));
}

async function buildParentEvents(user: CalendarUserRow): Promise<{ name: string; events: CalendarEvent[]; multiplePlayers: boolean }> {
  const supabase = createServiceClient();
  const userId = user.user_id ?? user.id;
  const { data: playersData } = await supabase
    .from('players')
    .select('id,team_id,first_name')
    .or(`parent_user_id.eq.${userId},co_parent_user_id.eq.${userId}`)
    .eq('is_active', true);
  const players = (playersData ?? []) as PlayerRow[];
  const teamIds = Array.from(new Set(players.map((player) => player.team_id).filter((teamId): teamId is string => Boolean(teamId))));
  const teamMap = await getTeams(teamIds);
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: sessionsData } = teamIds.length > 0
    ? await supabase.from('sessions').select('id,team_id,type,title,opponent,session_date,location,full_address,postcode,coach_notes,opposition_contact_name,opposition_contact_phone').in('team_id', teamIds).eq('is_active', true).gt('session_date', since).order('session_date', { ascending: true })
    : { data: [] as SessionRow[] };
  const sessions = (sessionsData ?? []) as SessionRow[];
  const { data: responsesData } = sessions.length > 0
    ? await supabase.from('poll_responses').select('session_id,player_id,status').in('session_id', sessions.map((session) => session.id)).in('player_id', players.map((player) => player.id))
    : { data: [] as PollResponseRow[] };
  const responses = (responsesData ?? []) as PollResponseRow[];
  const includeTraining = user.calendar_include_training ?? true;
  const includeTournaments = user.calendar_include_tournaments ?? true;
  const includePending = user.calendar_include_pending ?? false;

  const events = players.flatMap((player) => sessions
    .filter((session) => session.team_id === player.team_id)
    .filter((session) => {
      const status = responses.find((response) => response.session_id === session.id && response.player_id === player.id)?.status ?? 'pending';
      if (session.type === 'training') return includeTraining;
      if (session.type === 'tournament') return includeTournaments;
      if (session.type === 'match' && status === 'available') return true;
      return session.type === 'match' && status === 'pending' && includePending;
    })
    .map((session) => ({
      session,
      teamName: teamMap.get(session.team_id)?.name ?? 'Team',
      playerName: player.first_name ?? 'Player',
      viewPath: `/dashboard/parent/player/${player.id}/team/${player.team_id}`
    })));

  return { name: players.length > 1 ? 'Family Football' : players[0]?.first_name ?? 'Football', events, multiplePlayers: players.length > 1 };
}

async function buildFamilyEvents(user: CalendarUserRow): Promise<{ name: string; events: CalendarEvent[]; multiplePlayers: boolean }> {
  const supabase = createServiceClient();
  const userId = user.user_id ?? user.id;
  const { data: familyData } = await supabase.from('football_family').select('player_id').eq('family_user_id', userId).eq('status', 'active');
  const familyRows = (familyData ?? []) as FamilyRow[];
  const playerIds = familyRows.map((row) => row.player_id);
  const { data: playersData } = playerIds.length > 0
    ? await supabase.from('players').select('id,team_id,first_name').in('id', playerIds).eq('is_active', true)
    : { data: [] as PlayerRow[] };
  const players = (playersData ?? []) as PlayerRow[];
  const teamIds = Array.from(new Set(players.map((player) => player.team_id).filter((teamId): teamId is string => Boolean(teamId))));
  const teamMap = await getTeams(teamIds);
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: sessionsData } = teamIds.length > 0
    ? await supabase.from('sessions').select('id,team_id,type,title,opponent,session_date,location,full_address,postcode,coach_notes,opposition_contact_name,opposition_contact_phone').in('team_id', teamIds).eq('is_active', true).gt('session_date', since).order('session_date', { ascending: true })
    : { data: [] as SessionRow[] };
  const sessions = (sessionsData ?? []) as SessionRow[];
  const { data: responsesData } = sessions.length > 0
    ? await supabase.from('poll_responses').select('session_id,player_id,status').in('session_id', sessions.map((session) => session.id)).in('player_id', players.map((player) => player.id)).eq('status', 'available')
    : { data: [] as PollResponseRow[] };
  const responses = (responsesData ?? []) as PollResponseRow[];

  const events = players.flatMap((player) => sessions
    .filter((session) => session.team_id === player.team_id)
    .filter((session) => responses.some((response) => response.session_id === session.id && response.player_id === player.id))
    .map((session) => ({
      session,
      teamName: teamMap.get(session.team_id)?.name ?? 'Team',
      playerName: player.first_name ?? 'Player',
      viewPath: `/dashboard/family/player/${player.id}`
    })));

  return { name: players.length > 1 ? 'Football Family' : players[0]?.first_name ?? 'Football Family', events, multiplePlayers: players.length > 1 };
}

async function buildCoachEvents(user: CalendarUserRow): Promise<{ name: string; events: CalendarEvent[]; multiplePlayers: boolean }> {
  const supabase = createServiceClient();
  const userId = user.user_id ?? user.id;
  const { data: teamCoachData } = await supabase.from('team_coaches').select('team_id').eq('user_id', userId);
  const teamIds = ((teamCoachData ?? []) as TeamCoachRow[]).map((row) => row.team_id);
  const teamMap = await getTeams(teamIds);
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: sessionsData } = teamIds.length > 0
    ? await supabase.from('sessions').select('id,team_id,type,title,opponent,session_date,location,full_address,postcode,coach_notes,opposition_contact_name,opposition_contact_phone').in('team_id', teamIds).eq('is_active', true).gt('session_date', since).order('session_date', { ascending: true })
    : { data: [] as SessionRow[] };
  const events = ((sessionsData ?? []) as SessionRow[]).map((session) => ({
    session,
    teamName: teamMap.get(session.team_id)?.name ?? 'Team',
    playerName: null,
    viewPath: `/dashboard/coach/sessions/${session.id}`
  }));
  return { name: teamIds.length > 1 ? 'Coach Teams' : teamMap.get(teamIds[0] ?? '')?.name ?? 'Coach Calendar', events, multiplePlayers: false };
}

export async function GET(_request: Request, { params }: CalendarRouteProps) {
  const supabase = createServiceClient();
  const { data: user } = await supabase
    .from('users_profile')
    .select('id,user_id,full_name,system_role,intended_role,calendar_include_pending,calendar_include_training,calendar_include_tournaments')
    .eq('calendar_token', params.token)
    .eq('calendar_sync_enabled', true)
    .maybeSingle<CalendarUserRow>();

  if (!user) {
    return new NextResponse('Calendar feed not found or disabled', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  const role = user.system_role ?? user.intended_role ?? '';
  const userId = user.user_id ?? user.id;
  const [{ data: coachRows }, { data: parentRows }, { data: familyRows }] = await Promise.all([
    supabase.from('team_coaches').select('team_id').eq('user_id', userId).limit(1),
    supabase.from('players').select('id').or(`parent_user_id.eq.${userId},co_parent_user_id.eq.${userId}`).limit(1),
    supabase.from('football_family').select('id').eq('family_user_id', userId).eq('status', 'active').limit(1)
  ]);

  const feed = role === 'coach' || (coachRows ?? []).length > 0
    ? await buildCoachEvents(user)
    : role === 'family' || (familyRows ?? []).length > 0
      ? await buildFamilyEvents(user)
      : await buildParentEvents(user);

  if ((parentRows ?? []).length > 0 && role === 'parent') {
    const parentFeed = await buildParentEvents(user);
    const ics = buildCalendar(parentFeed.name, parentFeed.events, 'https://shiftos.co.uk', parentFeed.multiplePlayers);
    return new NextResponse(ics, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="shiftos.ics"'
      }
    });
  }

  const ics = buildCalendar(feed.name, feed.events, 'https://shiftos.co.uk', feed.multiplePlayers);
  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="shiftos.ics"'
    }
  });
}

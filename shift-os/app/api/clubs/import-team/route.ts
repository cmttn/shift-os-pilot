import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server';

interface ImportPayload {
  club_import_token: string;
  club_id: string;
}

interface TeamLookupRow {
  id: string;
  name: string;
  age_group: string | null;
  gender: string | null;
  season: string | null;
  club_id: string | null;
  primary_colour: string | null;
  secondary_colour: string | null;
  badge_url: string | null;
}

interface ClubRow {
  id: string;
  name: string;
  badge_url: string | null;
  primary_colour: string | null;
  secondary_colour: string | null;
  allow_team_colours: boolean | null;
  allow_team_badges: boolean | null;
}

interface TeamCoachRow {
  user_id: string;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
}

interface PlayerCountRow {
  id: string;
}

interface ExistingMembershipRow {
  user_id: string;
}

function isImportPayload(value: unknown): value is ImportPayload {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.club_import_token === 'string' && typeof record.club_id === 'string';
}

async function ensureClubAdmin(clubId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return false;

  const { data: membership } = await supabase
    .from('club_members')
    .select('id')
    .eq('club_id', clubId)
    .eq('user_id', userId)
    .in('club_role', ['admin', 'club_admin', 'shift_admin'])
    .maybeSingle<{ id: string }>();

  return Boolean(membership);
}

async function fetchImportPreview(token: string, clubId: string) {
  if (!(await ensureClubAdmin(clubId))) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
  }

  const supabase = createServiceClient();
  const cleanToken = token.trim().toUpperCase();
  const [{ data: team }, { data: club }] = await Promise.all([
    supabase
      .from('teams')
      .select('id,name,age_group,gender,season,club_id,primary_colour,secondary_colour,badge_url')
      .eq('club_import_token', cleanToken)
      .maybeSingle<TeamLookupRow>(),
    supabase
      .from('clubs')
      .select('id,name,badge_url,primary_colour,secondary_colour,allow_team_colours,allow_team_badges')
      .eq('id', clubId)
      .maybeSingle<ClubRow>()
  ]);

  if (!club) return NextResponse.json({ error: 'Club not found' }, { status: 404 });
  if (!team) return NextResponse.json({ error: 'No team found with that code.' }, { status: 404 });

  const [{ data: coaches }, { data: players }] = await Promise.all([
    supabase.from('team_coaches').select('user_id').eq('team_id', team.id),
    supabase.from('players').select('id').eq('team_id', team.id).eq('is_active', true)
  ]);

  const coachRows = (coaches ?? []) as TeamCoachRow[];
  const coachIds = coachRows.map((coach) => coach.user_id);
  const { data: coachProfiles } = coachIds.length > 0
    ? await supabase.from('users_profile').select('id,full_name').in('id', coachIds)
    : { data: [] as ProfileRow[] };
  const firstCoach = ((coachProfiles ?? []) as ProfileRow[])[0] ?? null;

  return NextResponse.json({
    team: {
      ...team,
      coach_name: firstCoach?.full_name ?? null,
      player_count: ((players ?? []) as PlayerCountRow[]).length
    },
    club
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const clubId = url.searchParams.get('clubId');
  if (!token || !clubId) return NextResponse.json({ error: 'Missing token or clubId' }, { status: 400 });
  return fetchImportPreview(token, clubId);
}

export async function POST(request: Request) {
  const payload: unknown = await request.json();
  if (!isImportPayload(payload)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (!(await ensureClubAdmin(payload.club_id))) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
  }

  const supabase = createServiceClient();
  const cleanToken = payload.club_import_token.trim().toUpperCase();
  const [{ data: team }, { data: club }] = await Promise.all([
    supabase
      .from('teams')
      .select('id,name,club_id')
      .eq('club_import_token', cleanToken)
      .maybeSingle<{ id: string; name: string; club_id: string | null }>(),
    supabase
      .from('clubs')
      .select('id,name,allow_team_colours,allow_team_badges')
      .eq('id', payload.club_id)
      .maybeSingle<{ id: string; name: string; allow_team_colours: boolean | null; allow_team_badges: boolean | null }>()
  ]);

  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  if (!club) return NextResponse.json({ error: 'Club not found' }, { status: 404 });
  if (team.club_id) return NextResponse.json({ error: 'This team is already linked to a club' }, { status: 400 });

  const updateValues: {
    club_id: string;
    club_import_status: 'linked';
    primary_colour?: null;
    secondary_colour?: null;
    badge_url?: null;
  } = {
    club_id: payload.club_id,
    club_import_status: 'linked'
  };

  if (!club.allow_team_colours) {
    updateValues.primary_colour = null;
    updateValues.secondary_colour = null;
  }

  if (!club.allow_team_badges) {
    updateValues.badge_url = null;
  }

  const { error: updateError } = await supabase
    .from('teams')
    .update(updateValues)
    .eq('id', team.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { data: coaches } = await supabase.from('team_coaches').select('user_id').eq('team_id', team.id);
  const coachIds = ((coaches ?? []) as TeamCoachRow[]).map((coach) => coach.user_id);

  if (coachIds.length > 0) {
    const { data: existingMemberships } = await supabase
      .from('club_members')
      .select('user_id')
      .eq('club_id', payload.club_id)
      .in('user_id', coachIds);
    const existingIds = new Set(((existingMemberships ?? []) as ExistingMembershipRow[]).map((membership) => membership.user_id));
    const missingRows = coachIds
      .filter((coachId) => !existingIds.has(coachId))
      .map((coachId) => ({ club_id: payload.club_id, user_id: coachId, club_role: 'coach', is_active: true }));

    if (missingRows.length > 0) {
      await supabase.from('club_members').insert(missingRows);
    }
  }

  await fetch(new URL('/api/notify', request.url), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: team.id,
      team_id: team.id,
      club_id: payload.club_id,
      audience: 'coaches',
      title: 'Your team has been linked!',
      message: `${team.name} has been linked to ${club.name} on SHIFT OS.`
    })
  }).catch(() => undefined);

  return NextResponse.json({ success: true, team_name: team.name, club_name: club.name });
}

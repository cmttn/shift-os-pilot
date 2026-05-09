import type { SupabaseClient } from '@supabase/supabase-js';

type InviteRole = 'coach' | 'parent' | 'admin';

interface PendingInviteRecord {
  id: string;
  club_id: string;
  team_id: string | null;
  player_id: string | null;
  invite_token: string;
  role: InviteRole;
  invitee_email: string;
  is_lead: boolean | null;
  status: string | null;
}

interface InviteMetadata {
  invite_token?: string;
  intended_role?: string;
  club_id?: string;
  team_id?: string;
  player_id?: string;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

export function readInviteMetadata(metadata: Record<string, unknown>): InviteMetadata {
  return {
    invite_token: readString(metadata.invite_token),
    intended_role: readString(metadata.intended_role),
    club_id: readString(metadata.club_id),
    team_id: readString(metadata.team_id),
    player_id: readString(metadata.player_id)
  };
}

async function ensureClubMembership(supabase: SupabaseClient, userId: string, clubId: string, clubRole: 'coach' | 'parent' | 'admin'): Promise<void> {
  const { data: existing } = await supabase
    .from('club_members')
    .select('id')
    .eq('user_id', userId)
    .eq('club_id', clubId)
    .eq('club_role', clubRole)
    .maybeSingle<{ id: string }>();

  if (existing) return;

  const { error } = await supabase.from('club_members').insert({
    club_id: clubId,
    user_id: userId,
    club_role: clubRole,
    is_active: true
  });
  if (error) throw error;
}

async function ensureTeamCoach(supabase: SupabaseClient, userId: string, teamId: string, isLead: boolean): Promise<void> {
  const { data: existing } = await supabase
    .from('team_coaches')
    .select('id')
    .eq('user_id', userId)
    .eq('team_id', teamId)
    .maybeSingle<{ id: string }>();

  if (existing) return;

  const { error } = await supabase.from('team_coaches').insert({
    team_id: teamId,
    user_id: userId,
    is_lead: isLead
  });
  if (error) throw error;
}

export async function completePendingInvite(supabase: SupabaseClient, userId: string, metadata: Record<string, unknown>): Promise<string | null> {
  const inviteMetadata = readInviteMetadata(metadata);
  if (!inviteMetadata.invite_token) return null;

  const { data, error } = await supabase
    .from('pending_invites')
    .select('id,club_id,team_id,player_id,invite_token,role,invitee_email,is_lead,status')
    .eq('invite_token', inviteMetadata.invite_token)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle<PendingInviteRecord>();

  if (error) throw error;
  if (!data) return null;

  if (data.role === 'coach' && data.team_id) {
    await ensureClubMembership(supabase, userId, data.club_id, 'coach');
    await ensureTeamCoach(supabase, userId, data.team_id, data.is_lead ?? true);
  }

  if (data.role === 'parent') {
    await ensureClubMembership(supabase, userId, data.club_id, 'parent');
  }

  const { error: updateError } = await supabase
    .from('pending_invites')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', data.id);
  if (updateError) throw updateError;

  if (data.role === 'coach') return '/dashboard/coach';
  if (data.role === 'parent') return '/dashboard/parent/player';
  return '/dashboard';
}

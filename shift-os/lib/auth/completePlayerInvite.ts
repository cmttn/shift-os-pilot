import type { SupabaseClient } from '@supabase/supabase-js';

interface PlayerInviteRecord {
  id: string;
  parent_user_id: string | null;
  team_id: string | null;
  invite_status: string | null;
  teams?: {
    club_id: string | null;
  } | Array<{
    club_id: string | null;
  }> | null;
}

function getFirstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

async function ensureParentMembership(supabase: SupabaseClient, userId: string, clubId: string): Promise<void> {
  const { data: existing } = await supabase
    .from('club_members')
    .select('id')
    .eq('user_id', userId)
    .eq('club_id', clubId)
    .eq('club_role', 'parent')
    .maybeSingle<{ id: string }>();

  if (existing) return;

  const { error } = await supabase.from('club_members').insert({
    club_id: clubId,
    user_id: userId,
    club_role: 'parent',
    is_active: true
  });

  if (error) throw error;
}

export async function completePlayerInvite(supabase: SupabaseClient, userId: string, inviteToken: string | null): Promise<string | null> {
  const token = inviteToken?.trim();
  if (!token) return null;

  const { data, error } = await supabase
    .from('players')
    .select('id,parent_user_id,team_id,invite_status,teams(club_id)')
    .eq('invite_token', token)
    .neq('invite_status', 'accepted')
    .maybeSingle<PlayerInviteRecord>();

  if (error) throw error;
  if (!data) return null;

  if (data.parent_user_id && data.parent_user_id !== userId) {
    return '/dashboard/parent?invite_error=already_linked';
  }

  const team = getFirstRelation(data.teams);
  if (team?.club_id) {
    await ensureParentMembership(supabase, userId, team.club_id);
  }

  if (!data.parent_user_id) {
    const { error: updateError } = await supabase
      .from('players')
      .update({
        parent_user_id: userId,
        invite_status: 'accepted',
        invite_accepted_at: new Date().toISOString()
      })
      .eq('id', data.id);

    if (updateError) throw updateError;
  }

  return `/invite/player/${encodeURIComponent(token)}/complete`;
}

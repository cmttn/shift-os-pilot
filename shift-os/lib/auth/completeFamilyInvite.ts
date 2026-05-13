import type { SupabaseClient } from '@supabase/supabase-js';

interface FamilyInviteRow {
  id: string;
  player_id: string;
  invited_by: string;
  relationship: string | null;
  status: string | null;
  expires_at: string | null;
}

function isExpired(value: string | null): boolean {
  if (!value) return false;
  const expiresAt = new Date(value);
  return !Number.isNaN(expiresAt.valueOf()) && expiresAt.valueOf() < Date.now();
}

export async function completeFamilyInvite(supabase: SupabaseClient, userId: string, token: string | null): Promise<string | null> {
  if (!token) return null;

  const { data: invite } = await supabase
    .from('football_family_invites')
    .select('id,player_id,invited_by,relationship,status,expires_at')
    .eq('invite_token', token)
    .maybeSingle<FamilyInviteRow>();

  if (!invite || invite.status !== 'pending' || isExpired(invite.expires_at)) {
    return '/dashboard/family?invite_error=invalid';
  }

  await supabase.from('football_family').upsert({
    player_id: invite.player_id,
    family_user_id: userId,
    invited_by: invite.invited_by,
    relationship: invite.relationship,
    invite_token: token,
    status: 'active',
    accepted_at: new Date().toISOString()
  }, { onConflict: 'player_id,family_user_id' });

  await supabase
    .from('football_family_invites')
    .update({ status: 'accepted' })
    .eq('id', invite.id);

  return `/dashboard/family/player/${invite.player_id}`;
}

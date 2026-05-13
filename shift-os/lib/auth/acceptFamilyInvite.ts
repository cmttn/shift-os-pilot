import { createServiceClient } from '@/lib/supabase/service';

export type FamilyInviteMode = 'family' | 'coparent';

interface FamilyInviteRow {
  id: string;
  player_id: string;
  invited_by: string;
  relationship: string | null;
  status: string | null;
  expires_at: string | null;
}

interface PlayerInviteRow {
  id: string;
  co_parent_user_id: string | null;
}

function isExpired(value: string | null): boolean {
  if (!value) return false;
  const expiresAt = new Date(value);
  return !Number.isNaN(expiresAt.valueOf()) && expiresAt.valueOf() < Date.now();
}

export async function acceptFamilyInvite(userId: string, token: string | null, mode: FamilyInviteMode): Promise<string | null> {
  if (!token) return null;
  const supabase = createServiceClient();
  const { data: invite, error } = await supabase
    .from('football_family_invites')
    .select('id,player_id,invited_by,relationship,status,expires_at')
    .eq('invite_token', token)
    .maybeSingle<FamilyInviteRow>();

  if (error) throw error;
  if (!invite || invite.status !== 'pending' || isExpired(invite.expires_at)) {
    return mode === 'coparent' ? '/dashboard/parent?invite_error=invalid' : '/dashboard/family?invite_error=invalid';
  }

  if (mode === 'coparent') {
    const { data: player } = await supabase
      .from('players')
      .select('id,co_parent_user_id')
      .eq('id', invite.player_id)
      .maybeSingle<PlayerInviteRow>();

    if (!player) return '/dashboard/parent?invite_error=invalid';
    if (player.co_parent_user_id && player.co_parent_user_id !== userId) {
      return '/dashboard/parent?invite_error=already_linked';
    }

    const { error: updateError } = await supabase
      .from('players')
      .update({ co_parent_user_id: userId })
      .eq('id', invite.player_id);
    if (updateError) throw updateError;
  } else {
    const { error: familyError } = await supabase.from('football_family').upsert({
      player_id: invite.player_id,
      family_user_id: userId,
      invited_by: invite.invited_by,
      relationship: invite.relationship,
      invite_token: token,
      status: 'active',
      accepted_at: new Date().toISOString()
    }, { onConflict: 'player_id,family_user_id' });
    if (familyError) throw familyError;
  }

  const { error: inviteError } = await supabase
    .from('football_family_invites')
    .update({ status: 'accepted' })
    .eq('id', invite.id);
  if (inviteError) throw inviteError;

  return mode === 'coparent' ? '/dashboard/parent?invite_accepted=true' : `/dashboard/family/player/${invite.player_id}`;
}

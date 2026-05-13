import { redirect } from 'next/navigation';
import FootballFamilySettings, { type FamilySettingsPlayer } from '@/components/dashboard/FootballFamilySettings';
import SettingsPage from '@/components/dashboard/SettingsPage';
import { getParentDashboardData } from '@/lib/dashboard/getParentDashboardData';
import { getSettingsProfile } from '@/lib/dashboard/getSettingsProfile';
import { createClient } from '@/lib/supabase/server';

export default async function ParentSettingsPage() {
  const [parentData, settingsData] = await Promise.all([getParentDashboardData(), getSettingsProfile()]);
  if (!parentData) redirect('/dashboard/parent');
  if (!settingsData) redirect('/auth/login');

  const linkedPlayers = parentData.players.map((player) => ({
    id: player.id,
    name: player.full_name,
    teamName: player.teams[0]?.team_name ?? 'Team'
  }));
  const playerIds = parentData.players.map((player) => player.id);
  const supabase = await createClient();
  const [{ data: familyRows }, { data: inviteRows }] = await Promise.all([
    playerIds.length > 0
      ? supabase.from('football_family').select('id,player_id,family_user_id,relationship,status').in('player_id', playerIds).neq('status', 'revoked')
      : Promise.resolve({ data: [] as Array<{ id: string; player_id: string; family_user_id: string; relationship: string | null; status: string | null }> }),
    playerIds.length > 0
      ? supabase.from('football_family_invites').select('id,player_id,invitee_name,relationship,status,invite_token').in('player_id', playerIds).eq('status', 'pending')
      : Promise.resolve({ data: [] as Array<{ id: string; player_id: string; invitee_name: string | null; relationship: string | null; status: string | null; invite_token: string }> })
  ]);
  const familyUserIds = Array.from(new Set((familyRows ?? []).map((row) => row.family_user_id)));
  const { data: familyProfiles } = familyUserIds.length > 0
    ? await supabase.from('users_profile').select('id,full_name,email').in('id', familyUserIds)
    : { data: [] as Array<{ id: string; full_name: string | null; email: string | null }> };
  const familyPlayers: FamilySettingsPlayer[] = parentData.players.map((player) => ({
    id: player.id,
    name: player.full_name,
    parents: player.access.parents,
    members: (familyRows ?? []).filter((row) => row.player_id === player.id).map((row) => {
      const profile = (familyProfiles ?? []).find((item) => item.id === row.family_user_id);
      return {
        id: row.id,
        name: profile?.full_name?.trim() || profile?.email || 'Family member',
        relationship: row.relationship,
        status: row.status ?? 'active'
      };
    }),
    invites: (inviteRows ?? []).filter((row) => row.player_id === player.id && row.relationship !== 'Co-parent').map((row) => ({
      id: row.id,
      inviteeName: row.invitee_name,
      relationship: row.relationship,
      status: row.status ?? 'pending',
      inviteToken: row.invite_token
    })),
    coParentInvites: (inviteRows ?? []).filter((row) => row.player_id === player.id && row.relationship === 'Co-parent').map((row) => ({
      id: row.id,
      inviteeName: row.invitee_name,
      status: row.status ?? 'pending',
      inviteToken: row.invite_token
    }))
  }));

  return (
    <SettingsPage
      role="parent"
      user={settingsData.user}
      profile={settingsData.profile}
      primaryColour={parentData.allSameClub ? parentData.globalPrimaryColour : '#00C851'}
      linkedPlayers={linkedPlayers}
      extraContent={<FootballFamilySettings userId={parentData.userId} players={familyPlayers} primaryColour={parentData.allSameClub ? parentData.globalPrimaryColour : '#00C851'} />}
    />
  );
}

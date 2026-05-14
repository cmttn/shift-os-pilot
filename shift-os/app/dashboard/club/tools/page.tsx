import { getClubData } from '@/lib/dashboard/getClubData';
import ClubToolsClient, { type ClubToolRequest, type ClubToolToggle } from '@/components/dashboard/ClubToolsClient';
import { createClient } from '@/lib/supabase/server';

interface ToolUnlockRequestRow {
  id: string;
  feature_key: string | null;
  coach_user_id: string | null;
  team_id: string | null;
  created_at: string | null;
}

interface UserProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface TeamNameRow {
  id: string;
  name: string | null;
}

export default async function ClubToolsPage() {
  const clubData = await getClubData();
  if (!clubData) return null;
  const supabase = await createClient();

  const [{ data: togglesData }, { data: requestsData }] = await Promise.all([
    supabase.from('feature_toggles').select('feature_key,is_enabled').eq('club_id', clubData.club.id),
    supabase
      .from('tool_unlock_requests')
      .select('id,feature_key,coach_user_id,team_id,created_at')
      .eq('club_id', clubData.club.id)
      .eq('status', 'pending')
  ]);

  const requestRows = (requestsData ?? []) as ToolUnlockRequestRow[];
  const coachIds = Array.from(new Set(requestRows.map((request) => request.coach_user_id).filter((coachId): coachId is string => Boolean(coachId))));
  const teamIds = Array.from(new Set(requestRows.map((request) => request.team_id).filter((teamId): teamId is string => Boolean(teamId))));
  const [{ data: profileData }, { data: teamData }] = await Promise.all([
    coachIds.length > 0
      ? supabase.from('users_profile').select('id,full_name,email').in('id', coachIds)
      : Promise.resolve({ data: [] as UserProfileRow[] }),
    teamIds.length > 0
      ? supabase.from('teams').select('id,name').in('id', teamIds)
      : Promise.resolve({ data: [] as TeamNameRow[] })
  ]);

  const profiles = (profileData ?? []) as UserProfileRow[];
  const teams = (teamData ?? []) as TeamNameRow[];
  const requests: ClubToolRequest[] = requestRows
    .filter((request) => request.feature_key)
    .map((request) => {
      const profile = profiles.find((item) => item.id === request.coach_user_id);
      const team = teams.find((item) => item.id === request.team_id);
      return {
        id: request.id,
        feature_key: request.feature_key ?? '',
        coach_name: profile?.full_name?.trim() || 'Coach',
        coach_email: profile?.email ?? null,
        team_name: team?.name ?? null,
        created_at: request.created_at ?? null
      };
    });

  return (
    <ClubToolsClient
      clubId={clubData.club.id}
      clubName={clubData.club.name}
      primaryColour={clubData.club.primary_colour}
      initialToggles={(togglesData ?? []) as ClubToolToggle[]}
      requests={requests}
    />
  );
}

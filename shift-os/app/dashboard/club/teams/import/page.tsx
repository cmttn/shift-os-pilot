import { redirect } from 'next/navigation';
import ImportTeamForm from '@/components/dashboard/ImportTeamForm';
import { getClubData } from '@/lib/dashboard/getClubData';

function canManageTeams(role: string): boolean {
  return role === 'admin' || role === 'club_admin' || role === 'shift_admin';
}

export default async function ImportExistingTeamPage() {
  const clubData = await getClubData();
  if (!clubData) redirect('/onboarding');
  if (!canManageTeams(clubData.clubRole)) redirect('/dashboard/club');

  return (
    <ImportTeamForm
      clubId={clubData.club.id}
      clubName={clubData.club.name}
      clubBadgeUrl={clubData.club.badge_url}
      clubPrimaryColour={clubData.club.primary_colour}
      clubSecondaryColour={clubData.club.secondary_colour}
      allowTeamColours={clubData.club.allow_team_colours}
      allowTeamBadges={clubData.club.allow_team_badges}
    />
  );
}

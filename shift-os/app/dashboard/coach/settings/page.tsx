import { redirect } from 'next/navigation';
import CoachPotmSettingsForm from '@/components/dashboard/CoachPotmSettingsForm';
import CoachSrpSettingsForm from '@/components/dashboard/CoachSrpSettingsForm';
import CoachTeamBrandingSettings from '@/components/dashboard/CoachTeamBrandingSettings';
import SettingsPage from '@/components/dashboard/SettingsPage';
import { getCoachData } from '@/lib/dashboard/getCoachData';
import { getSettingsProfile } from '@/lib/dashboard/getSettingsProfile';

export default async function CoachSettingsPage() {
  const [coachData, settingsData] = await Promise.all([getCoachData(), getSettingsProfile()]);
  if (!coachData) redirect('/dashboard/coach/welcome');
  if (!settingsData) redirect('/auth/login');

  const activeTeam = coachData.teams[0] ?? null;
  const primaryColour = activeTeam?.club_primary_colour ?? '#00C851';
  const coachSettings = activeTeam ? (
    <div className="space-y-4">
      <CoachTeamBrandingSettings
        teamId={activeTeam.id}
        teamName={activeTeam.name}
        clubName={activeTeam.club_name}
        clubBadgeUrl={activeTeam.club_badge_url}
        clubPrimaryColour={activeTeam.club_primary_colour ?? '#00C851'}
        clubSecondaryColour={activeTeam.club_secondary_colour ?? activeTeam.club_primary_colour ?? '#080a0f'}
        teamPrimaryColour={activeTeam.team_primary_colour}
        teamSecondaryColour={activeTeam.team_secondary_colour}
        teamBadgeUrl={activeTeam.team_badge_url}
        allowTeamColours={activeTeam.allow_team_colours}
        allowTeamBadges={activeTeam.allow_team_badges}
        clubImportToken={activeTeam.club_import_token}
        isClubManaged={activeTeam.is_club_managed}
        primaryColour={primaryColour}
      />
      <CoachPotmSettingsForm userId={coachData.coach.id} clubId={activeTeam.club_id} primaryColour={primaryColour} />
      <CoachSrpSettingsForm
        userId={coachData.coach.id}
        teamId={activeTeam.id}
        clubEnabled={!activeTeam.is_club_managed || coachData.enabledFeatures.includes('squad_rotation_planner')}
        primaryColour={primaryColour}
      />
    </div>
  ) : (
    <CoachPotmSettingsForm userId={coachData.coach.id} clubId={null} primaryColour={primaryColour} />
  );

  return (
    <SettingsPage
      role="coach"
      user={settingsData.user}
      profile={settingsData.profile}
      primaryColour={primaryColour}
      extraContent={coachSettings}
    />
  );
}

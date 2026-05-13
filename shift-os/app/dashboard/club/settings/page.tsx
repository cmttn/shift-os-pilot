import Link from 'next/link';
import { redirect } from 'next/navigation';
import ClubBrandingSettings from '@/components/dashboard/ClubBrandingSettings';
import ClubJoinCodeSettings from '@/components/dashboard/ClubJoinCodeSettings';
import SettingsPage from '@/components/dashboard/SettingsPage';
import { getClubData } from '@/lib/dashboard/getClubData';
import { getSettingsProfile } from '@/lib/dashboard/getSettingsProfile';
import { contrastText } from '@/lib/utils/contrastText';

export default async function ClubSettingsPage() {
  const [clubData, settingsData] = await Promise.all([getClubData(), getSettingsProfile()]);
  if (!clubData) redirect('/onboarding');
  if (!settingsData) redirect('/auth/login');

  const primaryColour = clubData.club.primary_colour;
  const primaryText = contrastText(primaryColour);
  const clubSettings = (
    <div className="space-y-4">
      <section className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <h2 className="text-xl font-bold">Club Workspace</h2>
        <div className="mt-5 space-y-3 text-sm">
          <p className="flex justify-between gap-4 border-b border-white/[0.06] pb-3"><span className="text-white/35">Club</span><span className="text-right text-white">{clubData.club.name}</span></p>
          <p className="flex justify-between gap-4 border-b border-white/[0.06] pb-3"><span className="text-white/35">Plan</span><span className="text-right text-white">{clubData.club.plan_tier}</span></p>
        </div>
      </section>
      <section className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <h2 className="text-xl font-bold">Player of the Match</h2>
        <p className="mt-2 text-sm text-white/40">Set club-wide POTM message rules, coach voting and player voting age.</p>
        <Link href="/dashboard/club/settings/potm" className="mt-5 inline-flex rounded-full px-5 py-3 text-sm font-semibold" style={{ backgroundColor: primaryColour, color: primaryText }}>Manage POTM Settings</Link>
      </section>
      <ClubBrandingSettings
        clubId={clubData.club.id}
        allowTeamColours={clubData.club.allow_team_colours}
        allowTeamBadges={clubData.club.allow_team_badges}
        primaryColour={primaryColour}
      />
      <ClubJoinCodeSettings clubId={clubData.club.id} clubName={clubData.club.name} joinCode={clubData.club.coach_join_code} />
      <section className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <h2 className="text-xl font-bold">Coach Recognition</h2>
        <p className="mt-2 text-sm text-white/40">Set positive ticket thresholds and rewards for coach recognition.</p>
        <Link href="/dashboard/club/settings/recognition" className="mt-5 inline-flex rounded-full px-5 py-3 text-sm font-semibold" style={{ backgroundColor: primaryColour, color: primaryText }}>Manage Recognition</Link>
      </section>
    </div>
  );

  return (
    <SettingsPage
      role="club"
      user={settingsData.user}
      profile={settingsData.profile}
      primaryColour={primaryColour}
      extraContent={clubSettings}
    />
  );
}

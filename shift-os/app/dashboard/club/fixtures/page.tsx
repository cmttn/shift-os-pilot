import ClubFixtureSettings from '@/components/dashboard/ClubFixtureSettings';
import ClubFixturesManager from '@/components/dashboard/ClubFixturesManager';
import { getClubData } from '@/lib/dashboard/getClubData';

export default async function ClubFixturesPage() {
  const clubData = await getClubData();
  if (!clubData) return null;

  return (
    <main className="-mx-4 -my-4 min-h-screen px-4 py-8 text-white md:-mx-8 md:-my-8 md:px-8" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-6xl space-y-6">
        <ClubFixturesManager fixtures={clubData.fixtures} teams={clubData.teams} primaryColour={clubData.club.primary_colour} />
        <ClubFixtureSettings
          clubId={clubData.club.id}
          allowCoachFixtureImports={clubData.club.allow_coach_fixture_imports}
          primaryColour={clubData.club.primary_colour}
        />
      </div>
    </main>
  );
}

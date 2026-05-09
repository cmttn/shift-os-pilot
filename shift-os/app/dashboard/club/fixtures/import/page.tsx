import CSVImporter from '@/components/fixtures/CSVImporter';
import { getClubData } from '@/lib/dashboard/getClubData';

export default async function ClubFixtureImportPage() {
  const clubData = await getClubData();
  if (!clubData) return null;
  return (
    <main className="-mx-4 -my-4 min-h-screen px-4 py-8 text-white md:-mx-8 md:-my-8 md:px-8" style={{ backgroundColor: '#080a0f' }}>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-white/30">Club Fixtures</p>
        <h1 className="mt-3 text-4xl font-black">Import Fixtures</h1>
        <p className="mt-2 text-sm text-white/40">Import matches, training and tournaments into team schedules.</p>
      </div>
      <CSVImporter teams={clubData.teams.map((team) => ({ id: team.id, name: team.name }))} primaryColour={clubData.club.primary_colour} importedFrom="club_csv" />
    </main>
  );
}

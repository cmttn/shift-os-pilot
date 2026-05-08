import { getClubData } from '@/lib/dashboard/getClubData';

export default async function ClubFixturesPage() {
  const clubData = await getClubData();
  if (!clubData) return null;

  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
      <h2 className="text-2xl font-bold text-white">Fixtures</h2>
      <p className="mt-2 text-gray-400">Track and plan fixtures for your club.</p>
    </section>
  );
}

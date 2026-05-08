import { getClubData } from '@/lib/dashboard/getClubData';

export default async function ClubToolsPage() {
  const clubData = await getClubData();
  if (!clubData) return null;

  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
      <h2 className="text-2xl font-bold text-white">Tools</h2>
      <p className="mt-2 text-gray-400">Access coaching tools and club workflows.</p>
    </section>
  );
}

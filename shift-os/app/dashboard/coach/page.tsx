import { redirect } from 'next/navigation';
import CoachDashboardClient from '@/components/dashboard/CoachDashboardClient';
import { getCoachData } from '@/lib/dashboard/getCoachData';

interface CoachDashboardPageProps {
  searchParams?: {
    team?: string;
  };
}

export default async function CoachDashboardPage({ searchParams }: CoachDashboardPageProps) {
  const coachData = await getCoachData();
  if (!coachData) redirect('/dashboard/coach/welcome');

  return <CoachDashboardClient data={coachData} initialActiveTeamId={searchParams?.team ?? null} />;
}

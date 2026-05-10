import { redirect } from 'next/navigation';
import CoachScheduleClient from '@/components/dashboard/CoachScheduleClient';
import { getCoachData } from '@/lib/dashboard/getCoachData';

export default async function CoachSchedulePage() {
  const data = await getCoachData();
  if (!data) redirect('/dashboard/coach/welcome');
  return <CoachScheduleClient data={data} />;
}

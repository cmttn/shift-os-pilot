import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getCoachData } from '@/lib/dashboard/getCoachData';

export default async function CoachLayout({ children }: { children: ReactNode }) {
  const coachData = await getCoachData();
  if (!coachData) redirect('/dashboard/coach/welcome');
  return <>{children}</>;
}

import { redirect } from 'next/navigation';

export default function ParentDashboardRedirect() {
  redirect('/dashboard/parent/player');
}

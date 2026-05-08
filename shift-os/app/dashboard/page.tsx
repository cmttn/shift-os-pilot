import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  const { data: membership } = await supabase
    .from('club_members')
    .select('club_role')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (membership?.club_role === 'coach') {
    redirect('/dashboard/coach');
  }

  redirect('/dashboard/club');
}

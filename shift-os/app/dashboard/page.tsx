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

  const email = session.user.email?.toLowerCase();
  const { count: linkedPlayerCount } = email
    ? await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .or(`guardian_1_email.ilike.${email},guardian_2_email.ilike.${email}`)
        .eq('is_active', true)
    : { count: 0 };

  if (membership?.club_role === 'parent' || (linkedPlayerCount ?? 0) > 0) {
    redirect('/dashboard/parent');
  }

  redirect('/dashboard/club');
}

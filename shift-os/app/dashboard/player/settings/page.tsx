import SettingsShell from '@/components/dashboard/SettingsShell';
import { createClient } from '@/lib/supabase/server';

export default async function PlayerSettingsPage() {
  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  const { data: profile } = user ? await supabase.from('users_profile').select('full_name').eq('id', user.id).maybeSingle<{ full_name: string | null }>() : { data: null };
  return (
    <SettingsShell
      title="Player Settings"
      name={profile?.full_name ?? user?.email?.split('@')[0] ?? 'Player'}
      email={user?.email ?? ''}
      contextRows={[{ label: 'Workspace', value: 'Player' }]}
    />
  );
}

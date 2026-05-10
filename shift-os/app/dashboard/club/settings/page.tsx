import { redirect } from 'next/navigation';
import SettingsShell from '@/components/dashboard/SettingsShell';
import { getClubData } from '@/lib/dashboard/getClubData';
import { createClient } from '@/lib/supabase/server';

export default async function ClubSettingsPage() {
  const clubData = await getClubData();
  if (!clubData) redirect('/onboarding');
  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const email = sessionData.session?.user.email ?? '';
  return (
    <SettingsShell
      title="Club Settings"
      name={clubData.firstName}
      email={email}
      contextRows={[
        { label: 'Club', value: clubData.club.name },
        { label: 'Plan', value: clubData.club.plan_tier }
      ]}
    />
  );
}

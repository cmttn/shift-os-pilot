import PlayerSubscriptionsClient, { SubscriptionPlayerRow } from '@/components/dashboard/PlayerSubscriptionsClient';
import { getClubData } from '@/lib/dashboard/getClubData';
import { createClient } from '@/lib/supabase/server';

interface PlayerRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  team_id: string | null;
}

interface TeamRow {
  id: string;
  name: string;
}

interface SubscriptionRow {
  player_id: string;
  status: 'paid' | 'overdue' | 'exempt' | null;
  amount_due: number | null;
  due_date: string | null;
}

interface ContactRow {
  player_id: string;
  contacted_at: string;
}

export default async function PlayerSubscriptionsPage() {
  const clubData = await getClubData();
  if (!clubData) return null;
  const supabase = await createClient();
  const teamIds = clubData.teams.map((team) => team.id);
  const [{ data: playersData }, { data: teamsData }, { data: subscriptionsData }, { data: contactData }] = await Promise.all([
    teamIds.length > 0 ? supabase.from('players').select('id,first_name,last_name,team_id').in('team_id', teamIds).eq('is_active', true).order('first_name', { ascending: true }) : Promise.resolve({ data: [] as PlayerRow[] }),
    teamIds.length > 0 ? supabase.from('teams').select('id,name').in('id', teamIds) : Promise.resolve({ data: [] as TeamRow[] }),
    supabase.from('player_subscriptions').select('player_id,status,amount_due,due_date').eq('club_id', clubData.club.id),
    supabase.from('subscription_contact_log').select('player_id,contacted_at').order('contacted_at', { ascending: false })
  ]);
  const teams = (teamsData ?? []) as TeamRow[];
  const subscriptions = (subscriptionsData ?? []) as SubscriptionRow[];
  const contacts = (contactData ?? []) as ContactRow[];
  const rows: SubscriptionPlayerRow[] = ((playersData ?? []) as PlayerRow[]).map((player) => {
    const subscription = subscriptions.find((item) => item.player_id === player.id);
    return {
      player_id: player.id,
      player_name: [player.first_name, player.last_name].filter(Boolean).join(' ') || 'Player',
      team_name: teams.find((team) => team.id === player.team_id)?.name ?? 'Team',
      status: subscription?.status ?? 'paid',
      amount_due: subscription?.amount_due ?? null,
      due_date: subscription?.due_date ?? null,
      last_contacted: contacts.find((contact) => contact.player_id === player.id)?.contacted_at?.slice(0, 10) ?? null
    };
  });

  return (
    <main className="-mx-4 -my-4 min-h-screen px-4 py-8 text-white md:-mx-8 md:-my-8 md:px-8" style={{ backgroundColor: '#080a0f' }}>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-white/30">Club Admin</p>
        <h1 className="mt-3 text-4xl font-black">Player Subscriptions</h1>
        <p className="mt-2 text-sm text-white/40">Manage paid, overdue, exempt and restricted players.</p>
      </div>
      <PlayerSubscriptionsClient clubId={clubData.club.id} clubName={clubData.club.name} primaryColour={clubData.club.primary_colour} rows={rows} />
    </main>
  );
}

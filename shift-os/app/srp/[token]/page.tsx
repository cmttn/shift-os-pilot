import Link from 'next/link';
import SrpParentChoiceClient, { type SrpChoicePlayer, type SrpChoiceSlot } from '@/components/dashboard/SrpParentChoiceClient';
import { createServiceClient } from '@/lib/supabase/service';

interface SrpParentPageProps {
  params: {
    token: string;
  };
}

interface PlanRow {
  id: string;
  team_id: string;
  parent_note: string | null;
  status: string | null;
  excluded_goalkeeper_player_id: string | null;
}

interface TeamRow {
  name: string;
  club_id: string | null;
}

interface ClubRow {
  primary_colour: string | null;
}

interface PlayerRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface SlotRow {
  id: string;
  slot_date: string;
  player_id: string | null;
}

function playerName(player: PlayerRow): string {
  return [player.first_name, player.last_name].map((part) => part?.trim()).filter(Boolean).join(' ') || 'Player';
}

export default async function SrpParentChoicePage({ params }: SrpParentPageProps) {
  const supabase = createServiceClient();
  const { data: plan } = await supabase
    .from('srp_plans')
    .select('id,team_id,parent_note,status,excluded_goalkeeper_player_id')
    .eq('parent_token', params.token)
    .maybeSingle<PlanRow>();

  if (!plan || plan.status !== 'parent_choice_open') {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 text-white" style={{ backgroundColor: '#080a0f' }}>
        <section className="w-full max-w-[480px] rounded-2xl border border-white/[0.06] p-8 text-center" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)' }}>
          <h1 className="text-2xl font-black">This SRP choice link is no longer open.</h1>
          <p className="mt-3 text-sm text-white/40">Ask your coach for the latest squad rotation link.</p>
          <Link href="/" className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-black">Go to SHIFT OS</Link>
        </section>
      </main>
    );
  }

  const [{ data: team }, { data: playersData }, { data: slotsData }] = await Promise.all([
    supabase.from('teams').select('name,club_id').eq('id', plan.team_id).maybeSingle<TeamRow>(),
    supabase.from('players').select('id,first_name,last_name').eq('team_id', plan.team_id).eq('is_active', true).order('first_name', { ascending: true }),
    supabase.from('srp_slots').select('id,slot_date,player_id').eq('plan_id', plan.id).order('slot_date', { ascending: true })
  ]);
  const { data: club } = team?.club_id ? await supabase.from('clubs').select('primary_colour').eq('id', team.club_id).maybeSingle<ClubRow>() : { data: null };
  const players: SrpChoicePlayer[] = ((playersData ?? []) as PlayerRow[])
    .filter((player) => player.id !== plan.excluded_goalkeeper_player_id)
    .map((player) => ({ id: player.id, name: playerName(player) }));
  const slots: SrpChoiceSlot[] = ((slotsData ?? []) as SlotRow[]).map((slot) => ({ id: slot.id, slotDate: slot.slot_date, playerId: slot.player_id }));

  return (
    <main className="min-h-screen px-5 py-10 text-white" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[520px]">
        <SrpParentChoiceClient
          token={params.token}
          teamName={team?.name ?? 'Your team'}
          players={players}
          slots={slots}
          primaryColour={club?.primary_colour ?? '#f5c542'}
          note={plan.parent_note}
        />
      </div>
    </main>
  );
}

import { redirect } from 'next/navigation';
import SquadRotationPlannerClient, { type SrpChoiceRow, type SrpPlanRow, type SrpSlotRow } from '@/components/dashboard/SquadRotationPlannerClient';
import { getCoachData } from '@/lib/dashboard/getCoachData';
import { createClient } from '@/lib/supabase/server';

interface CoachSrpPageProps {
  searchParams?: {
    team?: string;
  };
}

export default async function CoachSrpPage({ searchParams }: CoachSrpPageProps) {
  const coachData = await getCoachData();
  if (!coachData) redirect('/dashboard/coach/welcome');

  const activeTeam = coachData.teams.find((team) => team.id === searchParams?.team) ?? coachData.teams.find((team) => team.id === coachData.activeTeamId) ?? coachData.teams[0] ?? null;
  if (!activeTeam) redirect('/dashboard/coach/teams/new');

  const clubEnabled = activeTeam.is_club_managed ? coachData.enabledFeatures.includes('squad_rotation_planner') : true;
  const teamPlayers = coachData.players
    .filter((player) => player.team_id === activeTeam.id && player.is_active)
    .map((player) => ({ id: player.id, name: player.full_name }));

  const supabase = await createClient();
  const { data: coachSrpSetting } = clubEnabled
    ? await supabase
        .from('srp_coach_settings')
        .select('is_enabled')
        .eq('user_id', coachData.coach.id)
        .eq('team_id', activeTeam.id)
        .maybeSingle<{ is_enabled: boolean | null }>()
    : { data: null };
  const enabled = clubEnabled && (coachSrpSetting?.is_enabled ?? true);
  const { data: planData, error: planError } = enabled
    ? await supabase
        .from('srp_plans')
        .select('id,club_id,team_id,created_by,title,start_date,cycle_weeks,include_goalkeeper,excluded_goalkeeper_player_id,allocation_method,parent_note,parent_token,status')
        .eq('team_id', activeTeam.id)
        .neq('status', 'archived')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle<SrpPlanRow>()
    : { data: null, error: null };

  const setupError = planError ? 'SRP tables are not available yet. Run the SQL in the deployment notes before using this tool.' : null;
  const plan = planData ?? null;
  const [{ data: slotsData }, { data: choicesData }] = plan
    ? await Promise.all([
        supabase.from('srp_slots').select('id,plan_id,slot_date,player_id,assigned_by,locked').eq('plan_id', plan.id).order('slot_date', { ascending: true }),
        supabase.from('srp_parent_choices').select('id,plan_id,player_id,selected_slot_id,choice_type,submitted_at').eq('plan_id', plan.id)
      ])
    : [{ data: [] as SrpSlotRow[] }, { data: [] as SrpChoiceRow[] }];

  return (
    <SquadRotationPlannerClient
      userId={coachData.coach.id}
      team={{ id: activeTeam.id, name: activeTeam.name, clubId: activeTeam.club_id }}
      players={teamPlayers}
      primaryColour={activeTeam.club_primary_colour ?? '#f5c542'}
      enabled={enabled}
      initialPlan={plan}
      initialSlots={(slotsData ?? []) as SrpSlotRow[]}
      initialChoices={(choicesData ?? []) as SrpChoiceRow[]}
      setupError={setupError}
    />
  );
}

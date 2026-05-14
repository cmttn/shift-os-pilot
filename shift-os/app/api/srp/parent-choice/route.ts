import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

interface ParentChoicePayload {
  token: string;
  playerId: string;
  choiceType: 'selected_date' | 'no_preference';
  slotId: string | null;
}

interface PlanRow {
  id: string;
  team_id: string;
  status: string | null;
  excluded_goalkeeper_player_id: string | null;
}

interface PlayerRow {
  id: string;
  team_id: string | null;
}

interface SlotRow {
  id: string;
  plan_id: string;
  player_id: string | null;
}

interface ExistingChoiceRow {
  selected_slot_id: string | null;
}

function isPayload(value: unknown): value is ParentChoicePayload {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.token === 'string' &&
    typeof record.playerId === 'string' &&
    (record.choiceType === 'selected_date' || record.choiceType === 'no_preference') &&
    (typeof record.slotId === 'string' || record.slotId === null)
  );
}

export async function POST(request: Request) {
  const payload: unknown = await request.json().catch(() => null);
  if (!isPayload(payload)) {
    return NextResponse.json({ error: 'Invalid SRP choice payload' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: plan } = await supabase
    .from('srp_plans')
    .select('id,team_id,status,excluded_goalkeeper_player_id')
    .eq('parent_token', payload.token)
    .maybeSingle<PlanRow>();

  if (!plan || plan.status !== 'parent_choice_open') {
    return NextResponse.json({ error: 'This SRP choice link is no longer open.' }, { status: 404 });
  }

  const { data: player } = await supabase.from('players').select('id,team_id').eq('id', payload.playerId).maybeSingle<PlayerRow>();
  if (!player || player.team_id !== plan.team_id || player.id === plan.excluded_goalkeeper_player_id) {
    return NextResponse.json({ error: 'Player is not available for this SRP plan.' }, { status: 400 });
  }

  const { data: existingChoice } = await supabase
    .from('srp_parent_choices')
    .select('selected_slot_id')
    .eq('plan_id', plan.id)
    .eq('player_id', player.id)
    .maybeSingle<ExistingChoiceRow>();

  if (payload.choiceType === 'selected_date') {
    if (!payload.slotId) {
      return NextResponse.json({ error: 'Choose a rotation date.' }, { status: 400 });
    }

    const { data: slot } = await supabase.from('srp_slots').select('id,plan_id,player_id').eq('id', payload.slotId).maybeSingle<SlotRow>();
    if (!slot || slot.plan_id !== plan.id || (slot.player_id && slot.player_id !== player.id)) {
      return NextResponse.json({ error: 'That date has already been chosen.' }, { status: 409 });
    }

    if (existingChoice?.selected_slot_id && existingChoice.selected_slot_id !== slot.id) {
      await supabase
        .from('srp_slots')
        .update({ player_id: null, assigned_by: null, locked: false })
        .eq('id', existingChoice.selected_slot_id)
        .eq('player_id', player.id)
        .eq('assigned_by', 'parent_choice');
    }

    const { data: updatedSlot, error: slotError } = await supabase
      .from('srp_slots')
      .update({ player_id: player.id, assigned_by: 'parent_choice', locked: true })
      .eq('id', slot.id)
      .or(`player_id.is.null,player_id.eq.${player.id}`)
      .select('id')
      .maybeSingle<{ id: string }>();

    if (slotError || !updatedSlot) {
      return NextResponse.json({ error: 'That date has already been chosen.' }, { status: 409 });
    }
  } else if (existingChoice?.selected_slot_id) {
    await supabase
      .from('srp_slots')
      .update({ player_id: null, assigned_by: null, locked: false })
      .eq('id', existingChoice.selected_slot_id)
      .eq('player_id', player.id)
      .eq('assigned_by', 'parent_choice');
  }

  const { error: choiceError } = await supabase.from('srp_parent_choices').upsert({
    plan_id: plan.id,
    player_id: player.id,
    selected_slot_id: payload.choiceType === 'selected_date' ? payload.slotId : null,
    choice_type: payload.choiceType,
    submitted_at: new Date().toISOString()
  }, { onConflict: 'plan_id,player_id' });

  if (choiceError) {
    return NextResponse.json({ error: choiceError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

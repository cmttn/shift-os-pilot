export interface Player {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_goalkeeper: boolean;
  goalkeeper_periods: number[];
}

export type GameFormat = '3v3' | '5v5' | '7v7' | '9v9' | '11v11';
export type GamePeriods = 2 | 3 | 4;
export type GoalkeeperRule = 'none' | 'full_game' | 'option_a' | 'option_b';
export type CalculationMode = 1 | 2 | 3;

export interface PlaytimeInput {
  total_minutes: number;
  format: GameFormat;
  periods: GamePeriods;
  players: Player[];
  goalkeeper_rule: GoalkeeperRule;
  calculation_mode: CalculationMode;
  starters?: string[];
}

export interface SubstitutionEvent {
  minute: number;
  player_off_id: string;
  player_off_name: string;
  player_on_id: string;
  player_on_name: string;
  reason: 'rotation' | 'gk_swap' | 'gk_return_outfield';
}

export interface PlayerTimeAllocation {
  player_id: string;
  player_name: string;
  is_goalkeeper: boolean;
  goalkeeper_periods: number[];
  total_minutes: number;
  goal_minutes: number;
  outfield_minutes: number;
  starts: boolean;
  sub_position: number | null;
}

export interface PlaytimeResult {
  fair_share_minutes: number;
  period_duration: number;
  pitch_places: number;
  squad_size: number;
  goalkeeper_count: number;
  goalkeeper_rule_applied: string;
  allocations: PlayerTimeAllocation[];
  substitution_order: SubstitutionEvent[];
  starting_xi: string[];
  warnings: string[];
}

export function roundToTwo(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatMinutes(n: number): string {
  const whole = Math.floor(n);
  const secs = Math.round((n - whole) * 60);
  if (secs === 0) return `${whole} mins`;
  return `${whole} mins ${secs} secs`;
}

export function getPitchPlaces(format: GameFormat): number {
  const map: Record<GameFormat, number> = {
    '3v3': 3,
    '5v5': 5,
    '7v7': 7,
    '9v9': 9,
    '11v11': 11
  };
  return map[format];
}

export function getOutfieldPlaces(format: GameFormat): number {
  if (format === '3v3') return 3;
  return getPitchPlaces(format) - 1;
}

function byName(a: Player, b: Player): number {
  return a.full_name.localeCompare(b.full_name);
}

function assignGoalkeeperPeriods(keepers: Player[], periods: GamePeriods, warnings: string[]): Player[] {
  if (keepers.length === 0) return [];
  const assigned = keepers.map((keeper) => ({ ...keeper, goalkeeper_periods: [] as number[] }));
  for (let period = 1; period <= periods; period += 1) {
    const keeper = assigned[(period - 1) % assigned.length];
    keeper.goalkeeper_periods.push(period);
  }
  if (keepers.length > 1 && keepers.length !== periods) {
    const first = assigned[0];
    const extra = first.goalkeeper_periods.slice(1).join(' and ');
    warnings.push(`You have ${keepers.length} keepers but ${periods} periods. ${first.full_name} will cover periods 1${extra ? ` and ${extra}` : ''}.`);
  }
  return assigned;
}

function buildStartingIds(input: PlaytimeInput, pitchPlaces: number, keepers: Player[], outfieldPlayers: Player[]): string[] {
  if (input.calculation_mode === 2 && input.starters && input.starters.length > 0) {
    return input.starters.slice(0, pitchPlaces);
  }
  if (input.calculation_mode !== 3) return [];
  const startingIds: string[] = [];
  if (keepers.length > 0) startingIds.push(keepers[0].id);
  const outfieldSlots = Math.max(0, pitchPlaces - startingIds.length);
  startingIds.push(...outfieldPlayers.slice().sort(byName).slice(0, outfieldSlots).map((player) => player.id));
  return startingIds;
}

function buildRotationEvents(players: Player[], startingIds: string[], fairShare: number): SubstitutionEvent[] {
  if (startingIds.length === 0) return [];
  const starters = startingIds.map((id) => players.find((player) => player.id === id)).filter((player): player is Player => Boolean(player));
  const subs = players.filter((player) => !startingIds.includes(player.id)).sort(byName);
  return subs.map((sub, index) => {
    const playerOff = starters[index % starters.length];
    return {
      minute: roundToTwo(fairShare),
      player_off_id: playerOff.id,
      player_off_name: playerOff.full_name,
      player_on_id: sub.id,
      player_on_name: sub.full_name,
      reason: 'rotation'
    };
  });
}

function buildGoalkeeperEvents(keepers: Player[], periodDuration: number, rule: GoalkeeperRule): SubstitutionEvent[] {
  if (keepers.length < 2) return [];
  const events: SubstitutionEvent[] = [];
  for (let index = 1; index < keepers.length; index += 1) {
    const current = keepers[index - 1];
    const next = keepers[index];
    const minute = roundToTwo(periodDuration * index);
    events.push({
      minute,
      player_off_id: current.id,
      player_off_name: current.full_name,
      player_on_id: next.id,
      player_on_name: next.full_name,
      reason: 'gk_swap'
    });
    if (rule === 'option_b') {
      events.push({
        minute: roundToTwo(minute + 0.01),
        player_off_id: next.id,
        player_off_name: next.full_name,
        player_on_id: current.id,
        player_on_name: current.full_name,
        reason: 'gk_return_outfield'
      });
    }
  }
  return events;
}

export function calculatePlaytime(input: PlaytimeInput): PlaytimeResult {
  const pitchPlaces = getPitchPlaces(input.format);
  const outfieldPlaces = getOutfieldPlaces(input.format);
  const squadSize = input.players.length;
  const periodDuration = roundToTwo(input.total_minutes / input.periods);
  const baseFairShare = squadSize > 0 ? roundToTwo((input.total_minutes * pitchPlaces) / squadSize) : 0;
  const warnings: string[] = [];
  const rawKeepers = input.format === '3v3' ? [] : input.players.filter((player) => player.is_goalkeeper);
  const assignedKeepers = assignGoalkeeperPeriods(rawKeepers, input.periods, warnings);
  const keeperIds = new Set(assignedKeepers.map((player) => player.id));
  const outfieldPlayers = input.players.filter((player) => !keeperIds.has(player.id));
  const goalkeeperCount = assignedKeepers.length;
  let rule: GoalkeeperRule = input.goalkeeper_rule;
  let fairShare = baseFairShare;
  let goalkeeperRuleApplied = 'No goalkeepers - all players share equal time';
  const allocations: PlayerTimeAllocation[] = [];

  if (squadSize === 0) {
    return {
      fair_share_minutes: 0,
      period_duration: periodDuration,
      pitch_places: pitchPlaces,
      squad_size: 0,
      goalkeeper_count: 0,
      goalkeeper_rule_applied: 'No players selected',
      allocations: [],
      substitution_order: [],
      starting_xi: [],
      warnings: ['No players selected.']
    };
  }

  if (goalkeeperCount === 0 || input.format === '3v3') {
    rule = 'none';
    fairShare = baseFairShare;
    input.players.forEach((player) => {
      allocations.push({
        player_id: player.id,
        player_name: player.full_name,
        is_goalkeeper: false,
        goalkeeper_periods: [],
        total_minutes: fairShare,
        goal_minutes: 0,
        outfield_minutes: fairShare,
        starts: false,
        sub_position: null
      });
    });
  } else if (goalkeeperCount === 1) {
    rule = 'full_game';
    const keeper = assignedKeepers[0];
    const outfieldFairShare = outfieldPlayers.length > 0 ? roundToTwo((input.total_minutes * outfieldPlaces) / outfieldPlayers.length) : 0;
    fairShare = outfieldFairShare;
    goalkeeperRuleApplied = `${keeper.full_name} plays full game in goal - excluded from rotation`;
    allocations.push({
      player_id: keeper.id,
      player_name: keeper.full_name,
      is_goalkeeper: true,
      goalkeeper_periods: Array.from({ length: input.periods }, (_, index) => index + 1),
      total_minutes: input.total_minutes,
      goal_minutes: input.total_minutes,
      outfield_minutes: 0,
      starts: false,
      sub_position: null
    });
    outfieldPlayers.forEach((player) => {
      allocations.push({
        player_id: player.id,
        player_name: player.full_name,
        is_goalkeeper: false,
        goalkeeper_periods: [],
        total_minutes: outfieldFairShare,
        goal_minutes: 0,
        outfield_minutes: outfieldFairShare,
        starts: false,
        sub_position: null
      });
    });
  } else if (rule === 'option_a') {
    const outfieldFairShare = outfieldPlayers.length > 0 ? roundToTwo((input.total_minutes * outfieldPlaces) / outfieldPlayers.length) : 0;
    fairShare = outfieldFairShare;
    goalkeeperRuleApplied = 'Keepers play full game - outfield rotation for remaining players';
    assignedKeepers.forEach((keeper) => {
      const goalMinutes = roundToTwo(periodDuration * keeper.goalkeeper_periods.length);
      allocations.push({
        player_id: keeper.id,
        player_name: keeper.full_name,
        is_goalkeeper: true,
        goalkeeper_periods: keeper.goalkeeper_periods,
        total_minutes: input.total_minutes,
        goal_minutes: goalMinutes,
        outfield_minutes: roundToTwo(input.total_minutes - goalMinutes),
        starts: false,
        sub_position: null
      });
    });
    outfieldPlayers.forEach((player) => {
      allocations.push({
        player_id: player.id,
        player_name: player.full_name,
        is_goalkeeper: false,
        goalkeeper_periods: [],
        total_minutes: outfieldFairShare,
        goal_minutes: 0,
        outfield_minutes: outfieldFairShare,
        starts: false,
        sub_position: null
      });
    });
  } else {
    rule = 'option_b';
    fairShare = baseFairShare;
    goalkeeperRuleApplied = 'Equal time for all - keepers return as outfield after goal stint';
    assignedKeepers.forEach((keeper) => {
      const goalMinutes = roundToTwo(periodDuration * keeper.goalkeeper_periods.length);
      const outfieldMinutes = roundToTwo(fairShare - goalMinutes);
      if (outfieldMinutes < 0) warnings.push(`${keeper.full_name}'s goal stint is longer than their fair share.`);
      allocations.push({
        player_id: keeper.id,
        player_name: keeper.full_name,
        is_goalkeeper: true,
        goalkeeper_periods: keeper.goalkeeper_periods,
        total_minutes: fairShare,
        goal_minutes: goalMinutes,
        outfield_minutes: Math.max(0, outfieldMinutes),
        starts: false,
        sub_position: null
      });
    });
    outfieldPlayers.forEach((player) => {
      allocations.push({
        player_id: player.id,
        player_name: player.full_name,
        is_goalkeeper: false,
        goalkeeper_periods: [],
        total_minutes: fairShare,
        goal_minutes: 0,
        outfield_minutes: fairShare,
        starts: false,
        sub_position: null
      });
    });
  }

  const rotationPool = rule === 'full_game' || rule === 'option_a' ? outfieldPlayers : input.players;
  const startingIds = buildStartingIds(input, pitchPlaces, assignedKeepers, outfieldPlayers);
  const subIds = rotationPool.filter((player) => !startingIds.includes(player.id)).sort(byName).map((player) => player.id);
  const allocationWithStarts = allocations.map((allocation) => ({
    ...allocation,
    starts: startingIds.includes(allocation.player_id),
    sub_position: subIds.includes(allocation.player_id) ? subIds.indexOf(allocation.player_id) + 1 : null
  }));
  const substitutionOrder = [
    ...buildGoalkeeperEvents(assignedKeepers, periodDuration, rule),
    ...(input.calculation_mode === 1 ? [] : buildRotationEvents(rotationPool, startingIds, fairShare))
  ].sort((a, b) => a.minute - b.minute);
  const outfieldTotal = allocationWithStarts.reduce((sum, allocation) => sum + allocation.outfield_minutes, 0);
  const expectedOutfield = input.total_minutes * outfieldPlaces;
  if (Math.abs(outfieldTotal - expectedOutfield) > 0.1) {
    warnings.push(`Outfield minutes total ${roundToTwo(outfieldTotal)} does not match expected ${roundToTwo(expectedOutfield)}.`);
  }

  return {
    fair_share_minutes: fairShare,
    period_duration: periodDuration,
    pitch_places: pitchPlaces,
    squad_size: squadSize,
    goalkeeper_count: goalkeeperCount,
    goalkeeper_rule_applied: goalkeeperRuleApplied,
    allocations: allocationWithStarts.sort((a, b) => Number(b.starts) - Number(a.starts) || (a.sub_position ?? 999) - (b.sub_position ?? 999) || a.player_name.localeCompare(b.player_name)),
    substitution_order: substitutionOrder,
    starting_xi: startingIds,
    warnings
  };
}

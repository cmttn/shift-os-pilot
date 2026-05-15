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
  rotation_interval_minutes: number | null;
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

export function getAllowedGoalkeeperCounts(periods: GamePeriods): number[] {
  if (periods === 2) return [0, 1, 2];
  if (periods === 3) return [0, 1, 3];
  return [0, 1, 2, 4];
}

export function validateGoalkeeperCount(goalkeeperCount: number, periods: GamePeriods): string | null {
  if (getAllowedGoalkeeperCounts(periods).includes(goalkeeperCount)) return null;
  if (periods === 2) return 'Halves allow 1 or 2 goalkeepers.';
  if (periods === 3) return 'Thirds allow 1 or 3 goalkeepers.';
  return 'Quarters allow 1, 2 or 4 goalkeepers.';
}

function assignGoalkeeperPeriods(keepers: Player[], periods: GamePeriods, warnings: string[]): Player[] {
  if (keepers.length === 0) return [];
  const assigned = keepers.map((keeper) => ({ ...keeper, goalkeeper_periods: [] as number[] }));
  for (let period = 1; period <= periods; period += 1) {
    const keeper = assigned[(period - 1) % assigned.length];
    keeper.goalkeeper_periods.push(period);
  }
  return assigned;
}

function buildStartingIds(input: PlaytimeInput, activePlaces: number, lockedKeeper: Player | null, rotationPlayers: Player[]): string[] {
  const startingIds: string[] = [];
  if (lockedKeeper) startingIds.push(lockedKeeper.id);
  const remainingSlots = Math.max(0, activePlaces - startingIds.length);
  if (input.calculation_mode === 2 && input.starters && input.starters.length > 0) {
    const pickedRotationStarters = input.starters
      .filter((id) => rotationPlayers.some((player) => player.id === id))
      .filter((id) => id !== lockedKeeper?.id)
      .slice(0, remainingSlots);
    startingIds.push(...pickedRotationStarters);
    const missingSlots = Math.max(0, activePlaces - startingIds.length);
    startingIds.push(...rotationPlayers.filter((player) => !startingIds.includes(player.id)).sort(byName).slice(0, missingSlots).map((player) => player.id));
    return startingIds;
  }
  if (input.calculation_mode !== 3) return [];
  startingIds.push(...rotationPlayers.slice().sort(byName).slice(0, remainingSlots).map((player) => player.id));
  return startingIds;
}

interface RotationPlan {
  minutesByPlayerId: Map<string, number>;
  events: SubstitutionEvent[];
  startingIds: string[];
  interval: number | null;
}

function buildRestingIds(orderedPlayers: Player[], activePlaces: number, blockIndex: number): Set<string> {
  const benchCount = Math.max(0, orderedPlayers.length - activePlaces);
  const restingIds = new Set<string>();
  if (benchCount === 0) return restingIds;
  const startIndex = blockIndex === 0 ? activePlaces : ((blockIndex - 1) * benchCount) % orderedPlayers.length;
  for (let offset = 0; offset < benchCount; offset += 1) {
    restingIds.add(orderedPlayers[(startIndex + offset) % orderedPlayers.length].id);
  }
  return restingIds;
}

function buildRotationPlan(players: Player[], activePlaces: number, totalMinutes: number, preferredStartingIds: string[]): RotationPlan {
  const minutesByPlayerId = new Map(players.map((player) => [player.id, 0]));
  if (players.length === 0 || activePlaces <= 0) return { minutesByPlayerId, events: [], startingIds: [], interval: null };
  if (players.length <= activePlaces) {
    players.forEach((player) => minutesByPlayerId.set(player.id, totalMinutes));
    return { minutesByPlayerId, events: [], startingIds: players.map((player) => player.id), interval: null };
  }

  const preferredStarters = preferredStartingIds
    .map((id) => players.find((player) => player.id === id))
    .filter((player): player is Player => Boolean(player))
    .slice(0, activePlaces);
  const orderedPlayers = [
    ...preferredStarters,
    ...players.filter((player) => !preferredStarters.some((starter) => starter.id === player.id)).sort(byName)
  ];
  const blockCount = players.length;
  const blockDuration = totalMinutes / blockCount;
  const events: SubstitutionEvent[] = [];
  let currentPlaying = orderedPlayers.filter((player) => !buildRestingIds(orderedPlayers, activePlaces, 0).has(player.id));

  for (let block = 0; block < blockCount; block += 1) {
    currentPlaying.forEach((player) => {
      minutesByPlayerId.set(player.id, roundToTwo((minutesByPlayerId.get(player.id) ?? 0) + blockDuration));
    });
    if (block === blockCount - 1) continue;
    const nextRestingIds = buildRestingIds(orderedPlayers, activePlaces, block + 1);
    const nextPlaying = orderedPlayers.filter((player) => !nextRestingIds.has(player.id));
    const playersOff = currentPlaying.filter((player) => !nextPlaying.some((next) => next.id === player.id));
    const playersOn = nextPlaying.filter((player) => !currentPlaying.some((current) => current.id === player.id));
    const minute = roundToTwo(blockDuration * (block + 1));
    playersOn.forEach((playerOn, index) => {
      const playerOff = playersOff[index];
      if (!playerOff) return;
      events.push({
        minute,
        player_off_id: playerOff.id,
        player_off_name: playerOff.full_name,
        player_on_id: playerOn.id,
        player_on_name: playerOn.full_name,
        reason: 'rotation'
      });
    });
    currentPlaying = nextPlaying;
  }

  return {
    minutesByPlayerId,
    events,
    startingIds: orderedPlayers.filter((player) => !buildRestingIds(orderedPlayers, activePlaces, 0).has(player.id)).map((player) => player.id),
    interval: roundToTwo(blockDuration)
  };
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
  const goalkeeperValidation = validateGoalkeeperCount(rawKeepers.length, input.periods);
  if (goalkeeperValidation) warnings.push(goalkeeperValidation);
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
      rotation_interval_minutes: null,
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

  const singleFullTimeKeeper = goalkeeperCount === 1 && input.format !== '3v3';
  const usesOutfieldOnlyRotation = singleFullTimeKeeper || (goalkeeperCount > 1 && rule === 'option_a');
  const rotationPool = usesOutfieldOnlyRotation ? outfieldPlayers : input.players;
  const activeRotationPlaces = usesOutfieldOnlyRotation ? outfieldPlaces : pitchPlaces;
  const lockedKeeper = singleFullTimeKeeper ? assignedKeepers[0] : null;
  const preferredStartingIds = buildStartingIds(input, pitchPlaces, lockedKeeper, rotationPool);
  const rotationPlan = input.calculation_mode === 1
    ? buildRotationPlan(rotationPool, activeRotationPlaces, input.total_minutes, rotationPool.slice().sort(byName).slice(0, activeRotationPlaces).map((player) => player.id))
    : buildRotationPlan(rotationPool, activeRotationPlaces, input.total_minutes, preferredStartingIds.filter((id) => id !== lockedKeeper?.id));
  const rotationMinutes = rotationPlan.minutesByPlayerId;

  if (goalkeeperCount === 0 || input.format === '3v3') {
    rule = 'none';
    fairShare = baseFairShare;
    input.players.forEach((player) => {
      allocations.push({
        player_id: player.id,
        player_name: player.full_name,
        is_goalkeeper: false,
        goalkeeper_periods: [],
        total_minutes: roundToTwo(rotationMinutes.get(player.id) ?? fairShare),
        goal_minutes: 0,
        outfield_minutes: roundToTwo(rotationMinutes.get(player.id) ?? fairShare),
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
        total_minutes: roundToTwo(rotationMinutes.get(player.id) ?? outfieldFairShare),
        goal_minutes: 0,
        outfield_minutes: roundToTwo(rotationMinutes.get(player.id) ?? outfieldFairShare),
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
        total_minutes: roundToTwo(rotationMinutes.get(keeper.id) ?? input.total_minutes),
        goal_minutes: goalMinutes,
        outfield_minutes: Math.max(0, roundToTwo((rotationMinutes.get(keeper.id) ?? input.total_minutes) - goalMinutes)),
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
        total_minutes: roundToTwo(rotationMinutes.get(player.id) ?? outfieldFairShare),
        goal_minutes: 0,
        outfield_minutes: roundToTwo(rotationMinutes.get(player.id) ?? outfieldFairShare),
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
      const totalPlayerMinutes = roundToTwo(rotationMinutes.get(keeper.id) ?? fairShare);
      const outfieldMinutes = roundToTwo(totalPlayerMinutes - goalMinutes);
      if (outfieldMinutes < 0) warnings.push(`${keeper.full_name}'s goal stint is longer than their fair share.`);
      allocations.push({
        player_id: keeper.id,
        player_name: keeper.full_name,
        is_goalkeeper: true,
        goalkeeper_periods: keeper.goalkeeper_periods,
        total_minutes: totalPlayerMinutes,
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
        total_minutes: roundToTwo(rotationMinutes.get(player.id) ?? fairShare),
        goal_minutes: 0,
        outfield_minutes: roundToTwo(rotationMinutes.get(player.id) ?? fairShare),
        starts: false,
        sub_position: null
      });
    });
  }

  const startingIds = input.calculation_mode === 1 ? (lockedKeeper ? [lockedKeeper.id] : []) : [...(lockedKeeper ? [lockedKeeper.id] : []), ...rotationPlan.startingIds];
  const subIds = rotationPool.filter((player) => !startingIds.includes(player.id)).sort(byName).map((player) => player.id);
  const allocationWithStarts = allocations.map((allocation) => ({
    ...allocation,
    starts: startingIds.includes(allocation.player_id),
    sub_position: subIds.includes(allocation.player_id) ? subIds.indexOf(allocation.player_id) + 1 : null
  }));
  const substitutionOrder = [
    ...buildGoalkeeperEvents(assignedKeepers, periodDuration, rule),
    ...(input.calculation_mode === 1 ? [] : rotationPlan.events)
  ].sort((a, b) => a.minute - b.minute);
  const outfieldTotal = allocationWithStarts.reduce((sum, allocation) => sum + allocation.outfield_minutes, 0);
  const expectedOutfield = input.total_minutes * (goalkeeperCount > 0 && input.format !== '3v3' ? outfieldPlaces : pitchPlaces);
  if (Math.abs(outfieldTotal - expectedOutfield) > 0.1) {
    warnings.push(`Outfield minutes total ${roundToTwo(outfieldTotal)} does not match expected ${roundToTwo(expectedOutfield)}.`);
  }

  return {
    fair_share_minutes: fairShare,
    rotation_interval_minutes: rotationPlan.interval,
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

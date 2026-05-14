export interface SrpPlayer {
  id: string;
  name: string;
}

export interface SrpSlot {
  id?: string;
  slot_date: string;
  player_id: string | null;
  locked?: boolean | null;
  assigned_by?: string | null;
}

export interface ManualAssignment {
  slotDate: string;
  playerId: string | null;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function generateWeekendSlots(startDate: string, cycleWeeks: number): string[] {
  const start = new Date(`${startDate}T12:00:00Z`);
  if (Number.isNaN(start.valueOf()) || !isWeekend(start)) {
    throw new Error('Start date must be a Saturday or Sunday.');
  }
  if (cycleWeeks < 2) {
    throw new Error('Rotation cycle must be at least 2 weeks.');
  }

  return Array.from({ length: cycleWeeks }, (_, index) => {
    const slot = new Date(start);
    slot.setUTCDate(start.getUTCDate() + index * 7);
    return toDateInputValue(slot);
  });
}

export function calculateCycleLength(players: SrpPlayer[], excludedGoalkeeperId: string | null): number {
  const activeCount = players.filter((player) => player.id !== excludedGoalkeeperId).length;
  return Math.max(activeCount, 0);
}

function shufflePlayers(players: SrpPlayer[]): SrpPlayer[] {
  const shuffled = [...players];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = shuffled[index];
    shuffled[index] = shuffled[swapIndex];
    shuffled[swapIndex] = current;
  }
  return shuffled;
}

export function randomlyAssignPlayersToOpenSlots(players: SrpPlayer[], slots: SrpSlot[]): SrpSlot[] {
  const assignedPlayerIds = new Set(slots.map((slot) => slot.player_id).filter((playerId): playerId is string => Boolean(playerId)));
  const availablePlayers = shufflePlayers(players.filter((player) => !assignedPlayerIds.has(player.id)));
  let playerIndex = 0;

  return slots.map((slot) => {
    if (slot.locked || slot.player_id || playerIndex >= availablePlayers.length) {
      return slot;
    }

    const player = availablePlayers[playerIndex];
    playerIndex += 1;
    return {
      ...slot,
      player_id: player.id,
      assigned_by: 'random_fill'
    };
  });
}

export function validateManualAssignments(assignments: ManualAssignment[]): string | null {
  const assigned = assignments.map((assignment) => assignment.playerId).filter((playerId): playerId is string => Boolean(playerId));
  if (assigned.length !== new Set(assigned).size) {
    return 'A player can only be assigned to one rotation week.';
  }
  if (assigned.length > assignments.length) {
    return 'There are more players assigned than rotation weeks.';
  }
  return null;
}

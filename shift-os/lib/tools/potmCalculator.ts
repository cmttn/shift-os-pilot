export interface PotmVote {
  voted_for_player_id: string;
  vote_weight: number;
}

export interface PotmWinnerResult {
  winner_player_id: string;
  was_tie: boolean;
  tied_player_ids: string[];
}

export interface ClubPotmSettings {
  message_mode: string;
  club_message?: string | null;
}

export interface CoachPotmSettings {
  coach_message?: string | null;
}

export function calculatePotmWinner(votes: PotmVote[]): PotmWinnerResult {
  const totals = new Map<string, number>();
  votes.forEach((vote) => {
    totals.set(vote.voted_for_player_id, (totals.get(vote.voted_for_player_id) ?? 0) + vote.vote_weight);
  });
  const entries = Array.from(totals.entries());
  if (entries.length === 0) {
    return { winner_player_id: '', was_tie: false, tied_player_ids: [] };
  }
  const maxVotes = Math.max(...entries.map(([, total]) => total));
  const tiedPlayerIds = entries.filter(([, total]) => total === maxVotes).map(([playerId]) => playerId);
  const winnerIndex = tiedPlayerIds.length > 1 ? Math.floor(Math.random() * tiedPlayerIds.length) : 0;
  return {
    winner_player_id: tiedPlayerIds[winnerIndex],
    was_tie: tiedPlayerIds.length > 1,
    tied_player_ids: tiedPlayerIds
  };
}

export function resolvePotmMessage(
  clubSettings: ClubPotmSettings | null,
  coachSettings: CoachPotmSettings | null,
  playerName: string
): string {
  if (clubSettings?.message_mode === 'club' && clubSettings.club_message?.trim()) {
    return clubSettings.club_message.trim();
  }
  if (coachSettings?.coach_message?.trim()) {
    return coachSettings.coach_message.trim();
  }
  return `Outstanding performance today - ${playerName}, you were brilliant from start to finish!`;
}

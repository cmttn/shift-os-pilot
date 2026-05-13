export interface TeamBrandingInput {
  team: {
    primary_colour?: string | null;
    secondary_colour?: string | null;
    badge_url?: string | null;
    club_id?: string | null;
  };
  club: {
    primary_colour: string | null;
    secondary_colour?: string | null;
    badge_url?: string | null;
    allow_team_colours?: boolean | null;
    allow_team_badges?: boolean | null;
  } | null;
}

export interface TeamBranding {
  primary_colour: string;
  secondary_colour: string;
  badge_url: string | null;
}

export function resolveTeamBranding(input: TeamBrandingInput): TeamBranding {
  const { team, club } = input;

  if (!club) {
    return {
      primary_colour: team.primary_colour ?? '#3b82f6',
      secondary_colour: team.secondary_colour ?? '#1e40af',
      badge_url: team.badge_url ?? null
    };
  }

  const clubPrimary = club.primary_colour ?? '#3b82f6';

  return {
    primary_colour: club.allow_team_colours && team.primary_colour ? team.primary_colour : clubPrimary,
    secondary_colour: club.allow_team_colours && team.secondary_colour ? team.secondary_colour : club.secondary_colour ?? clubPrimary,
    badge_url: club.allow_team_badges && team.badge_url ? team.badge_url : club.badge_url ?? null
  };
}

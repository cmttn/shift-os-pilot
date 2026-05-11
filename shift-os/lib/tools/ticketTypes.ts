export const PARENT_TICKET_TYPES = [
  {
    id: 'coach_positive',
    label: 'Coach Positive Feedback',
    emoji: '+',
    description: 'Share something great your coach has done',
    routes_to: ['coach'] as const,
    is_safeguarding: false,
    is_positive: true,
    default_outcome: 'log_only',
    can_log_only: true,
    priority: 'normal'
  },
  {
    id: 'playtime_concern',
    label: 'Playtime Concern',
    emoji: '!',
    description: 'Concern about playing time or fairness',
    routes_to: ['coach'] as const,
    is_safeguarding: false,
    is_positive: false,
    default_outcome: 'log_only',
    can_log_only: true,
    priority: 'normal'
  },
  {
    id: 'coach_behaviour',
    label: 'Worry About Coach Behaviour',
    emoji: '!',
    description: 'Concern about coach conduct or behaviour',
    routes_to: ['club'] as const,
    is_safeguarding: true,
    is_positive: false,
    default_outcome: 'followup',
    can_log_only: false,
    priority: 'urgent'
  },
  {
    id: 'parent_issue',
    label: 'Other Parent Issues',
    emoji: 'P',
    description: 'Issues involving other parents',
    routes_to: ['club'] as const,
    is_safeguarding: false,
    is_positive: false,
    default_outcome: 'log_only',
    can_log_only: true,
    priority: 'normal'
  },
  {
    id: 'child_issue',
    label: 'Child Issue',
    emoji: 'C',
    description: "Concerns about your child's wellbeing or experience",
    routes_to: ['coach', 'club'] as const,
    is_safeguarding: false,
    is_positive: false,
    default_outcome: 'log_only',
    can_log_only: true,
    priority: 'normal'
  },
  {
    id: 'parent_helping',
    label: 'Parent Helping Out',
    emoji: '+',
    description: 'Recognise a parent going above and beyond',
    routes_to: ['coach', 'club'] as const,
    is_safeguarding: false,
    is_positive: true,
    default_outcome: 'log_only',
    can_log_only: true,
    priority: 'normal'
  },
  {
    id: 'club_positive',
    label: 'Positive Club Feedback',
    emoji: '*',
    description: 'Share something great about the club',
    routes_to: ['club'] as const,
    is_safeguarding: false,
    is_positive: true,
    default_outcome: 'log_only',
    can_log_only: true,
    priority: 'normal'
  },
  {
    id: 'please_contact',
    label: 'Please Contact Me',
    emoji: '>',
    description: 'Request a conversation with coach or club',
    routes_to: ['choice'] as const,
    is_safeguarding: false,
    is_positive: false,
    default_outcome: 'followup',
    can_log_only: false,
    priority: 'normal'
  }
] as const;

export const COACH_TICKET_TYPES = [
  {
    id: 'club_issue',
    label: 'Club Issue',
    emoji: '!',
    description: 'An issue needing club admin attention',
    routes_to: ['club'] as const,
    is_safeguarding: false,
    is_positive: false,
    default_outcome: 'log_only',
    can_log_only: true,
    priority: 'normal'
  },
  {
    id: 'club_feedback',
    label: 'Club Feedback',
    emoji: '+',
    description: 'Positive or constructive feedback for the club',
    routes_to: ['club'] as const,
    is_safeguarding: false,
    is_positive: true,
    default_outcome: 'log_only',
    can_log_only: true,
    priority: 'normal'
  },
  {
    id: 'parent_issue',
    label: 'Parent Issue',
    emoji: 'P',
    description: 'An issue involving a parent needing club support',
    routes_to: ['club'] as const,
    is_safeguarding: false,
    is_positive: false,
    default_outcome: 'log_only',
    can_log_only: true,
    priority: 'normal'
  },
  {
    id: 'player_issue',
    label: 'Player Issue',
    emoji: 'C',
    description: 'A welfare or development concern about a player',
    routes_to: ['club'] as const,
    is_safeguarding: true,
    is_positive: false,
    default_outcome: 'followup',
    can_log_only: false,
    priority: 'urgent'
  },
  {
    id: 'social_issue',
    label: 'Social Issue',
    emoji: '!',
    description: 'A social, safeguarding or behavioural concern',
    routes_to: ['club'] as const,
    is_safeguarding: true,
    is_positive: false,
    default_outcome: 'followup',
    can_log_only: false,
    priority: 'urgent'
  },
  {
    id: 'please_contact',
    label: 'Please Contact Me',
    emoji: '>',
    description: 'Request a conversation with club admin',
    routes_to: ['club'] as const,
    is_safeguarding: false,
    is_positive: false,
    default_outcome: 'followup',
    can_log_only: false,
    priority: 'normal'
  }
] as const;

export type ParentTicketTypeId = typeof PARENT_TICKET_TYPES[number]['id'];
export type CoachTicketTypeId = typeof COACH_TICKET_TYPES[number]['id'];
export type TicketAudience = 'coach' | 'club' | 'choice';
export type TicketOutcome = 'log_only' | 'followup';
export type TicketPriority = 'normal' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'viewed' | 'in_progress' | 'resolved';

export interface TicketTypeDefinition {
  id: ParentTicketTypeId | CoachTicketTypeId;
  label: string;
  emoji: string;
  description: string;
  routes_to: readonly TicketAudience[];
  is_safeguarding: boolean;
  is_positive: boolean;
  default_outcome: TicketOutcome;
  can_log_only: boolean;
  priority: TicketPriority;
}

export function findParentTicketType(id: string): TicketTypeDefinition | null {
  return (PARENT_TICKET_TYPES as readonly TicketTypeDefinition[]).find((type) => type.id === id) ?? null;
}

export function findCoachTicketType(id: string): TicketTypeDefinition | null {
  return (COACH_TICKET_TYPES as readonly TicketTypeDefinition[]).find((type) => type.id === id) ?? null;
}

export function getTicketSeason(date = new Date()): string {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  if (month >= 9) return `${year}-${String(year + 1).slice(2)}`;
  if (month <= 6) return `${year - 1}-${String(year).slice(2)}`;
  return 'off-season';
}

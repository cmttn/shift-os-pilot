export type ToolFeatureKey =
  | 'squad_rotation_planner'
  | 'potm'
  | 'fair_play_reports'
  | 'structured_conversations'
  | 'recognition'
  | 'availability_manager';

export interface ToolDefinition {
  key: ToolFeatureKey;
  name: string;
  shortName?: string;
  description: string;
  coachPath?: string;
  clubPath?: string;
  defaultEnabled: boolean;
}

export const TOOL_REGISTRY: ToolDefinition[] = [
  {
    key: 'squad_rotation_planner',
    name: 'Squad Rotation Planner',
    shortName: 'SRP',
    description: 'Plan fair squad rotation weeks to reduce sideline minutes, lower matchday pressure and give players more meaningful minutes.',
    coachPath: '/dashboard/coach/tools/srp',
    defaultEnabled: false
  },
  {
    key: 'potm',
    name: 'Player of the Match',
    description: 'Run simple POTM voting and recognition flows after matches.',
    coachPath: '/dashboard/coach/tools/potm',
    clubPath: '/dashboard/club/settings/potm',
    defaultEnabled: true
  },
  {
    key: 'fair_play_reports',
    name: 'Fair Play Time',
    description: 'Plan game time fairly and reduce pressure around substitutions.',
    coachPath: '/dashboard/coach/sessions',
    defaultEnabled: false
  },
  {
    key: 'structured_conversations',
    name: 'Tickets',
    description: 'Structured feedback, concerns and safeguarding routes without WhatsApp chaos.',
    coachPath: '/dashboard/coach/tickets',
    defaultEnabled: true
  },
  {
    key: 'recognition',
    name: 'Stars / Recognition',
    description: 'Encourage effort, enjoyment and positive player development.',
    clubPath: '/dashboard/club/settings/recognition',
    defaultEnabled: true
  },
  {
    key: 'availability_manager',
    name: 'Availability / Fixtures',
    description: 'Manage availability, matchdays and session responses clearly.',
    coachPath: '/dashboard/coach/schedule',
    defaultEnabled: true
  }
];

export const TOOL_FEATURE_KEYS = TOOL_REGISTRY.map((tool) => tool.key);

export function isToolFeatureKey(value: string): value is ToolFeatureKey {
  return TOOL_FEATURE_KEYS.some((key) => key === value);
}

export function getToolDefinition(featureKey: string): ToolDefinition | undefined {
  return TOOL_REGISTRY.find((tool) => tool.key === featureKey);
}

export function getDefaultEnabledToolKeys(): ToolFeatureKey[] {
  return TOOL_REGISTRY.filter((tool) => tool.defaultEnabled).map((tool) => tool.key);
}

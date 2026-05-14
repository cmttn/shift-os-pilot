'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { CoachDashboardData } from '@/lib/dashboard/getCoachData';
import { createClient } from '@/lib/supabase/client';
import { TOOL_REGISTRY, type ToolDefinition, type ToolFeatureKey } from '@/lib/tools/toolRegistry';
import { contrastText } from '@/lib/utils/contrastText';

interface CoachToolsStripProps {
  data: CoachDashboardData;
  activeTeamId: string;
  primaryColour: string;
  variant: 'mobile' | 'desktop';
}

type ToolState = 'available' | 'locked' | 'requested';

interface ToolCardModel {
  tool: ToolDefinition;
  state: ToolState;
  isNewlyAvailable: boolean;
}

function getPendingRequestKey(teamId: string, featureKey: ToolFeatureKey): string {
  return `${teamId}:${featureKey}`;
}

function getToolSortScore(item: ToolCardModel): number {
  if (item.isNewlyAvailable) return 0;
  if (item.state === 'available') return 1;
  if (item.state === 'requested') return 2;
  return 3;
}

export default function CoachToolsStrip({ data, activeTeamId, primaryColour, variant }: CoachToolsStripProps) {
  const activeTeam = data.teams.find((team) => team.id === activeTeamId) ?? data.teams[0] ?? null;
  const initialRequested = data.toolUnlockRequests
    .filter((request) => request.status === 'pending')
    .map((request) => getPendingRequestKey(request.team_id ?? '', request.feature_key as ToolFeatureKey));
  const [requestedKeys, setRequestedKeys] = useState<string[]>(initialRequested);
  const [loadingKey, setLoadingKey] = useState<ToolFeatureKey | null>(null);
  const [error, setError] = useState('');
  const buttonTextColour = contrastText(primaryColour);

  const cards = useMemo<ToolCardModel[]>(() => {
    return TOOL_REGISTRY.map((tool) => {
      const enabled = !data.isClubManaged || data.enabledFeatures.includes(tool.key);
      const requestKey = getPendingRequestKey(activeTeamId, tool.key);
      const requested = requestedKeys.includes(requestKey);
      const state: ToolState = enabled ? 'available' : requested ? 'requested' : 'locked';
      return {
        tool,
        state,
        isNewlyAvailable: enabled && !tool.defaultEnabled
      };
    }).sort((first, second) => getToolSortScore(first) - getToolSortScore(second) || first.tool.name.localeCompare(second.tool.name));
  }, [activeTeamId, data.enabledFeatures, data.isClubManaged, requestedKeys]);

  const requestUnlock = async (tool: ToolDefinition) => {
    if (!activeTeam?.club_id) {
      setError('This team is not linked to a club yet.');
      return;
    }

    setLoadingKey(tool.key);
    setError('');
    const requestKey = getPendingRequestKey(activeTeam.id, tool.key);
    setRequestedKeys((current) => current.includes(requestKey) ? current : [...current, requestKey]);

    const { error: insertError } = await createClient()
      .from('tool_unlock_requests')
      .insert({
        club_id: activeTeam.club_id,
        team_id: activeTeam.id,
        coach_user_id: data.coach.id,
        feature_key: tool.key,
        status: 'pending',
        updated_at: new Date().toISOString()
      });

    setLoadingKey(null);
    if (insertError && insertError.code !== '23505') {
      setRequestedKeys((current) => current.filter((key) => key !== requestKey));
      setError(insertError.message || 'Could not request this tool yet.');
    }
  };

  const wrapperClass = variant === 'mobile' ? 'md:hidden' : 'hidden md:block';
  const listClass = variant === 'mobile'
    ? '-mx-5 flex gap-3 overflow-x-auto px-5 pb-2'
    : 'grid grid-cols-2 gap-3';
  const cardClass = variant === 'mobile'
    ? 'flex w-[210px] shrink-0 flex-col rounded-2xl border p-4'
    : 'flex min-h-[180px] flex-col rounded-2xl border p-4';

  return (
    <section className={`${wrapperClass} ${variant === 'mobile' ? 'mb-8' : 'mt-8'}`}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Tools</h2>
          <p className="mt-1 text-xs text-white/35">{data.isClubManaged ? `Managed by ${activeTeam?.club_name ?? 'your club'}` : 'Ready for this team'}</p>
        </div>
      </div>
      {error ? <p className="mb-3 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-xs text-red-100">{error}</p> : null}
      <div className={listClass}>
        {cards.map(({ tool, state, isNewlyAvailable }) => {
          const isAvailable = state === 'available';
          return (
            <article
              key={tool.key}
              className={cardClass}
              style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: isNewlyAvailable ? `${primaryColour}66` : 'rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-white">{tool.shortName ?? tool.name}</p>
                  {tool.shortName ? <p className="mt-0.5 text-[11px] text-white/30">{tool.name}</p> : null}
                </div>
                <span
                  className="rounded-full px-2 py-1 text-[10px] font-semibold"
                  style={
                    isAvailable
                      ? { backgroundColor: `${primaryColour}24`, color: primaryColour }
                      : state === 'requested'
                        ? { backgroundColor: 'rgba(245,158,11,0.12)', color: '#fbbf24' }
                        : { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }
                  }
                >
                  {isAvailable ? 'Available' : state === 'requested' ? 'Requested' : 'Locked'}
                </span>
              </div>
              <p className="mt-3 flex-1 text-xs leading-relaxed text-white/40">{tool.description}</p>
              {isNewlyAvailable ? <p className="mt-3 rounded-xl bg-white/[0.04] px-3 py-2 text-xs text-white">New tool available: {tool.name} - Try now.</p> : null}
              <div className="mt-4">
                {isAvailable && tool.coachPath ? (
                  <Link href={tool.coachPath} className="inline-flex w-full justify-center rounded-full px-4 py-2 text-sm font-semibold" style={{ backgroundColor: primaryColour, color: buttonTextColour }}>
                    Open
                  </Link>
                ) : state === 'requested' ? (
                  <button type="button" disabled className="w-full rounded-full border border-white/[0.08] px-4 py-2 text-sm font-semibold text-white/35">
                    Requested
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => requestUnlock(tool)}
                    disabled={loadingKey === tool.key}
                    className="w-full rounded-full border border-white/[0.1] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.06] disabled:cursor-wait disabled:opacity-55"
                  >
                    {loadingKey === tool.key ? 'Requesting...' : 'Request unlock'}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

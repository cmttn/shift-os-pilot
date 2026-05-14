'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TOOL_REGISTRY, type ToolFeatureKey } from '@/lib/tools/toolRegistry';
import { contrastText } from '@/lib/utils/contrastText';

export interface ClubToolToggle {
  feature_key: string | null;
  is_enabled: boolean | null;
}

export interface ClubToolRequest {
  id: string;
  feature_key: string;
  coach_name: string;
  coach_email: string | null;
  team_name: string | null;
  created_at: string | null;
}

interface ClubToolsClientProps {
  clubId: string;
  clubName: string;
  primaryColour: string;
  initialToggles: ClubToolToggle[];
  requests: ClubToolRequest[];
}

function buildInitialToggleState(toggles: ClubToolToggle[]): Record<ToolFeatureKey, boolean> {
  return TOOL_REGISTRY.reduce<Record<ToolFeatureKey, boolean>>((state, tool) => {
    const toggle = toggles.find((item) => item.feature_key === tool.key);
    return {
      ...state,
      [tool.key]: toggle ? Boolean(toggle.is_enabled) : tool.defaultEnabled
    };
  }, {
    squad_rotation_planner: false,
    potm: true,
    fair_play_reports: false,
    structured_conversations: true,
    recognition: true,
    availability_manager: true
  });
}

function pluraliseCoach(count: number): string {
  return count === 1 ? 'coach' : 'coaches';
}

export default function ClubToolsClient({ clubId, clubName, primaryColour, initialToggles, requests }: ClubToolsClientProps) {
  const [toggles, setToggles] = useState<Record<ToolFeatureKey, boolean>>(() => buildInitialToggleState(initialToggles));
  const [savingKey, setSavingKey] = useState<ToolFeatureKey | null>(null);
  const [error, setError] = useState('');
  const primaryText = contrastText(primaryColour);

  const requestGroups = useMemo(() => {
    return TOOL_REGISTRY.reduce<Record<ToolFeatureKey, ClubToolRequest[]>>((groups, tool) => {
      return {
        ...groups,
        [tool.key]: requests.filter((request) => request.feature_key === tool.key)
      };
    }, {
      squad_rotation_planner: [],
      potm: [],
      fair_play_reports: [],
      structured_conversations: [],
      recognition: [],
      availability_manager: []
    });
  }, [requests]);

  const toggleTool = async (featureKey: ToolFeatureKey) => {
    const nextEnabled = !toggles[featureKey];
    const previousEnabled = toggles[featureKey];
    setToggles((current) => ({ ...current, [featureKey]: nextEnabled }));
    setSavingKey(featureKey);
    setError('');

    const { error: saveError } = await createClient()
      .from('feature_toggles')
      .upsert({
        club_id: clubId,
        feature_key: featureKey,
        is_enabled: nextEnabled,
        updated_at: new Date().toISOString()
      }, { onConflict: 'club_id,feature_key' });

    setSavingKey(null);
    if (saveError) {
      setToggles((current) => ({ ...current, [featureKey]: previousEnabled }));
      setError(saveError.message || 'Tool setting could not be saved.');
    }
  };

  return (
    <div className="min-h-screen px-5 pb-24 pt-5 text-white md:px-8 md:py-8" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.28em] text-white/25">{clubName}</p>
          <h1 className="mt-2 text-3xl font-black text-white">Tools</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/40">
            Enable, lock or review coach requests for club tools.
          </p>
        </div>

        {error ? <p className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {TOOL_REGISTRY.map((tool) => {
            const enabled = toggles[tool.key];
            const toolRequests = requestGroups[tool.key];
            return (
              <article
                key={tool.key}
                className="rounded-2xl border p-5 transition-all duration-300 ease-out"
                style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: enabled ? `${primaryColour}55` : 'rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-white">{tool.name}</h2>
                      {tool.shortName ? <span className="rounded-full bg-white/[0.06] px-2 py-1 text-[10px] font-semibold text-white/40">{tool.shortName}</span> : null}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-white/40">{tool.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleTool(tool.key)}
                    disabled={savingKey === tool.key}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition-all duration-300 ease-out disabled:cursor-wait disabled:opacity-60 ${enabled ? '' : 'bg-white/[0.08]'}`}
                    style={enabled ? { backgroundColor: primaryColour } : undefined}
                    aria-label={`${enabled ? 'Disable' : 'Enable'} ${tool.name}`}
                  >
                    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all duration-300 ease-out ${enabled ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={enabled ? { backgroundColor: `${primaryColour}24`, color: primaryColour } : { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}
                  >
                    {enabled ? 'Enabled' : 'Locked'}
                  </span>
                  <span className="rounded-full bg-white/[0.04] px-3 py-1 text-xs text-white/35">
                    {toolRequests.length} request{toolRequests.length === 1 ? '' : 's'}
                  </span>
                </div>

                {toolRequests.length > 0 ? (
                  <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                    <p className="text-xs font-semibold text-white">Requested by {toolRequests.length} {pluraliseCoach(toolRequests.length)}</p>
                    <p className="mt-1 text-xs text-white/30">Coaches have asked to use this tool.</p>
                    <div className="mt-3 space-y-2">
                      {toolRequests.map((request) => (
                        <div key={request.id} className="rounded-lg bg-white/[0.035] px-3 py-2">
                          <p className="text-sm font-semibold text-white">{request.coach_name}</p>
                          <p className="mt-0.5 text-xs text-white/35">{[request.team_name, request.coach_email].filter(Boolean).join(' | ') || 'Coach request'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {tool.clubPath ? (
                  <Link href={tool.clubPath} className="mt-4 inline-flex rounded-full px-4 py-2 text-sm font-semibold" style={{ backgroundColor: primaryColour, color: primaryText }}>
                    Configure
                  </Link>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

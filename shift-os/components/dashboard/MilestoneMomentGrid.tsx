'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { awardStars } from '@/lib/tools/starAwarder';
import type { MILESTONES } from '@/lib/tools/starCategories';

type Milestone = typeof MILESTONES[number];

interface MilestoneMomentGridProps {
  playerId: string;
  parentUserId: string;
  achievedIds: string[];
  milestones: readonly Milestone[];
}

export default function MilestoneMomentGrid({ playerId, parentUserId, achievedIds, milestones }: MilestoneMomentGridProps) {
  const [achieved, setAchieved] = useState(() => new Set(achievedIds));
  const [confirming, setConfirming] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function logMilestone(milestone: Milestone) {
    setSaving(true);
    setMessage('');
    const supabase = createClient();
    const { error: insertError } = await supabase.from('player_milestone_achievements').insert({
      player_id: playerId,
      milestone_id: milestone.id
    });

    if (insertError) {
      setMessage('This moment has already been logged.');
      setAchieved((current) => new Set(current).add(milestone.id));
      setConfirming(null);
      setSaving(false);
      return;
    }

    const result = await awardStars({
      player_id: playerId,
      parent_user_id: parentUserId,
      session_id: null,
      stars: milestone.goals,
      category: 'potm',
      parent_message: null,
      supabase
    });

    if (!result.success) {
      setMessage('Moment logged, but goals could not be added yet. Check the goals SQL has been run.');
    } else {
      setMessage(`${milestone.label} - +${milestone.goals} goals added`);
    }

    setAchieved((current) => new Set(current).add(milestone.id));
    setConfirming(null);
    setSaving(false);
  }

  return (
    <section className="mt-8">
      <h2 className="text-xs font-bold uppercase tracking-[0.24em] text-white/35">Milestone moments</h2>
      {message ? <p className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-sm text-white/55">{message}</p> : null}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {milestones.map((milestone) => {
          const logged = achieved.has(milestone.id);
          const active = confirming === milestone.id;
          return (
            <div key={milestone.id} className="rounded-lg border bg-white/[0.02] p-3" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <button
                type="button"
                disabled={logged || saving}
                onClick={() => setConfirming(active ? null : milestone.id)}
                className={`w-full text-left text-xs transition-colors duration-300 ease-out ${logged ? 'cursor-default text-white/20' : 'text-white/60 hover:text-white'}`}
              >
                <span className="block">{milestone.label}</span>
                {logged ? <span className="mt-1 block text-white/25">Logged</span> : null}
              </button>
              {active && !logged ? (
                <div className="mt-3 rounded-lg border border-white/[0.06] bg-[#080a0f] p-3">
                  <p className="text-xs text-white/55">Log {milestone.label} for this player? +{milestone.goals} goals</p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" disabled={saving} onClick={() => void logMilestone(milestone)} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#080a0f] disabled:opacity-50">Confirm</button>
                    <button type="button" disabled={saving} onClick={() => setConfirming(null)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/60 disabled:opacity-50">Cancel</button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

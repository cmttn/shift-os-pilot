'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { awardStars } from '@/lib/tools/starAwarder';
import { getCategoryMeta, MILESTONES, type MilestoneId, type ParentStarCategory } from '@/lib/tools/starCategories';

export interface GoalAwardSession {
  id: string;
  type: string;
  opponent: string | null;
  title: string | null;
  session_date: string;
}

interface GoalAwardSheetProps {
  playerId: string;
  playerName: string;
  session: GoalAwardSession;
  primaryColour: string;
  onClose: () => void;
  onComplete: (goalsAwarded: number) => void;
  variant?: 'sheet' | 'page';
}

interface GoalCategoryRow {
  category: ParentStarCategory;
}

interface MilestoneRow {
  milestone_id: string;
}

interface GoalAwardTriggerProps {
  playerId: string;
  playerName: string;
  session: GoalAwardSession;
  primaryColour: string;
}

function formatDay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function sessionType(value: string): string {
  if (value === 'match') return 'Match';
  if (value === 'tournament') return 'Tournament';
  return 'Training';
}

function sessionLabel(session: GoalAwardSession): string {
  const opponent = session.opponent ? ` vs ${session.opponent}` : session.title ? ` - ${session.title}` : '';
  return `${sessionType(session.type)}${opponent} | ${formatDay(session.session_date)}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  if (value.length !== 6) return `rgba(255,255,255,${alpha})`;
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function totalButtonLabel(goals: 1 | 2 | 3 | null, milestoneId: MilestoneId | null): string {
  if (!goals) return 'Award goals';
  const milestone = milestoneId ? MILESTONES.find((item) => item.id === milestoneId) ?? null : null;
  const total = goals + (milestone?.goals ?? 0);
  if (!milestone) return `Award ${total} ${total === 1 ? 'goal' : 'goals'}`;
  return `Award ${total} goals (${goals} + ${milestone.goals} milestone)`;
}

export default function GoalAwardSheet({ playerId, playerName, session, primaryColour, onClose, onComplete, variant = 'sheet' }: GoalAwardSheetProps) {
  const [goals, setGoals] = useState<1 | 2 | 3 | null>(null);
  const [category, setCategory] = useState<ParentStarCategory | null>(null);
  const [achievedIds, setAchievedIds] = useState<Set<string>>(new Set());
  const [milestonesOpen, setMilestonesOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneId | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [completeMessage, setCompleteMessage] = useState('');
  const categoryMeta = category ? getCategoryMeta(category) : null;

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: categoryData }, { data: milestoneData }] = await Promise.all([
        supabase.from('player_star_goals').select('category').eq('player_id', playerId).eq('session_id', session.id).maybeSingle<GoalCategoryRow>(),
        supabase.from('player_milestone_achievements').select('milestone_id').eq('player_id', playerId)
      ]);
      setCategory(categoryData?.category ?? null);
      setAchievedIds(new Set(((milestoneData ?? []) as MilestoneRow[]).map((row) => row.milestone_id)));
    }

    void load();
  }, [playerId, session.id]);

  const unachievedMilestones = useMemo(() => MILESTONES.filter((milestone) => !achievedIds.has(milestone.id)), [achievedIds]);
  const options: Array<{ value: 1 | 2 | 3; title: string; label: string; colour: string; weight: string }> = [
    { value: 1, title: 'Good effort', label: '1 goal', colour: 'rgba(255,255,255,0.15)', weight: 'font-medium' },
    { value: 2, title: 'Great session', label: '2 goals', colour: primaryColour, weight: 'font-semibold' },
    { value: 3, title: 'Outstanding', label: '3 goals', colour: '#10b981', weight: 'font-bold' }
  ];

  async function submitAward() {
    if (!goals) return;
    setSaving(true);
    setError('');
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      setError('Please sign in again before awarding goals.');
      setSaving(false);
      return;
    }

    const mainResult = await awardStars({
      player_id: playerId,
      parent_user_id: user.id,
      session_id: session.id,
      stars: goals,
      category: category ?? 'effort',
      parent_message: null,
      supabase
    });

    if (!mainResult.success) {
      setError('Goals could not be awarded yet. Please check the goals SQL has been run.');
      setSaving(false);
      return;
    }

    let totalAwarded = goals;
    let finalTotal = mainResult.new_total;
    const milestone = selectedMilestone ? MILESTONES.find((item) => item.id === selectedMilestone) ?? null : null;
    if (milestone) {
      const { error: milestoneError } = await supabase.from('player_milestone_achievements').insert({
        player_id: playerId,
        milestone_id: milestone.id,
        session_id: session.id,
        opponent: session.opponent ?? session.title,
        session_date: session.session_date
      });

      if (!milestoneError) {
        const milestoneResult = await awardStars({
          player_id: playerId,
          parent_user_id: user.id,
          session_id: session.id,
          stars: milestone.goals,
          category: 'potm',
          parent_message: null,
          supabase
        });
        if (milestoneResult.success) {
          totalAwarded += milestone.goals;
          finalTotal = milestoneResult.new_total;
        }
      }
    }

    setCompleteMessage(`${totalAwarded} goals added. ${playerName} now has ${finalTotal} goals this season.`);
    onComplete(totalAwarded);
    setSaving(false);
  }

  const content = (
    <div className={variant === 'sheet' ? 'max-h-[85vh] overflow-y-auto rounded-t-[20px] border-x border-t border-white/[0.06] bg-[#0d1117]' : 'rounded-2xl border border-white/[0.06] bg-[#0d1117]'}>
      {variant === 'sheet' ? <div className="mx-auto mt-3 h-1 w-8 rounded-full bg-white/20" /> : null}
      <div className="px-5 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-white">{playerName}&apos;s goals</h2>
            <p className="mt-1 text-sm text-white/40">{sessionLabel(session)}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/45 transition-colors duration-300 ease-out hover:text-white">Close</button>
        </div>
        {categoryMeta ? (
          <div className="mt-4 inline-flex rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-sm font-medium text-white" style={{ borderLeft: `3px solid ${categoryMeta.colour}` }}>
            {categoryMeta.label}
          </div>
        ) : null}
      </div>

      <section className="mt-6 space-y-2 px-5">
        {options.map((option) => {
          const selected = goals === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setGoals(option.value)}
              className="flex min-h-16 w-full items-center rounded-xl border bg-white/[0.02] px-4 text-left transition-all duration-300 ease-out hover:bg-white/[0.04]"
              style={{
                borderColor: selected ? option.colour : 'rgba(255,255,255,0.06)',
                borderLeft: `3px solid ${option.colour}`,
                backgroundColor: selected ? hexToRgba(option.colour, 0.06) : 'rgba(255,255,255,0.02)'
              }}
            >
              <span className={`flex-1 text-white ${option.weight}`}>{option.title}</span>
              <span className="text-sm text-white/35">{option.label}</span>
              {selected ? <span className="ml-3 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: option.colour }}>✓</span> : null}
            </button>
          );
        })}
      </section>

      <section className="mt-6 px-5">
        <button type="button" onClick={() => setMilestonesOpen((value) => !value)} className="text-sm font-medium text-white/50 transition-colors duration-300 ease-out hover:text-white">
          + Add a milestone
        </button>
        {milestonesOpen ? (
          <div className="mt-3 space-y-2">
            {unachievedMilestones.length === 0 ? <p className="text-sm text-white/30">All milestones achieved</p> : unachievedMilestones.map((milestone) => {
              const selected = selectedMilestone === milestone.id;
              return (
                <button
                  key={milestone.id}
                  type="button"
                  onClick={() => setSelectedMilestone(selected ? null : milestone.id)}
                  className="flex w-full items-center gap-3 rounded-lg border bg-white/[0.02] p-3 text-left transition-all duration-300 ease-out hover:bg-white/[0.04]"
                  style={{ borderColor: selected ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)', backgroundColor: selected ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)' }}
                >
                  <span className="flex-1 text-sm text-white/60">{milestone.label}</span>
                  <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-xs text-emerald-400">+{milestone.goals} goals</span>
                  {selected ? <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#080a0f]">✓</span> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </section>

      {error ? <p className="mx-5 mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">{error}</p> : null}
      {completeMessage ? <p className="mx-5 mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-100">{completeMessage}</p> : null}

      <div className="sticky bottom-0 mt-4 bg-[#0d1117] px-5 pb-8 pt-4">
        <button
          type="button"
          disabled={!goals || saving || Boolean(completeMessage)}
          onClick={() => void submitAward()}
          className="min-h-[52px] w-full rounded-full px-6 py-3 font-bold text-white transition-all duration-300 ease-out disabled:opacity-40"
          style={{ background: `linear-gradient(135deg, ${primaryColour}, #059669)` }}
        >
          {saving ? 'Saving...' : totalButtonLabel(goals, selectedMilestone)}
        </button>
      </div>
    </div>
  );

  if (variant === 'page') return content;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm">
      <div className="w-full animate-[slideUp_300ms_ease-out]">{content}</div>
    </div>
  );
}

export function GoalAwardTrigger({ playerId, playerName, session, primaryColour }: GoalAwardTriggerProps) {
  const [open, setOpen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const router = useRouter();

  if (completed) return null;

  return (
    <>
      <section className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
        <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center justify-between gap-4 text-left">
          <span>
            <span className="block text-sm font-semibold text-white">Award {playerName}&apos;s goals</span>
            <span className="mt-1 block text-xs text-white/40">{sessionLabel(session)}</span>
          </span>
          <span className="shrink-0 text-sm font-semibold" style={{ color: primaryColour }}>Award -&gt;</span>
        </button>
      </section>
      {open ? (
        <GoalAwardSheet
          playerId={playerId}
          playerName={playerName}
          session={session}
          primaryColour={primaryColour}
          onClose={() => setOpen(false)}
          onComplete={() => {
            setCompleted(true);
            setOpen(false);
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}

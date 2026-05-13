import Link from 'next/link';
import { redirect } from 'next/navigation';
import PlayerAccessTree from '@/components/dashboard/PlayerAccessTree';
import { getFamilyDashboardData } from '@/lib/dashboard/getFamilyDashboardData';
import { MILESTONES } from '@/lib/tools/starCategories';

interface FamilyPlayerPageProps {
  params: {
    playerId: string;
  };
}

function formatDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '';
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function sessionTitle(teamName: string, session: { type: string; opponent: string | null; title: string | null }): string {
  if (session.type === 'match') return `${teamName} v ${session.opponent ?? 'Opponent TBC'}`;
  if (session.type === 'tournament') return session.title ?? session.opponent ?? 'Tournament';
  return session.title ?? 'Training Session';
}

function milestoneLabel(id: string): string {
  return MILESTONES.find((milestone) => milestone.id === id)?.label ?? id;
}

export default async function FamilyPlayerPage({ params }: FamilyPlayerPageProps) {
  const data = await getFamilyDashboardData();
  if (!data) redirect('/auth/login');
  const player = data.players.find((item) => item.id === params.playerId);
  if (!player) redirect('/dashboard/family');

  const heroSession = player.sessions[0] ?? null;

  return (
    <main className="min-h-screen pb-24 text-white" style={{ backgroundColor: '#080a0f' }}>
      <div className="border-b border-white/[0.04] bg-white/[0.03] py-2 text-center text-xs text-white/40">
        You&apos;re viewing as {player.first_name}&apos;s Football Family
      </div>
      <section className="mx-auto max-w-[520px] px-5 py-6">
        <header className="flex items-center justify-between gap-4">
          <Link href="/dashboard/family" className="text-sm text-white/40">Back</Link>
          <p className="text-sm font-bold tabular-nums text-white">⚽ {player.goals_total}</p>
        </header>
        <div className="mt-5 flex items-center gap-4">
          {player.badge_url ? <img src={player.badge_url} alt="" className="h-16 w-16 rounded-full object-cover" /> : <span className="h-16 w-16 rounded-full" style={{ backgroundColor: player.primary_colour }} />}
          <div>
            <h1 className="text-3xl font-black">{player.full_name}</h1>
            <p className="mt-1 text-sm text-white/40">{player.team_name} {player.club_name ? `/ ${player.club_name}` : ''}</p>
          </div>
        </div>

        {heroSession ? (
          <section className="mt-8 rounded-2xl p-5" style={{ background: `linear-gradient(135deg, ${player.primary_colour} 0%, #102015 52%, #080a0f 100%)` }}>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">Next Session</p>
            <h2 className="mt-2 text-2xl font-black">{sessionTitle(player.team_name, heroSession)}</h2>
            <p className="mt-4 text-sm text-white/80">{formatDate(heroSession.session_date)} at {formatTime(heroSession.session_date)}</p>
            <p className="mt-2 text-sm text-white/70">{heroSession.full_address || heroSession.location || 'Location TBC'}</p>
            {heroSession.coach_notes ? <p className="mt-3 text-sm italic text-white/75">{heroSession.coach_notes}</p> : null}
            <p className="mt-4 rounded-full bg-black/20 px-4 py-2 text-sm text-white/75">Availability: {heroSession.my_availability ?? 'Pending'}</p>
          </section>
        ) : (
          <section className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
            <h2 className="text-xl font-bold">No sessions yet</h2>
            <p className="mt-2 text-sm text-white/40">The coach has not posted the next session yet.</p>
          </section>
        )}

        <div className="mt-8">
          <PlayerAccessTree
            playerName={player.first_name || player.full_name}
            primaryParents={player.access.parents}
            familyMembers={player.access.familyMembers}
            pendingFamilyInvites={player.access.pendingFamilyInvites}
          />
        </div>

        <section className="mt-8">
          <h2 className="text-xl font-bold">Upcoming fixtures and sessions</h2>
          <div className="mt-4 space-y-3">
            {player.sessions.slice(1).map((session) => (
              <article key={session.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <h3 className="font-semibold">{sessionTitle(player.team_name, session)}</h3>
                <p className="mt-1 text-sm text-white/40">{formatDate(session.session_date)} at {formatTime(session.session_date)}</p>
                <p className="mt-1 text-xs text-white/30">{session.full_address || session.location || 'Location TBC'}</p>
              </article>
            ))}
            {player.sessions.length <= 1 ? <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-white/35">Nothing else scheduled.</p> : null}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
          <h2 className="text-xl font-bold">Goals this season</h2>
          <p className="mt-4 text-5xl font-black">{player.goals_total}</p>
          <p className="mt-1 text-sm text-white/35">goals this season</p>
        </section>

        <section className="mt-8">
          <h2 className="text-xs font-bold uppercase tracking-[0.24em] text-white/30">Milestones</h2>
          <div className="mt-4 space-y-3">
            {player.milestones.length === 0 ? <p className="text-xs text-white/25">No milestones yet</p> : player.milestones.map((milestone) => (
              <article key={`${milestone.milestone_id}-${milestone.achieved_at ?? ''}`} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-sm font-semibold">{milestoneLabel(milestone.milestone_id)}</p>
                <p className="mt-1 text-xs text-white/35">vs {milestone.opponent ?? 'Match'} / {formatDate(milestone.session_date ?? milestone.achieved_at)}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

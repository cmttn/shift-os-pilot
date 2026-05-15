import Link from 'next/link';
import { redirect } from 'next/navigation';
import PotmCardPreview from '@/components/dashboard/PotmCardPreview';
import { getCoachData } from '@/lib/dashboard/getCoachData';
import { createClient } from '@/lib/supabase/server';

interface CoachPotmSettings {
  first_access_complete: boolean | null;
  coach_message: string | null;
}

interface PotmPollRow {
  id: string;
  session_id: string;
  status: string | null;
  winner_player_id: string | null;
}

interface PotmStatRow {
  player_id: string;
  potm_count: number | null;
}

interface PlayerRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function playerName(player: PlayerRow | undefined): string {
  return [player?.first_name, player?.last_name].map((part) => part?.trim()).filter(Boolean).join(' ') || 'Player';
}

export default async function CoachPotmHomePage() {
  const coachData = await getCoachData();
  if (!coachData) redirect('/dashboard/coach/welcome');
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect('/auth/login');

  const { data: settings } = await supabase.from('potm_coach_settings').select('first_access_complete,coach_message').eq('user_id', user.id).maybeSingle<CoachPotmSettings>();
  if (!settings?.first_access_complete) redirect('/dashboard/coach/tools/potm/setup');

  const teamIds = coachData.teams.map((team) => team.id);
  const upcomingMatches = coachData.upcomingSessions.filter((session) => session.type === 'match');
  const sessionIds = upcomingMatches.map((session) => session.id);
  const [{ data: pollsData }, { data: statsData }] = await Promise.all([
    sessionIds.length > 0 ? supabase.from('potm_polls').select('id,session_id,status,winner_player_id').in('session_id', sessionIds) : Promise.resolve({ data: [] as PotmPollRow[] }),
    teamIds.length > 0 ? supabase.from('potm_stats').select('player_id,potm_count').in('team_id', teamIds).order('potm_count', { ascending: false }).limit(3) : Promise.resolve({ data: [] as PotmStatRow[] })
  ]);
  const polls = (pollsData ?? []) as PotmPollRow[];
  const stats = (statsData ?? []) as PotmStatRow[];
  const playerIds = Array.from(new Set([...stats.map((stat) => stat.player_id), ...polls.map((poll) => poll.winner_player_id).filter((id): id is string => Boolean(id))]));
  const { data: playersData } = playerIds.length > 0 ? await supabase.from('players').select('id,first_name,last_name').in('id', playerIds) : { data: [] as PlayerRow[] };
  const players = (playersData ?? []) as PlayerRow[];
  const previewTeam = coachData.teams[0] ?? null;
  const primaryColour = previewTeam?.club_primary_colour ?? '#00C851';
  const previewMessage = settings.coach_message?.trim() || 'Outstanding performance today - you were brilliant from start to finish!';

  return (
    <main className="min-h-screen px-5 pb-24 pt-8 text-white md:ml-[260px]" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[900px]">
        <header>
          <p className="text-xs uppercase tracking-[0.28em] text-white/30">Pro feature unlocked for testing</p>
          <h1 className="mt-2 text-3xl font-black">Player of the Match</h1>
          <p className="mt-2 text-sm text-white/40">Enable POTM polls for your upcoming matches.</p>
          <a href="#potm-social-card-preview" className="mt-4 inline-flex text-xs font-medium text-white/30 transition-colors duration-300 ease-out hover:text-white/65">
            See POTM social card preview
          </a>
        </header>

        <section className="mt-6 space-y-3">
          {upcomingMatches.length === 0 ? (
            <p className="rounded-2xl border border-white/[0.06] p-6 text-sm text-white/40" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)' }}>No upcoming matches found.</p>
          ) : upcomingMatches.map((session) => {
            const poll = polls.find((item) => item.session_id === session.id);
            const winner = players.find((player) => player.id === poll?.winner_player_id);
            const statusLabel = poll?.status === 'open' ? 'Voting open' : poll?.status === 'closed' ? `Complete${winner ? ` - ${playerName(winner)}` : ''}` : poll?.status === 'scheduled' ? 'Scheduled' : 'Not set up';
            const statusColour = poll?.status === 'open' ? '#f59e0b' : poll?.status === 'closed' ? primaryColour : poll?.status === 'scheduled' ? '#10b981' : 'rgba(255,255,255,0.25)';
            return (
              <Link key={session.id} href={`/dashboard/coach/sessions/${session.id}/potm`} className="block rounded-2xl border p-5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-white/15" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/30">{formatDate(session.session_date)}</p>
                    <h2 className="mt-1 text-xl font-bold text-white">{session.opponent ? `vs ${session.opponent}` : session.title ?? 'Match'}</h2>
                  </div>
                  <span className="w-fit rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: `${statusColour}24`, color: statusColour }}>{statusLabel}</span>
                </div>
              </Link>
            );
          })}
        </section>

        <section className="mt-8 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-xl font-bold">Season Stats — Player of the Match</h2>
          <div className="mt-4 space-y-2">
            {stats.length === 0 ? <p className="text-sm text-white/40">No POTM results yet this season.</p> : stats.map((stat, index) => {
              const player = players.find((item) => item.id === stat.player_id);
              return <p key={stat.player_id} className="rounded-xl bg-white/[0.03] p-3 text-sm text-white/75">{['🥇', '🥈', '🥉'][index] ?? '🏆'} {playerName(player)} — {stat.potm_count ?? 0} times</p>;
            })}
          </div>
        </section>

        <section id="potm-social-card-preview" className="mt-8 scroll-mt-8 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.28em] text-white/30">Social card preview</p>
            <h2 className="mt-2 text-xl font-bold text-white">POTM social card preview</h2>
            <p className="mt-1 text-sm text-white/40">Preview how the winner card will look before it is published.</p>
          </div>
          <PotmCardPreview
            playerName="Shift OS"
            teamName={previewTeam?.name ?? 'SHIFT OS Team'}
            opponent="Match Day"
            message={previewMessage}
            primaryColour={primaryColour}
            secondaryColour={previewTeam?.club_secondary_colour ?? null}
            badgeUrl={previewTeam?.club_badge_url ?? null}
            clubName={previewTeam?.club_name ?? null}
          />
        </section>
      </div>
    </main>
  );
}

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getParentDashboardData } from '@/lib/dashboard/getParentDashboardData';
import { createClient } from '@/lib/supabase/server';

interface ParentPotmLibraryPageProps {
  searchParams?: {
    player?: string;
  };
}

interface PotmAwardRow {
  id: string;
  session_id: string;
  team_id: string;
  winner_player_id: string;
  social_card_url: string | null;
  coach_message_used: string | null;
  total_votes: number | null;
  created_at: string | null;
}

interface SessionRow {
  id: string;
  opponent: string | null;
  title: string | null;
  session_date: string | null;
}

interface TeamRow {
  id: string;
  name: string | null;
}

function formatDate(value: string | null): string {
  if (!value) return 'Date TBC';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function ParentPotmLibraryPage({ searchParams }: ParentPotmLibraryPageProps) {
  const data = await getParentDashboardData();
  if (!data) redirect('/auth/login');

  const playerIds = data.players.map((player) => player.id);
  const requestedPlayerId = searchParams?.player;
  const visiblePlayerIds = requestedPlayerId && playerIds.includes(requestedPlayerId) ? [requestedPlayerId] : playerIds;
  const primaryColour = data.allSameClub ? data.globalPrimaryColour : '#f59e0b';
  const supabase = await createClient();

  const { data: awardsData } = visiblePlayerIds.length > 0
    ? await supabase
      .from('potm_polls')
      .select('id,session_id,team_id,winner_player_id,social_card_url,coach_message_used,total_votes,created_at')
      .in('winner_player_id', visiblePlayerIds)
      .eq('status', 'closed')
      .order('created_at', { ascending: false })
    : { data: [] as PotmAwardRow[] };

  const awards = (awardsData ?? []) as PotmAwardRow[];
  const sessionIds = Array.from(new Set(awards.map((award) => award.session_id)));
  const teamIds = Array.from(new Set(awards.map((award) => award.team_id)));
  const [{ data: sessionsData }, { data: teamsData }] = await Promise.all([
    sessionIds.length > 0 ? supabase.from('sessions').select('id,opponent,title,session_date').in('id', sessionIds) : Promise.resolve({ data: [] as SessionRow[] }),
    teamIds.length > 0 ? supabase.from('teams').select('id,name').in('id', teamIds) : Promise.resolve({ data: [] as TeamRow[] })
  ]);
  const sessions = (sessionsData ?? []) as SessionRow[];
  const teams = (teamsData ?? []) as TeamRow[];

  return (
    <main className="min-h-screen px-5 pb-28 pt-8 text-white" style={{ backgroundColor: '#080a0f' }}>
      <section className="mx-auto max-w-[1100px]">
        <Link href="/dashboard/parent" className="text-sm text-white/40 transition-colors duration-300 ease-out hover:text-white">Back</Link>
        <header className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/30">Player of the Match</p>
            <h1 className="mt-2 text-3xl font-black text-white">POTM Awards Library</h1>
            <p className="mt-2 max-w-xl text-sm text-white/40">A home for every Player of the Match card your children have earned.</p>
          </div>
          <div className="rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm text-white/50">
            {awards.length} award{awards.length === 1 ? '' : 's'}
          </div>
        </header>

        {data.players.length > 1 ? (
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
            <Link href="/dashboard/parent/potm" className="shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-300 ease-out" style={{ borderColor: requestedPlayerId ? 'rgba(255,255,255,0.08)' : primaryColour, color: requestedPlayerId ? 'rgba(255,255,255,0.45)' : primaryColour }}>
              All players
            </Link>
            {data.players.map((player) => (
              <Link key={player.id} href={`/dashboard/parent/potm?player=${player.id}`} className="shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-300 ease-out" style={{ borderColor: requestedPlayerId === player.id ? primaryColour : 'rgba(255,255,255,0.08)', color: requestedPlayerId === player.id ? primaryColour : 'rgba(255,255,255,0.45)' }}>
                {player.full_name}
              </Link>
            ))}
          </div>
        ) : null}

        {awards.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
            <h2 className="text-xl font-bold text-white">No POTM cards yet</h2>
            <p className="mt-2 text-sm text-white/40">When a coach closes a Player of the Match poll and your child wins, the card will appear here.</p>
          </section>
        ) : (
          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {awards.map((award) => {
              const player = data.players.find((item) => item.id === award.winner_player_id);
              const session = sessions.find((item) => item.id === award.session_id) ?? null;
              const team = teams.find((item) => item.id === award.team_id) ?? null;
              const fixture = session?.opponent ?? session?.title ?? 'Match Day';
              return (
                <article key={award.id} className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03]">
                  <div className="aspect-square bg-black/30">
                    {award.social_card_url ? (
                      <img src={award.social_card_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-white/35">Card pending</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h2 className="text-base font-black text-white">{player?.full_name ?? 'Player'}</h2>
                    <p className="mt-1 text-sm text-white/45">{team?.name ?? 'Team'} vs {fixture}</p>
                    <p className="mt-1 text-xs text-white/30">{formatDate(session?.session_date ?? award.created_at)}</p>
                    {award.coach_message_used ? <p className="mt-3 line-clamp-2 text-xs italic leading-relaxed text-white/45">&ldquo;{award.coach_message_used}&rdquo;</p> : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {award.social_card_url ? (
                        <>
                          <a href={award.social_card_url} target="_blank" rel="noreferrer" className="rounded-full px-4 py-2 text-sm font-semibold text-black" style={{ backgroundColor: primaryColour }}>View card</a>
                          <a href={award.social_card_url} target="_blank" rel="noreferrer" download className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/55">Download</a>
                        </>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </section>
    </main>
  );
}

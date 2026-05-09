import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';

interface PollPageProps {
  params: {
    sessionToken: string;
    playerToken: string;
    response: string;
  };
}

interface PollLookup {
  id: string;
  player_id: string;
  status: string | null;
  sessions: {
    id: string;
    type: string;
    title: string | null;
    opponent: string | null;
    session_date: string;
    location: string | null;
    teams: {
      name: string;
      club_id: string | null;
      clubs: {
        name: string | null;
        badge_url: string | null;
        primary_colour: string | null;
      } | Array<{
        name: string | null;
        badge_url: string | null;
        primary_colour: string | null;
      }> | null;
    } | Array<{
      name: string;
      club_id: string | null;
      clubs: {
        name: string | null;
        badge_url: string | null;
        primary_colour: string | null;
      } | Array<{
        name: string | null;
        badge_url: string | null;
        primary_colour: string | null;
      }> | null;
    }> | null;
  } | Array<{
    id: string;
    type: string;
    title: string | null;
    opponent: string | null;
    session_date: string;
    location: string | null;
    teams: {
      name: string;
      club_id: string | null;
      clubs: {
        name: string | null;
        badge_url: string | null;
        primary_colour: string | null;
      } | Array<{
        name: string | null;
        badge_url: string | null;
        primary_colour: string | null;
      }> | null;
    } | Array<{
      name: string;
      club_id: string | null;
      clubs: {
        name: string | null;
        badge_url: string | null;
        primary_colour: string | null;
      } | Array<{
        name: string | null;
        badge_url: string | null;
        primary_colour: string | null;
      }> | null;
    }> | null;
  }> | null;
  players: {
    first_name: string | null;
    last_name: string | null;
  } | Array<{
    first_name: string | null;
    last_name: string | null;
  }> | null;
}

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function playerName(player: PollLookup['players']): string {
  const row = first(player);
  return [row?.first_name, row?.last_name].filter(Boolean).join(' ') || 'Player';
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return `${date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} at ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

async function getPoll(params: PollPageProps['params']): Promise<PollLookup | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('poll_responses')
    .select('id,player_id,status,sessions(id,type,title,opponent,session_date,location,teams(name,club_id,clubs(name,badge_url,primary_colour))),players(first_name,last_name)')
    .eq('player_token', params.playerToken)
    .eq('sessions.session_token', params.sessionToken)
    .maybeSingle<PollLookup>();
  return data ?? null;
}

export async function generateMetadata({ params }: PollPageProps): Promise<Metadata> {
  const poll = await getPoll(params);
  if (!poll) return { title: 'Availability Poll' };
  const session = first(poll.sessions);
  const team = first(session?.teams);
  const club = first(team?.clubs);
  const name = playerName(poll.players);
  return {
    title: `📋 ${team?.name ?? 'Team'} — Availability Poll`,
    description: `${name} — ${session?.type ?? 'Session'} ${session?.opponent ? `vs ${session.opponent}` : ''}\n${session?.session_date ? formatDate(session.session_date) : ''}\nTap to confirm`,
    openGraph: {
      title: `📋 ${team?.name ?? 'Team'} — Availability Poll`,
      description: `${name} — ${session?.type ?? 'Session'}`,
      images: club?.badge_url ? [club.badge_url] : undefined
    }
  };
}

export default async function PollResponsePage({ params }: PollPageProps) {
  if (params.response !== 'available' && params.response !== 'unavailable') notFound();
  const supabase = createServiceClient();
  const poll = await getPoll(params);
  if (!poll) notFound();
  await supabase.from('poll_responses').update({ status: params.response, responded_at: new Date().toISOString() }).eq('id', poll.id);
  const session = first(poll.sessions);
  const team = first(session?.teams);
  const club = first(team?.clubs);
  const name = playerName(poll.players);
  const primaryColour = params.response === 'available' ? '#10b981' : '#ef4444';

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10 text-center text-white" style={{ backgroundColor: '#080a0f' }}>
      <section className="w-full max-w-[420px] rounded-2xl border p-8" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
        {club?.badge_url ? <img src={club.badge_url} alt="" className="mx-auto h-[60px] w-[60px] rounded-full object-cover" /> : <div className="mx-auto flex h-[60px] w-[60px] items-center justify-center rounded-full bg-white/[0.06] font-black">S</div>}
        <h1 className="mt-4 text-xl font-bold text-white">{team?.name ?? 'Team'}</h1>
        <p className="mt-2 text-sm text-white/40">{session ? formatDate(session.session_date) : ''}</p>
        <p className="mt-1 text-sm text-white/40">{session?.opponent ? `vs ${session.opponent}` : session?.title ?? ''} / {session?.location ?? 'Location TBC'}</p>
        <p className="mt-8 text-2xl font-black">{name}</p>
        <p className="mt-5 text-6xl">{params.response === 'available' ? '✅' : '❌'}</p>
        <h2 className="mt-4 text-2xl font-black" style={{ color: primaryColour }}>
          {params.response === 'available' ? `${name} is Available!` : `${name} is Not Available`}
        </h2>
        <p className="mt-3 text-white/45">{params.response === 'available' ? 'Thanks! Your coach has been notified.' : 'Thanks for letting us know!'}</p>
        <div className="mt-8 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-sm text-white/45">Change your response?</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a href={`/poll/${params.sessionToken}/${params.playerToken}/available`} className="rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white">Available</a>
            <a href={`/poll/${params.sessionToken}/${params.playerToken}/unavailable`} className="rounded-full bg-red-500 px-4 py-3 text-sm font-semibold text-white">Not Available</a>
          </div>
        </div>
        <p className="mt-8 text-xs text-white/25">Powered by Shift OS — The operating system for your club</p>
      </section>
    </main>
  );
}

import type { Metadata } from 'next';
import GroupPollClient, { type GroupPollPlayer, type GroupPollResponse, type GroupPollSession } from '@/app/poll/[sessionToken]/GroupPollClient';
import { createClient } from '@/lib/supabase/server';

interface GroupPollPageProps {
  params: {
    sessionToken: string;
  };
}

interface RawTeam {
  id: string;
  name: string;
  club_id: string | null;
}

interface RawClub {
  id: string;
  name: string;
  badge_url: string | null;
  primary_colour: string | null;
  secondary_colour: string | null;
}

interface RawPlayer {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

function fullName(player: RawPlayer): string {
  return [player.first_name, player.last_name].filter(Boolean).join(' ') || 'Player';
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '';
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function sessionType(type: string): string {
  if (type === 'match') return 'Match';
  if (type === 'training') return 'Training';
  return 'Tournament';
}

async function getPollData(sessionToken: string) {
  const supabase = await createClient();
  const { data: session } = await supabase
    .from('sessions')
    .select('id,team_id,type,title,opponent,session_date,location,full_address,coach_notes,session_token')
    .eq('session_token', sessionToken)
    .eq('is_active', true)
    .maybeSingle<GroupPollSession>();

  if (!session) return null;

  const { data: teamData } = await supabase.from('teams').select('id,name,club_id').eq('id', session.team_id).maybeSingle<RawTeam>();
  if (!teamData) return null;

  const [{ data: clubData }, { data: playersData }, { data: responsesData }] = await Promise.all([
    teamData.club_id ? supabase.from('clubs').select('id,name,badge_url,primary_colour,secondary_colour').eq('id', teamData.club_id).maybeSingle<RawClub>() : Promise.resolve({ data: null as RawClub | null }),
    supabase.from('players').select('id,first_name,last_name').eq('team_id', session.team_id).eq('is_active', true).order('first_name', { ascending: true }),
    supabase.from('poll_responses').select('id,player_id,player_token,status,note').eq('session_id', session.id)
  ]);

  const club = clubData ? {
    name: clubData.name,
    badge_url: clubData.badge_url,
    primary_colour: clubData.primary_colour ?? '#00C851'
  } : null;

  return {
    session,
    team: { name: teamData.name },
    club,
    players: ((playersData ?? []) as RawPlayer[]).map((player): GroupPollPlayer => ({
      id: player.id,
      first_name: player.first_name ?? '',
      last_name: player.last_name ?? '',
      full_name: fullName(player)
    })),
    responses: (responsesData ?? []) as GroupPollResponse[]
  };
}

export async function generateMetadata({ params }: GroupPollPageProps): Promise<Metadata> {
  const data = await getPollData(params.sessionToken);
  if (!data) {
    return {
      title: 'Availability Poll',
      description: 'This poll is no longer available.'
    };
  }

  const title = `${sessionType(data.session.type)}${data.session.opponent ? ` vs ${data.session.opponent}` : ''}`;
  const description = `${title} | ${formatDate(data.session.session_date)} at ${formatTime(data.session.session_date)} | ${data.session.full_address ?? data.session.location ?? 'TBC'} | Tap to confirm`;
  const image = data.club?.badge_url ? [{ url: data.club.badge_url, width: 400, height: 400 }] : undefined;

  return {
    title: `📋 ${data.team.name} — Availability Check`,
    description,
    openGraph: {
      title: `📋 ${data.team.name} — Availability Poll`,
      description: `${title}\n${formatDate(data.session.session_date)} at ${formatTime(data.session.session_date)} | ${data.session.full_address ?? data.session.location ?? 'TBC'}\nTap to confirm your child's availability`,
      images: image,
      type: 'website'
    }
  };
}

export default async function GroupPollPage({ params }: GroupPollPageProps) {
  const data = await getPollData(params.sessionToken);
  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 text-center text-white" style={{ backgroundColor: '#080a0f' }}>
        <section className="max-w-[420px] rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <h1 className="text-2xl font-black">This poll has expired or is no longer available</h1>
          <p className="mt-3 text-sm text-white/40">Please ask your coach for a fresh availability link.</p>
        </section>
      </main>
    );
  }

  return <GroupPollClient {...data} />;
}

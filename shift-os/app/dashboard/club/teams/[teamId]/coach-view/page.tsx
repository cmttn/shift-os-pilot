import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import CopyInviteButton from '@/components/dashboard/CopyInviteButton';
import { getClubData } from '@/lib/dashboard/getClubData';
import { createClient } from '@/lib/supabase/server';

interface CoachViewPageProps {
  params: { teamId: string };
}

interface TeamDetails {
  id: string;
  name: string;
  age_group: string | null;
  gender: string | null;
  join_code: string | null;
  club_id: string;
}

interface PlayerRecord {
  id: string;
  first_name: string | null;
  last_name: string | null;
  dob: string | null;
}

interface SessionRecord {
  id: string;
  type: string;
  opponent: string | null;
  title: string | null;
  session_date: string;
}

interface LeadCoachRecord {
  user_id: string;
}

function titleCase(value: string | null): string {
  if (!value) return 'Not set';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default async function TeamCoachViewPage({ params }: CoachViewPageProps) {
  const clubData = await getClubData();
  if (!clubData) redirect('/onboarding');
  const supabase = await createClient();
  const { data: teamData } = await supabase.from('teams').select('id,name,age_group,gender,join_code,club_id').eq('id', params.teamId).eq('club_id', clubData.club.id).maybeSingle<TeamDetails>();
  if (!teamData) notFound();
  const { data: leadCoach } = await supabase.from('team_coaches').select('user_id').eq('team_id', teamData.id).eq('is_lead', true).limit(1).maybeSingle<LeadCoachRecord>();
  const [{ data: playersData }, { data: sessionsData }, { data: requestsData }] = await Promise.all([
    supabase.from('players').select('id,first_name,last_name,dob').eq('team_id', teamData.id).eq('is_active', true).order('first_name', { ascending: true }),
    supabase.from('sessions').select('id,type,opponent,title,session_date').eq('team_id', teamData.id).eq('is_active', true).gte('session_date', new Date().toISOString()).order('session_date', { ascending: true }),
    supabase.from('pending_join_requests').select('id,full_name,dob,parent_name,parent_contact').eq('team_id', teamData.id).eq('status', 'pending').order('created_at', { ascending: true })
  ]);
  const sessionIds = ((sessionsData ?? []) as SessionRecord[]).map((session) => session.id);
  const { data: pollData } = sessionIds.length > 0 ? await supabase.from('poll_responses').select('session_id,status,player_id').in('session_id', sessionIds) : { data: [] as Array<Record<string, unknown>> };
  const { data: coachProfile } = leadCoach ? await supabase.from('users_profile').select('full_name').eq('id', leadCoach.user_id).maybeSingle<{ full_name: string | null }>() : { data: null };
  const primaryColour = clubData.club.primary_colour;
  const players = (playersData ?? []) as PlayerRecord[];
  const sessions = (sessionsData ?? []) as SessionRecord[];
  const polls = (pollData ?? []) as Array<{ session_id: string; status: string | null; player_id: string }>;
  const requests = (requestsData ?? []) as Array<{ id: string; full_name: string; dob: string; parent_name: string; parent_contact: string }>;

  return (
    <main className="min-h-screen text-white md:ml-[260px]" style={{ backgroundColor: '#080a0f' }}>
      <div className="px-5 py-3 text-sm font-semibold text-white" style={{ backgroundColor: primaryColour }}>Admin View - You are viewing {(coachProfile?.full_name ?? 'the coach')}&apos;s dashboard for {teamData.name}</div>
      <div className="px-5 py-8 md:px-8">
        <Link href="/dashboard/club" className="text-sm text-white/40">Back to Club Dashboard</Link>
        <section className="mt-8 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <h1 className="text-3xl font-black text-white">{teamData.name}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-sm text-white/70">{teamData.age_group ?? 'Age group not set'}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-sm text-white/70">{titleCase(teamData.gender)}</span>
            <span className="rounded-full border px-3 py-1 font-mono text-sm font-black tracking-[0.18em]" style={{ borderColor: `${primaryColour}66`, color: primaryColour }}>{teamData.join_code ?? '------'}</span>
            {teamData.join_code ? <CopyInviteButton inviteUrl={teamData.join_code} label="Copy Code" /> : null}
          </div>
        </section>
        <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <article className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="text-2xl font-bold">Squad List</h2>
            <div className="mt-5 space-y-3">{players.length === 0 ? <p className="text-sm text-white/35">No players yet.</p> : players.map((player) => (
              <div key={player.id} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                <p className="font-medium">{[player.first_name, player.last_name].filter(Boolean).join(' ') || 'Player'}</p>
                {player.dob ? <p className="mt-1 text-sm text-white/35">{formatDate(player.dob)}</p> : null}
              </div>
            ))}</div>
          </article>
          <article className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="text-2xl font-bold">Upcoming Fixtures</h2>
            <div className="mt-5 space-y-3">{sessions.length === 0 ? <p className="text-sm text-white/35">No fixtures scheduled.</p> : sessions.map((session) => (
              <div key={session.id} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                <p className="font-medium">{session.opponent ?? session.title ?? session.type}</p>
                <p className="mt-1 text-sm text-white/35">{formatDate(session.session_date)} / {session.type}</p>
              </div>
            ))}</div>
          </article>
        </section>
        <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <article className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="text-xl font-bold">Recent Availability Responses</h2>
            <div className="mt-5 space-y-3">{polls.length === 0 ? <p className="text-sm text-white/35">Nothing to show yet.</p> : polls.slice(0, 8).map((poll, index) => <p key={`${poll.player_id}-${index}`} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 text-sm text-white/45">{poll.status ?? 'pending'}</p>)}</div>
          </article>
          <article className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="text-xl font-bold">Pending Join Requests</h2>
            <div className="mt-5 space-y-3">{requests.length === 0 ? <p className="text-sm text-white/35">Nothing to show yet.</p> : requests.map((request) => <p key={request.id} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 text-sm text-white/45">{request.full_name} / {request.parent_name}</p>)}</div>
          </article>
        </section>
      </div>
    </main>
  );
}

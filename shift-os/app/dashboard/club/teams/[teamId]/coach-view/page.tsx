import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import CopyInviteButton from '@/components/dashboard/CopyInviteButton';
import { getClubData } from '@/lib/dashboard/getClubData';
import { createClient } from '@/lib/supabase/server';

interface CoachViewPageProps {
  params: {
    teamId: string;
  };
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
  full_name: string;
  date_of_birth: string | null;
}

interface FixtureRecord {
  id: string;
  fixture_date: string;
  opponent: string;
  home_away: string | null;
  team_name: string | null;
}

interface PendingRequestRecord {
  id: string;
  full_name: string;
  dob: string;
  parent_name: string;
  parent_contact: string;
}

interface LeadCoachRecord {
  user_id: string;
}

function titleCase(value: string | null): string {
  if (!value) return 'Not set';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(value: string | null): string {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function readDisplayValue(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  }
  return 'Recorded';
}

export default async function TeamCoachViewPage({ params }: CoachViewPageProps) {
  const clubData = await getClubData();
  if (!clubData) redirect('/onboarding');

  const supabase = await createClient();
  const { data: teamData } = await supabase
    .from('teams')
    .select('id,name,age_group,gender,join_code,club_id')
    .eq('id', params.teamId)
    .eq('club_id', clubData.club.id)
    .maybeSingle<TeamDetails>();

  if (!teamData) notFound();

  const [{ data: leadCoach }, { data: playersData }, { data: fixturesData }, { data: availabilityData }, { data: gameTimeData }, { data: requestsData }] = await Promise.all([
    supabase.from('team_coaches').select('user_id').eq('team_id', teamData.id).eq('is_lead', true).maybeSingle<LeadCoachRecord>(),
    supabase.from('players').select('id,full_name,date_of_birth').eq('team_id', teamData.id).eq('is_active', true).order('full_name', { ascending: true }),
    supabase.from('fixtures').select('id,fixture_date,opponent,home_away,team_name').eq('club_id', clubData.club.id).eq('team_name', teamData.name).order('fixture_date', { ascending: true }),
    supabase.from('availability').select('*').eq('team_id', teamData.id).order('created_at', { ascending: false }).limit(6),
    supabase.from('game_time').select('*').eq('team_id', teamData.id).order('created_at', { ascending: false }).limit(6),
    supabase.from('pending_join_requests').select('id,full_name,dob,parent_name,parent_contact').eq('team_id', teamData.id).eq('status', 'pending').order('created_at', { ascending: true })
  ]);

  const coachRow = leadCoach as LeadCoachRecord | null;
  const { data: coachProfile } = coachRow
    ? await supabase.from('users_profile').select('full_name').eq('id', coachRow.user_id).maybeSingle<{ full_name: string | null }>()
    : { data: null };

  const coachName = coachProfile?.full_name?.trim() || 'the coach';
  const primaryColour = clubData.club.primary_colour;
  const players = (playersData ?? []) as PlayerRecord[];
  const fixtures = (fixturesData ?? []) as FixtureRecord[];
  const availability = (availabilityData ?? []) as Array<Record<string, unknown>>;
  const gameTime = (gameTimeData ?? []) as Array<Record<string, unknown>>;
  const requests = (requestsData ?? []) as PendingRequestRecord[];

  return (
    <main className="min-h-screen text-white md:ml-[260px]" style={{ backgroundColor: '#080a0f' }}>
      <div className="px-5 py-3 text-sm font-semibold text-white" style={{ backgroundColor: primaryColour }}>
        👁 Admin View — You are viewing {coachName}&apos;s dashboard for {teamData.name}
      </div>
      <div className="px-5 py-8 md:px-8">
        <Link href="/dashboard/club" className="text-sm text-white/40 transition-all duration-300 ease-out hover:text-white">← Back to Club Dashboard</Link>

        <section className="mt-8 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <h1 className="text-3xl font-black text-white">{teamData.name}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-sm text-white/70">{teamData.age_group ?? 'Age group not set'}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-sm text-white/70">{titleCase(teamData.gender)}</span>
            <span className="rounded-full border px-3 py-1 font-mono text-sm font-black tracking-[0.18em]" style={{ borderColor: `${primaryColour}66`, color: primaryColour }}>{teamData.join_code ?? '------'}</span>
            {teamData.join_code ? <CopyInviteButton inviteUrl={teamData.join_code} label="Copy Code" /> : null}
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <article className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="text-2xl font-bold">Squad List</h2>
            <div className="mt-5 space-y-3">
              {players.length === 0 ? <p className="text-sm text-white/35">No players yet.</p> : players.map((player) => (
                <div key={player.id} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                  <p className="font-medium">{player.full_name}</p>
                  <p className="mt-1 text-sm text-white/35">DOB: {player.date_of_birth ?? 'Not set'}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="text-2xl font-bold">Upcoming Fixtures</h2>
            <div className="mt-5 space-y-3">
              {fixtures.length === 0 ? <p className="text-sm text-white/35">No fixtures scheduled.</p> : fixtures.map((fixture) => (
                <div key={fixture.id} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                  <p className="font-medium">{fixture.opponent}</p>
                  <p className="mt-1 text-sm text-white/35">{formatDate(fixture.fixture_date)} / {fixture.home_away ?? 'home/away not set'}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
          {[
            ['Recent Availability Responses', availability, ['status', 'response', 'availability_status', 'player_name']],
            ['Recent Game Time Entries', gameTime, ['minutes', 'player_name', 'fixture_id']],
            ['Pending Join Requests', requests as unknown as Array<Record<string, unknown>>, ['full_name', 'parent_name', 'parent_contact']]
          ].map(([title, rows, keys]) => (
            <article key={String(title)} className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <h2 className="text-xl font-bold">{String(title)}</h2>
              <div className="mt-5 space-y-3">
                {(rows as Array<Record<string, unknown>>).length === 0 ? <p className="text-sm text-white/35">Nothing to show yet.</p> : (rows as Array<Record<string, unknown>>).map((row, index) => (
                  <div key={`${String(title)}-${index}`} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 text-sm text-white/45">
                    {readDisplayValue(row, keys as string[])}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

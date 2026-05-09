import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import CopyInviteButton from '@/components/dashboard/CopyInviteButton';
import { getClubData } from '@/lib/dashboard/getClubData';
import { createClient } from '@/lib/supabase/server';

interface TeamInfoPageProps {
  params: {
    teamId: string;
  };
  searchParams: {
    tab?: string;
  };
}

interface TeamDetails {
  id: string;
  name: string;
  age_group: string | null;
  gender: string | null;
  join_code: string | null;
}

interface PlayerRecord {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  is_active: boolean | null;
}

interface FeatureToggleRecord {
  feature_key: string | null;
  is_enabled: boolean | null;
}

const features = [
  ['game_time_tracker', 'Game Time Tracker', 'Track minutes played per player', 'Free'],
  ['availability_manager', 'Availability Manager', 'Request and track player availability', 'Free'],
  ['announcement_builder', 'Announcement Builder', 'Send updates to coaches and parents', 'Free'],
  ['fair_play_reports', 'Fair Play Reports', 'Full game time reports', 'Pro'],
  ['structured_conversations', 'Structured Conversations', 'Replace WhatsApp with structured comms', 'Pro'],
  ['parent_engagement', 'Parent Engagement', 'Track parent response rates', 'Pro']
] as const;

const tabs = [
  ['players', 'Players'],
  ['features', 'Feature Usage'],
  ['tickets', 'Open Tickets'],
  ['history', 'Ticket History']
] as const;

function getContrastText(hexColour: string): string {
  const hex = hexColour.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

function titleCase(value: string | null): string {
  if (!value) return 'Not set';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function calculateAge(value: string | null): string {
  if (!value) return 'Not set';
  const dob = new Date(value);
  if (Number.isNaN(dob.valueOf())) return 'Not set';
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
  return String(age);
}

function TicketPlaceholder({ primaryColour }: { primaryColour: string }) {
  return (
    <section className="rounded-2xl border p-10 text-center" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <p className="text-5xl">💬</p>
      <h2 className="mt-5 text-3xl font-black text-white">Structured Conversations</h2>
      <p className="mx-auto mt-3 max-w-xl text-white/40">Replace uncontrolled WhatsApp messages with structured, trackable workflows.</p>
      <div className="mx-auto mt-8 grid max-w-xl gap-3 text-left text-sm text-white/50">
        {['Guided ticket categories', 'Full audit trail', 'Safeguarding escalation routes', 'Behaviour and culture tracking'].map((item) => (
          <p key={item}>✓ {item}</p>
        ))}
      </div>
      <span className="mt-8 inline-block rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-200">Coming with Pro Plan</span>
      <button className="ml-3 mt-8 rounded-full px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ease-out hover:scale-[1.02]" style={{ backgroundColor: primaryColour }}>
        Upgrade to Pro
      </button>
    </section>
  );
}

export default async function TeamInfoPage({ params, searchParams }: TeamInfoPageProps) {
  const clubData = await getClubData();
  if (!clubData) redirect('/onboarding');

  const supabase = await createClient();
  const { data: teamData } = await supabase
    .from('teams')
    .select('id,name,age_group,gender,join_code')
    .eq('id', params.teamId)
    .eq('club_id', clubData.club.id)
    .maybeSingle<TeamDetails>();

  if (!teamData) notFound();

  const [{ data: playersData }, { data: togglesData }] = await Promise.all([
    supabase.from('players').select('id,full_name,date_of_birth,is_active').eq('team_id', teamData.id).order('full_name', { ascending: true }),
    supabase.from('feature_toggles').select('feature_key,is_enabled').eq('club_id', clubData.club.id)
  ]);

  const players = (playersData ?? []) as PlayerRecord[];
  const toggles = (togglesData ?? []) as FeatureToggleRecord[];
  const activeTab = tabs.some(([tab]) => tab === searchParams.tab) ? searchParams.tab : 'players';
  const primaryColour = clubData.club.primary_colour;
  const contrastText = getContrastText(primaryColour);

  return (
    <main className="min-h-screen px-5 py-10 text-[#f0f4ff] md:ml-[260px] md:px-8" style={{ backgroundColor: '#080a0f' }}>
      <Link href="/dashboard/club/teams" className="text-sm text-white/40 transition-all duration-300 ease-out hover:text-white">← All Teams</Link>
      <section className="mt-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{teamData.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-sm text-white/70">{teamData.age_group ?? 'Age group not set'}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-sm text-white/70">{titleCase(teamData.gender)}</span>
            <span className="rounded-full border px-3 py-1 font-mono text-sm font-black tracking-[0.18em]" style={{ borderColor: `${primaryColour}66`, color: primaryColour }}>{teamData.join_code ?? '------'}</span>
            {teamData.join_code ? <CopyInviteButton inviteUrl={teamData.join_code} label="Copy Code" /> : null}
          </div>
        </div>
        <button className="w-fit rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ease-out hover:bg-white/[0.06]">Edit Team</button>
      </section>

      <nav className="mt-8 flex gap-2 overflow-x-auto pb-2">
        {tabs.map(([tab, label]) => (
          <Link
            key={tab}
            href={`/dashboard/club/teams/${teamData.id}?tab=${tab}`}
            className="whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ease-out"
            style={activeTab === tab ? { backgroundColor: primaryColour, color: contrastText } : { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
          >
            {label}
          </Link>
        ))}
      </nav>

      <section className="mt-8">
        {activeTab === 'players' ? (
          <div className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-bold text-white">Players</h2>
              <Link href={`/dashboard/club/teams/${teamData.id}/players/new`} className="w-fit rounded-full px-5 py-2 text-sm font-semibold text-white" style={{ backgroundColor: primaryColour }}>Add Player +</Link>
            </div>
            {players.length === 0 ? (
              <div className="py-12 text-center text-white/40">
                <p>No players yet.</p>
                <p className="mt-5 font-mono text-3xl font-black tracking-[0.32em]" style={{ color: primaryColour }}>{teamData.join_code ?? '------'}</p>
                {teamData.join_code ? <CopyInviteButton inviteUrl={teamData.join_code} label="Copy Code" /> : null}
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {players.map((player) => (
                  <article key={player.id} className="grid gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 text-sm md:grid-cols-[1.5fr_1fr_0.5fr_0.7fr_auto] md:items-center">
                    <p className="font-medium text-white">{player.full_name}</p>
                    <p className="text-white/40">{player.date_of_birth ?? 'DOB not set'}</p>
                    <p className="text-white/40">{calculateAge(player.date_of_birth)}</p>
                    <span className="w-fit rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: player.is_active === false ? 'rgba(255,255,255,0.1)' : `${primaryColour}66`, color: player.is_active === false ? 'rgba(255,255,255,0.4)' : primaryColour }}>
                      {player.is_active === false ? 'Inactive' : 'Active'}
                    </span>
                    <button className="text-white/35">···</button>
                  </article>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {activeTab === 'features' ? (
          <div className="space-y-3">
            {features.map(([key, name, description, tier]) => {
              const toggle = toggles.find((item) => item.feature_key === key);
              const enabled = toggle?.is_enabled ?? tier === 'Free';
              return (
                <article key={key} className="rounded-xl border p-4" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{name}</p>
                      <p className="mt-1 text-sm text-white/35">{description}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {tier === 'Pro' ? <span className="rounded-full bg-purple-500 px-3 py-1 text-xs font-semibold text-white">Pro</span> : null}
                      <span className="flex items-center gap-2 text-sm text-white/45"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: enabled ? '#22c55e' : '#6b7280' }} />{enabled ? 'On' : 'Off'}</span>
                    </div>
                  </div>
                </article>
              );
            })}
            <p className="pt-3 text-sm text-white/35">Feature toggles are managed from Club Settings</p>
          </div>
        ) : null}

        {activeTab === 'tickets' || activeTab === 'history' ? <TicketPlaceholder primaryColour={primaryColour} /> : null}
      </section>
    </main>
  );
}

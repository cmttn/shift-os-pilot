import Link from 'next/link';
import ClubFixturesPanel from '@/components/dashboard/ClubFixturesPanel';
import ClubTeamScroller from '@/components/dashboard/ClubTeamScroller';
import { getClubData } from '@/lib/dashboard/getClubData';
import { createClient } from '@/lib/supabase/server';

function getContrastText(hexColour: string): string {
  const hex = hexColour.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

function darkenHex(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - Math.round((255 * percent) / 100));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round((255 * percent) / 100));
  const b = Math.max(0, (num & 0xff) - Math.round((255 * percent) / 100));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function getGreeting(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function getComplianceStatus(expiryDate: string | null): 'compliant' | 'expiring' | 'expired' {
  if (!expiryDate) return 'expired';
  const days = Math.ceil((new Date(expiryDate).valueOf() - Date.now()) / 86400000);
  if (days <= 0) return 'expired';
  if (days <= 90) return 'expiring';
  return 'compliant';
}

export default async function ClubDashboardHomePage() {
  const clubData = await getClubData();
  if (!clubData) return null;
  const supabase = await createClient();
  const primaryColour = clubData.club.primary_colour;
  const darkerPrimary = darkenHex(primaryColour, 15);
  const contrastText = getContrastText(primaryColour);
  const greeting = getGreeting();
  const stats = [
    ['Teams', clubData.teams.length],
    ['Players', clubData.totalPlayers],
    ['Coaches', clubData.totalCoaches],
    ['Fixtures', clubData.totalFixtures]
  ];
  const teamIds = clubData.teams.map((team) => team.id);
  const { data: coachesData } = teamIds.length > 0 ? await supabase.from('team_coaches').select('user_id').in('team_id', teamIds) : { data: [] as Array<{ user_id: string }> };
  const coachIds = Array.from(new Set(((coachesData ?? []) as Array<{ user_id: string }>).map((coach) => coach.user_id)));
  const [{ data: dbsData }, { data: qualificationData }] = await Promise.all([
    coachIds.length > 0 ? supabase.from('coach_dbs').select('user_id,expiry_date').in('user_id', coachIds) : Promise.resolve({ data: [] as Array<{ user_id: string; expiry_date: string | null }> }),
    coachIds.length > 0 ? supabase.from('coach_qualifications').select('user_id,expiry_date').in('user_id', coachIds) : Promise.resolve({ data: [] as Array<{ user_id: string; expiry_date: string | null }> })
  ]);
  const dbsRows = (dbsData ?? []) as Array<{ user_id: string; expiry_date: string | null }>;
  const qualificationRows = (qualificationData ?? []) as Array<{ user_id: string; expiry_date: string | null }>;
  const coachCompliance = coachIds.map((coachId) => {
    const dbsStatus = getComplianceStatus(dbsRows.find((row) => row.user_id === coachId)?.expiry_date ?? null);
    const qualificationStatuses = qualificationRows.filter((row) => row.user_id === coachId).map((row) => getComplianceStatus(row.expiry_date));
    const qualificationStatus = qualificationStatuses.length === 0 || qualificationStatuses.includes('expired') ? 'expired' : qualificationStatuses.includes('expiring') ? 'expiring' : 'compliant';
    return dbsStatus === 'expired' || qualificationStatus === 'expired' ? 'expired' : dbsStatus === 'expiring' || qualificationStatus === 'expiring' ? 'expiring' : 'compliant';
  });
  const complianceCounts = {
    compliant: coachCompliance.filter((status) => status === 'compliant').length,
    expiring: coachCompliance.filter((status) => status === 'expiring').length,
    expired: coachCompliance.filter((status) => status === 'expired').length
  };
  const [{ count: playtimeUsageCount }, { data: lastPlaytimeUsageData }] = await Promise.all([
    supabase
      .from('tool_usage')
      .select('id', { count: 'exact', head: true })
      .eq('club_id', clubData.club.id)
      .eq('tool_name', 'playtime_calculator'),
    supabase
      .from('tool_usage')
      .select('created_at')
      .eq('club_id', clubData.club.id)
      .eq('tool_name', 'playtime_calculator')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<{ created_at: string | null }>()
  ]);
  const lastPlaytimeUsed = lastPlaytimeUsageData?.created_at
    ? new Date(lastPlaytimeUsageData.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : 'Not used yet';

  return (
    <div className="-mx-4 -my-4 min-h-screen px-4 pb-16 pt-10 md:-mx-8 md:-my-8 md:px-8" style={{ background: `radial-gradient(ellipse at top, ${primaryColour}10 0%, transparent 50%), #080a0f` }}>
      <section className="pb-2">
        <h1 className="hidden text-5xl font-black tracking-tight text-white md:block">Welcome to {clubData.club.name}</h1>
        <p className="mt-4 text-xl font-semibold text-white md:hidden">Good {greeting}, {clubData.firstName}</p>
        <p className="mt-3 hidden text-lg font-normal text-white/40 md:block">Good {greeting}, {clubData.firstName} - here&apos;s your club overview.</p>
        <div className="mt-4 h-px w-full bg-white/[0.06]" />
      </section>

      <section className="mt-4 flex flex-row gap-3 overflow-x-auto pb-1 scrollbar-hide md:hidden">
        {stats.map(([label, value]) => (
          <article key={label} className="flex min-w-[72px] flex-col items-center rounded-full border px-4 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <p className="text-lg font-bold leading-none" style={{ color: primaryColour }}>{value}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-white/40">{label}</p>
          </article>
        ))}
      </section>

      <section className="mt-4 hidden gap-4 md:grid md:grid-cols-4">
        {stats.map(([label, value]) => (
          <article key={label} className="max-h-[100px] rounded-2xl border p-4 transition-all duration-300 ease-out hover:-translate-y-0.5" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-xs uppercase tracking-[0.22em] text-white/30">Total {label}</p>
            <p className="mt-2 text-3xl font-black leading-none" style={{ color: primaryColour }}>{value}</p>
          </article>
        ))}
      </section>

      <Link href="/dashboard/club/compliance" className="mt-6 block rounded-2xl border p-6 transition-all duration-300 ease-out hover:-translate-y-0.5" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/30">Compliance Overview</p>
            <h3 className="mt-2 text-2xl font-bold text-white">Coach checks and qualifications</h3>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <span className="rounded-xl bg-white/[0.03] px-4 py-3"><strong className="block text-2xl text-emerald-400">{complianceCounts.compliant}</strong><small className="text-white/35">compliant</small></span>
            <span className="rounded-xl bg-white/[0.03] px-4 py-3"><strong className="block text-2xl text-amber-400">{complianceCounts.expiring}</strong><small className="text-white/35">expiring</small></span>
            <span className="rounded-xl bg-white/[0.03] px-4 py-3"><strong className="block text-2xl text-red-400">{complianceCounts.expired}</strong><small className="text-white/35">expired</small></span>
          </div>
        </div>
      </Link>

      <section className="mt-4 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/30">Tools</p>
            <h3 className="mt-2 text-2xl font-bold text-white">Playtime Calculator</h3>
            <p className="mt-1 text-sm text-white/35">Used {playtimeUsageCount ?? 0} times this season</p>
          </div>
          <span className="rounded-full border px-4 py-2 text-sm text-white/50" style={{ borderColor: `${primaryColour}33`, backgroundColor: `${primaryColour}14` }}>Last used {lastPlaytimeUsed}</span>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">Your Teams</h3>
            <p className="mt-1 text-sm text-white/30">Manage and monitor all your teams</p>
          </div>
        </div>
        {clubData.teams.length === 0 ? <p className="py-12 text-center text-gray-500">No teams yet.</p> : <ClubTeamScroller teams={clubData.teams} clubId={clubData.club.id} clubName={clubData.club.name} primaryColour={primaryColour} contrastText={contrastText} />}
      </section>

      <ClubFixturesPanel fixtures={clubData.fixtures} primaryColour={primaryColour} darkerPrimary={darkerPrimary} contrastText={contrastText} />
    </div>
  );
}

import Link from 'next/link';
import { getClubData } from '@/lib/dashboard/getClubData';
import { createClient } from '@/lib/supabase/server';

interface CoachRow {
  user_id: string;
  users_profile: { full_name: string | null } | Array<{ full_name: string | null }> | null;
}

interface ComplianceDateRow {
  user_id: string;
  expiry_date: string | null;
}

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function statusFor(expiryDate: string | null): 'compliant' | 'expiring' | 'expired' {
  if (!expiryDate) return 'expired';
  const days = Math.ceil((new Date(expiryDate).valueOf() - Date.now()) / 86400000);
  if (days <= 0) return 'expired';
  if (days <= 90) return 'expiring';
  return 'compliant';
}

function dot(status: string): string {
  if (status === 'compliant') return '#10b981';
  if (status === 'expiring') return '#f59e0b';
  return '#ef4444';
}

export default async function ClubCompliancePage() {
  const clubData = await getClubData();
  if (!clubData) return null;
  const supabase = await createClient();
  const teamIds = clubData.teams.map((team) => team.id);
  const { data: coachData } =
    teamIds.length > 0
      ? await supabase.from('team_coaches').select('user_id,users_profile(full_name)').in('team_id', teamIds)
      : { data: [] as CoachRow[] };
  const coaches = Array.from(new Map(((coachData ?? []) as CoachRow[]).map((coach) => [coach.user_id, coach])).values());
  const coachIds = coaches.map((coach) => coach.user_id);
  const [{ data: dbsData }, { data: qualificationData }] = await Promise.all([
    coachIds.length > 0 ? supabase.from('coach_dbs').select('user_id,expiry_date').in('user_id', coachIds) : Promise.resolve({ data: [] as ComplianceDateRow[] }),
    coachIds.length > 0 ? supabase.from('coach_qualifications').select('user_id,expiry_date').in('user_id', coachIds) : Promise.resolve({ data: [] as ComplianceDateRow[] })
  ]);
  const dbsRows = (dbsData ?? []) as ComplianceDateRow[];
  const qualificationRows = (qualificationData ?? []) as ComplianceDateRow[];
  const rows = coaches.map((coach) => {
    const profile = first(coach.users_profile);
    const dbsStatus = statusFor(dbsRows.find((item) => item.user_id === coach.user_id)?.expiry_date ?? null);
    const qualificationStatuses = qualificationRows.filter((item) => item.user_id === coach.user_id).map((item) => statusFor(item.expiry_date));
    const qualificationStatus = qualificationStatuses.includes('expired') || qualificationStatuses.length === 0 ? 'expired' : qualificationStatuses.includes('expiring') ? 'expiring' : 'compliant';
    return { id: coach.user_id, name: profile?.full_name ?? 'Coach', dbsStatus, qualificationStatus };
  });
  const compliant = rows.filter((row) => row.dbsStatus === 'compliant' && row.qualificationStatus === 'compliant').length;
  const expired = rows.filter((row) => row.dbsStatus === 'expired' || row.qualificationStatus === 'expired').length;
  const expiring = rows.length - compliant - expired;

  return (
    <main className="-mx-4 -my-4 min-h-screen px-4 py-8 text-white md:-mx-8 md:-my-8 md:px-8" style={{ backgroundColor: '#080a0f' }}>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-white/30">Club Admin</p>
        <h1 className="mt-3 text-4xl font-black">Compliance Overview</h1>
      </div>
      <section className="grid gap-4 md:grid-cols-3">
        {[['Compliant', compliant, '#10b981'], ['Expiring', expiring, '#f59e0b'], ['Expired', expired, '#ef4444']].map(([label, value, colour]) => (
          <article key={String(label)} className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-xs uppercase tracking-[0.24em] text-white/30">{label}</p>
            <p className="mt-3 text-4xl font-black" style={{ color: String(colour) }}>{value}</p>
          </article>
        ))}
      </section>
      <section className="mt-8 overflow-hidden rounded-2xl border" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {rows.map((row) => (
          <Link key={row.id} href={`/dashboard/club/coaches/${row.id}/compliance`} className="grid gap-3 border-b border-white/[0.06] p-5 transition-all duration-300 ease-out hover:bg-white/[0.03] md:grid-cols-3">
            <span className="font-semibold text-white">{row.name}</span>
            <span className="text-sm text-white/45"><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: dot(row.dbsStatus) }} />DBS {row.dbsStatus}</span>
            <span className="text-sm text-white/45"><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: dot(row.qualificationStatus) }} />Qualifications {row.qualificationStatus}</span>
          </Link>
        ))}
      </section>
    </main>
  );
}

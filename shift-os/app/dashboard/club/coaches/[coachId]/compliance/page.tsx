import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClubData } from '@/lib/dashboard/getClubData';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: { coachId: string };
}

interface QualificationRow {
  qualification_name: string;
  issuing_body: string | null;
  achieved_date: string | null;
  expiry_date: string | null;
  certificate_url: string | null;
}

interface DbsRow {
  certificate_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  dbs_type: string | null;
  certificate_url: string | null;
}

function statusFor(expiryDate: string | null): { label: string; colour: string } {
  if (!expiryDate) return { label: 'No expiry', colour: 'rgba(255,255,255,0.25)' };
  const days = Math.ceil((new Date(expiryDate).valueOf() - Date.now()) / 86400000);
  if (days <= 0) return { label: 'Expired', colour: '#7f1d1d' };
  if (days <= 30) return { label: 'Urgent', colour: '#ef4444' };
  if (days <= 90) return { label: 'Expiring Soon', colour: '#f59e0b' };
  return { label: 'Valid', colour: '#10b981' };
}

export default async function CoachComplianceReadOnlyPage({ params }: PageProps) {
  const clubData = await getClubData();
  if (!clubData) return null;
  const supabase = await createClient();
  const teamIds = clubData.teams.map((team) => team.id);
  const { data: membership } = teamIds.length > 0 ? await supabase.from('team_coaches').select('user_id').eq('user_id', params.coachId).in('team_id', teamIds).maybeSingle() : { data: null };
  if (!membership) notFound();
  const [{ data: profile }, { data: qualificationsData }, { data: dbsData }] = await Promise.all([
    supabase.from('users_profile').select('full_name').eq('id', params.coachId).maybeSingle<{ full_name: string | null }>(),
    supabase.from('coach_qualifications').select('qualification_name,issuing_body,achieved_date,expiry_date,certificate_url').eq('user_id', params.coachId).order('expiry_date', { ascending: true }),
    supabase.from('coach_dbs').select('certificate_number,issue_date,expiry_date,dbs_type,certificate_url').eq('user_id', params.coachId).maybeSingle<DbsRow>()
  ]);
  const qualifications = (qualificationsData ?? []) as QualificationRow[];

  return (
    <main className="-mx-4 -my-4 min-h-screen px-4 py-8 text-white md:-mx-8 md:-my-8 md:px-8" style={{ backgroundColor: '#080a0f' }}>
      <Link href="/dashboard/club/compliance" className="text-sm text-white/40">Back to Compliance</Link>
      <h1 className="mt-5 text-4xl font-black">{profile?.full_name ?? 'Coach'} Compliance</h1>
      <section className="mt-8 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <h2 className="text-2xl font-bold">DBS Check</h2>
        {dbsData ? <p className="mt-4 text-white/45">{dbsData.dbs_type} / expires {dbsData.expiry_date ?? 'not set'} <span className="ml-2 rounded-full px-3 py-1 text-xs text-white" style={{ backgroundColor: statusFor(dbsData.expiry_date).colour }}>{statusFor(dbsData.expiry_date).label}</span></p> : <p className="mt-4 text-white/35">No DBS record.</p>}
      </section>
      <section className="mt-6 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <h2 className="text-2xl font-bold">Qualifications</h2>
        <div className="mt-5 space-y-3">
          {qualifications.length === 0 ? <p className="text-white/35">No qualifications recorded.</p> : qualifications.map((item) => (
            <article key={`${item.qualification_name}-${item.expiry_date}`} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="font-semibold">{item.qualification_name}</p>
              <p className="mt-1 text-sm text-white/40">{item.issuing_body ?? 'Issuing body not set'} / expires {item.expiry_date ?? 'not set'}</p>
              <span className="mt-3 inline-block rounded-full px-3 py-1 text-xs text-white" style={{ backgroundColor: statusFor(item.expiry_date).colour }}>{statusFor(item.expiry_date).label}</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

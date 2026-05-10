import { redirect } from 'next/navigation';
import CoachComplianceForm from '@/components/dashboard/CoachComplianceForm';
import BottomNav from '@/components/mobile/BottomNav';
import { getCoachData } from '@/lib/dashboard/getCoachData';
import { createClient } from '@/lib/supabase/server';

interface QualificationRow {
  id?: string;
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
  dbs_type: 'basic' | 'standard' | 'enhanced' | 'enhanced_barred' | null;
  certificate_url: string | null;
}

export default async function CoachProfilePage() {
  const coachData = await getCoachData();
  if (!coachData) redirect('/dashboard/coach/welcome');
  const primaryColour = coachData.teams[0]?.club_primary_colour ?? '#00C851';
  const supabase = await createClient();
  const [{ data: qualificationsData }, { data: dbsData }] = await Promise.all([
    supabase.from('coach_qualifications').select('id,qualification_name,issuing_body,achieved_date,expiry_date,certificate_url').eq('user_id', coachData.coach.id).order('expiry_date', { ascending: true }),
    supabase.from('coach_dbs').select('certificate_number,issue_date,expiry_date,dbs_type,certificate_url').eq('user_id', coachData.coach.id).maybeSingle<DbsRow>()
  ]);
  const qualifications = ((qualificationsData ?? []) as QualificationRow[]).map((item) => ({
    id: item.id,
    qualification_name: item.qualification_name,
    issuing_body: item.issuing_body ?? '',
    achieved_date: item.achieved_date ?? '',
    expiry_date: item.expiry_date ?? '',
    certificate_url: item.certificate_url
  }));

  return (
    <main className="min-h-screen px-5 pb-[92px] pt-8 text-white" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[480px]">
        <p className="text-xs uppercase tracking-[0.3em] text-white/30">Coach Profile</p>
        <h1 className="mt-3 text-3xl font-black">Compliance</h1>
        <p className="mt-2 text-sm text-white/40">Keep your DBS and coaching certificates current.</p>
        <div className="mt-6">
          <CoachComplianceForm
            userId={coachData.coach.id}
            primaryColour={primaryColour}
            initialQualifications={qualifications}
            initialDbs={dbsData ? {
              certificate_number: dbsData.certificate_number ?? '',
              issue_date: dbsData.issue_date ?? '',
              expiry_date: dbsData.expiry_date ?? '',
              dbs_type: dbsData.dbs_type ?? 'enhanced',
              certificate_url: dbsData.certificate_url
            } : null}
          />
        </div>
      </div>
      <BottomNav primaryColour={primaryColour} items={[
        { href: '/dashboard/coach', label: 'Squad', icon: 'S' },
        { href: '/dashboard/coach/schedule', label: 'Schedule', icon: 'C' },
        { href: '/dashboard/coach/stats', label: 'Stats', icon: 'D' },
        { href: '/dashboard/coach/messages', label: 'Messages', icon: 'M' },
        { href: '/dashboard/coach/settings', label: 'Settings', icon: 'S' }
      ]} />
    </main>
  );
}

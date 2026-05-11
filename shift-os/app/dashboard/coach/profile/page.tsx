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

interface RecognitionSettingsRow {
  bronze_threshold: number | null;
  silver_threshold: number | null;
  gold_threshold: number | null;
  bronze_reward: string | null;
  silver_reward: string | null;
  gold_reward: string | null;
}

interface RecognitionTotalRow {
  positive_ticket_count: number | null;
  current_tier: string | null;
}

function nextRecognitionTarget(count: number, settings: RecognitionSettingsRow | null): { label: string; threshold: number; reward: string } | null {
  const bronze = settings?.bronze_threshold ?? 5;
  const silver = settings?.silver_threshold ?? 15;
  const gold = settings?.gold_threshold ?? 30;
  if (count < bronze) return { label: 'Bronze', threshold: bronze, reward: settings?.bronze_reward ?? 'Recognised Coach badge' };
  if (count < silver) return { label: 'Silver', threshold: silver, reward: settings?.silver_reward ?? 'Highly Regarded Coach badge' };
  if (count < gold) return { label: 'Gold', threshold: gold, reward: settings?.gold_reward ?? 'Outstanding Coach badge' };
  return null;
}

export default async function CoachProfilePage() {
  const coachData = await getCoachData();
  if (!coachData) redirect('/dashboard/coach/welcome');
  const primaryColour = coachData.teams[0]?.club_primary_colour ?? '#00C851';
  const supabase = await createClient();
  const activeTeam = coachData.teams[0] ?? null;
  const [{ data: qualificationsData }, { data: dbsData }, { data: recognitionSettings }, { data: recognitionTotals }] = await Promise.all([
    supabase.from('coach_qualifications').select('id,qualification_name,issuing_body,achieved_date,expiry_date,certificate_url').eq('user_id', coachData.coach.id).order('expiry_date', { ascending: true }),
    supabase.from('coach_dbs').select('certificate_number,issue_date,expiry_date,dbs_type,certificate_url').eq('user_id', coachData.coach.id).maybeSingle<DbsRow>(),
    activeTeam?.club_id ? supabase.from('coach_recognition_settings').select('bronze_threshold,silver_threshold,gold_threshold,bronze_reward,silver_reward,gold_reward').eq('club_id', activeTeam.club_id).maybeSingle<RecognitionSettingsRow>() : Promise.resolve({ data: null }),
    activeTeam ? supabase.from('coach_recognition_totals').select('positive_ticket_count,current_tier').eq('coach_user_id', coachData.coach.id).eq('team_id', activeTeam.id).maybeSingle<RecognitionTotalRow>() : Promise.resolve({ data: null })
  ]);
  const qualifications = ((qualificationsData ?? []) as QualificationRow[]).map((item) => ({
    id: item.id,
    qualification_name: item.qualification_name,
    issuing_body: item.issuing_body ?? '',
    achieved_date: item.achieved_date ?? '',
    expiry_date: item.expiry_date ?? '',
    certificate_url: item.certificate_url
  }));
  const positiveCount = recognitionTotals?.positive_ticket_count ?? 0;
  const target = nextRecognitionTarget(positiveCount, recognitionSettings ?? null);
  const progressMax = target?.threshold ?? Math.max(positiveCount, 1);
  const progressPercent = Math.min(100, Math.round((positiveCount / progressMax) * 100));

  return (
    <main className="min-h-screen px-5 pb-[92px] pt-8 text-white" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[480px]">
        <p className="text-xs uppercase tracking-[0.3em] text-white/30">Coach Profile</p>
        <h1 className="mt-3 text-3xl font-black">Compliance</h1>
        <p className="mt-2 text-sm text-white/40">Keep your DBS and coaching certificates current.</p>
        {activeTeam?.club_id ? (
          <section className="mt-6 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-xs uppercase tracking-[0.25em] text-white/30">Your Recognition</p>
            <h2 className="mt-3 text-2xl font-black">{positiveCount} positive tickets this season</h2>
            <p className="mt-2 text-sm text-white/40">Current tier: <span className="text-white">{recognitionTotals?.current_tier ?? 'none'}</span></p>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, backgroundColor: '#f59e0b' }} />
            </div>
            {target ? <p className="mt-3 text-sm text-white/45">{Math.max(target.threshold - positiveCount, 0)} more to reach {target.label}. Reward: {target.reward}</p> : <p className="mt-3 text-sm text-amber-200">Gold tier reached.</p>}
          </section>
        ) : null}
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
        { href: '/dashboard/coach/tickets', label: 'Tickets', icon: 'T' },
        { href: '/dashboard/coach/profile', label: 'Profile', icon: 'P' },
        { href: '/dashboard/coach/settings', label: 'Settings', icon: 'S' }
      ]} />
    </main>
  );
}

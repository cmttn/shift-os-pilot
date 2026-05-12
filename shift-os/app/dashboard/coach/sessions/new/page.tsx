import { redirect } from 'next/navigation';
import CreateSessionForm from '@/components/dashboard/CreateSessionForm';
import { getCoachData } from '@/lib/dashboard/getCoachData';

type SessionType = 'match' | 'training' | 'tournament';

interface NewSessionPageProps {
  searchParams?: {
    type?: string;
  };
}

function getInitialSessionType(value: string | undefined): SessionType {
  if (value === 'training' || value === 'tournament') return value;
  return 'match';
}

export default async function NewSessionPage({ searchParams }: NewSessionPageProps) {
  const coachData = await getCoachData();
  if (!coachData) redirect('/dashboard/coach/welcome');
  const independentTeams = coachData.teams.filter((team) => !team.is_club_managed);
  if (coachData.teams.length > 0 && independentTeams.length === 0) redirect('/dashboard/coach');
  const writableCoachData = { ...coachData, teams: independentTeams, activeTeamId: independentTeams[0]?.id ?? '' };
  const initialType = getInitialSessionType(searchParams?.type);

  return (
    <main className="min-h-screen px-5 pb-32 pt-8 text-white" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[480px]">
        <h1 className="text-3xl font-black tracking-tight">Add Session</h1>
        <p className="mt-2 text-sm text-white/40">Create a match, training session or tournament.</p>
        <section className="mt-6 rounded-2xl border p-5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <CreateSessionForm coachData={writableCoachData} initialType={initialType} />
        </section>
      </div>
    </main>
  );
}

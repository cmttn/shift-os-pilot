'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { generateJoinCode } from '@/lib/utils/generateJoinCode';

type Gender = 'boys' | 'girls' | 'mixed';

interface CoachCreateTeamFormProps {
  userId: string;
  primaryColour: string;
}

interface InsertedTeam {
  id: string;
}

const ageGroups = ['U6', 'U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15', 'U16', 'U17', 'U18', 'Open Age', 'Veterans'];

export default function CoachCreateTeamForm({ userId, primaryColour }: CoachCreateTeamFormProps) {
  const router = useRouter();
  const [teamName, setTeamName] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [gender, setGender] = useState<Gender>('boys');
  const [league, setLeague] = useState('');
  const [season, setSeason] = useState('2025-26');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!teamName.trim() || !ageGroup) {
      setError('Team name and age group are required.');
      return;
    }

    setLoading(true);
    setError('');
    const supabase = createClient();
    const { data, error: teamError } = await supabase
      .from('teams')
      .insert({
        club_id: null,
        name: teamName.trim(),
        age_group: ageGroup,
        gender,
        league: league.trim() || null,
        season: season.trim() || null,
        join_code: generateJoinCode(),
        is_active: true
      })
      .select('id')
      .single<InsertedTeam>();

    if (teamError || !data) {
      setLoading(false);
      setError(teamError?.message ?? 'Team could not be created.');
      return;
    }

    const { error: coachError } = await supabase.from('team_coaches').insert({ team_id: data.id, user_id: userId, is_lead: true });
    if (coachError) {
      setLoading(false);
      setError(coachError.message);
      return;
    }

    const { data: existingMember } = await supabase.from('club_members').select('id').eq('user_id', userId).eq('club_role', 'coach').maybeSingle<{ id: string }>();
    if (!existingMember) {
      const { error: memberError } = await supabase.from('club_members').insert({ club_id: null, user_id: userId, club_role: 'coach', is_active: true });
      if (memberError) {
        setLoading(false);
        setError(memberError.message);
        return;
      }
    }

    router.push('/dashboard/coach');
    router.refresh();
  }

  const inputClass = 'w-full rounded-[10px] border border-white/[0.08] bg-white/[0.04] p-4 text-white outline-none transition-all duration-300 ease-out placeholder:text-white/20 focus:border-white/30';

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-[680px] rounded-2xl border p-8" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="space-y-5">
        <input value={teamName} onChange={(event) => setTeamName(event.target.value)} className={inputClass} placeholder="Team Name" />
        <select value={ageGroup} onChange={(event) => setAgeGroup(event.target.value)} className={inputClass}>
          <option value="" className="bg-[#0d1117]">Age Group</option>
          {ageGroups.map((group) => <option key={group} value={group} className="bg-[#0d1117]">{group}</option>)}
        </select>
        <div className="grid grid-cols-3 gap-2">
          {(['boys', 'girls', 'mixed'] as Gender[]).map((option) => (
            <button key={option} type="button" onClick={() => setGender(option)} className="rounded-full border px-4 py-3 text-sm font-semibold capitalize transition-all duration-300 ease-out" style={gender === option ? { backgroundColor: primaryColour, borderColor: primaryColour, color: '#ffffff' } : { borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}>
              {option}
            </button>
          ))}
        </div>
        <input value={league} onChange={(event) => setLeague(event.target.value)} className={inputClass} placeholder="League (optional)" />
        <input value={season} onChange={(event) => setSeason(event.target.value)} className={inputClass} placeholder="Season" />
      </div>
      {error ? <p className="mt-5 text-sm text-red-200">{error}</p> : null}
      <button disabled={loading} type="submit" className="mt-8 rounded-full px-8 py-4 font-semibold text-white transition-all duration-300 ease-out disabled:opacity-50" style={{ backgroundColor: primaryColour }}>
        {loading ? 'Creating...' : 'Create Team →'}
      </button>
    </form>
  );
}

'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface CoachJoinTeamFormProps {
  primaryColour: string;
  userId: string;
  coachName: string;
  coachEmail: string;
}

interface FoundTeam {
  id: string;
  name: string;
  age_group: string | null;
  club_id: string | null;
}

export default function CoachJoinTeamForm({ primaryColour, userId, coachName, coachEmail }: CoachJoinTeamFormProps) {
  const [code, setCode] = useState('');
  const [team, setTeam] = useState<FoundTeam | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function findTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setTeam(null);
    if (code.length !== 6) {
      setMessage('Enter the 6 character team code.');
      return;
    }

    setLoading(true);
    const { data, error } = await createClient()
      .from('teams')
      .select('id,name,age_group,club_id')
      .eq('join_code', code)
      .eq('is_active', true)
      .maybeSingle<FoundTeam>();
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }
    if (!data) {
      setMessage('No team found with that code.');
      return;
    }
    setTeam(data);
  }

  async function requestToJoin() {
    if (!team) return;
    setLoading(true);
    setMessage('');
    const { error } = await createClient().from('pending_join_requests').insert({
      team_id: team.id,
      player_user_id: userId,
      full_name: coachName,
      dob: new Date().toISOString().slice(0, 10),
      parent_name: 'Coach request',
      parent_contact: coachEmail
    });
    setLoading(false);
    setMessage(error ? error.message : 'Request sent. Your coach will be notified.');
  }

  return (
    <div className="mt-6">
      <form onSubmit={findTeam} className="flex gap-2">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 6))}
          className="min-w-0 flex-1 rounded-[10px] border border-white/[0.08] bg-white/[0.04] p-4 font-mono text-lg font-black tracking-[0.24em] text-white outline-none transition-all duration-300 ease-out focus:border-white/30"
          placeholder="ABC234"
        />
        <button type="submit" disabled={loading} className="rounded-full px-5 py-3 text-sm font-semibold text-white transition-all duration-300 ease-out disabled:opacity-50" style={{ backgroundColor: primaryColour }}>
          Find
        </button>
      </form>
      {team ? (
        <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <p className="text-xl font-bold text-white">{team.name}</p>
          <p className="mt-1 text-sm text-white/35">{team.age_group ?? 'Age group not set'}</p>
          <button type="button" onClick={requestToJoin} disabled={loading} className="mt-5 rounded-full px-5 py-3 text-sm font-semibold text-white transition-all duration-300 ease-out disabled:opacity-50" style={{ backgroundColor: primaryColour }}>
            Request to Join
          </button>
        </div>
      ) : null}
      {message ? <p className="mt-4 text-sm text-white/45">{message}</p> : null}
    </div>
  );
}

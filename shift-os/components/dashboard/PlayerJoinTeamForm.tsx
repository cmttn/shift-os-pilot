'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface PlayerJoinTeamFormProps {
  primaryColour: string;
  userId: string;
  defaultName: string;
}

interface FoundTeam {
  id: string;
  name: string;
  age_group: string | null;
}

export default function PlayerJoinTeamForm({ primaryColour, userId, defaultName }: PlayerJoinTeamFormProps) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [team, setTeam] = useState<FoundTeam | null>(null);
  const [fullName, setFullName] = useState(defaultName);
  const [dob, setDob] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentContact, setParentContact] = useState('');
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
      .select('id,name,age_group')
      .eq('join_code', code)
      .eq('is_active', true)
      .maybeSingle<FoundTeam>();
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    if (!data) {
      setMessage('No team found. Check your code and try again.');
      return;
    }
    setTeam(data);
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!team || !fullName.trim() || !dob || !parentName.trim() || !parentContact.trim()) {
      setMessage('Complete all request fields.');
      return;
    }
    setLoading(true);
    const { error } = await createClient().from('pending_join_requests').insert({
      team_id: team.id,
      player_user_id: userId,
      full_name: fullName.trim(),
      dob,
      parent_name: parentName.trim(),
      parent_contact: parentContact.trim()
    });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.push('/dashboard/player');
    router.refresh();
  }

  const fieldClass = 'w-full rounded-[10px] border border-white/[0.08] bg-white/[0.04] p-4 text-white outline-none transition-all duration-300 ease-out placeholder:text-white/20 focus:border-white/30';

  return (
    <div className="mt-8">
      <form onSubmit={findTeam} className="flex gap-2">
        <input value={code} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 6))} className={`${fieldClass} font-mono text-lg font-black tracking-[0.24em]`} placeholder="ABC234" />
        <button type="submit" disabled={loading} className="rounded-full px-5 py-3 text-sm font-semibold text-white transition-all duration-300 ease-out disabled:opacity-50" style={{ backgroundColor: primaryColour }}>
          Find
        </button>
      </form>
      {team ? (
        <form onSubmit={submitRequest} className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="text-2xl font-bold text-white">{team.name}</h2>
          <p className="mt-1 text-sm text-white/35">{team.age_group ?? 'Age group not set'}</p>
          <div className="mt-6 grid gap-4">
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} className={fieldClass} placeholder="Full Name" />
            <input type="date" value={dob} onChange={(event) => setDob(event.target.value)} className={fieldClass} />
            <input value={parentName} onChange={(event) => setParentName(event.target.value)} className={fieldClass} placeholder="Parent/Guardian Name" />
            <input value={parentContact} onChange={(event) => setParentContact(event.target.value)} className={fieldClass} placeholder="Parent/Guardian phone or email" />
          </div>
          <button type="submit" disabled={loading} className="mt-6 rounded-full px-6 py-3 font-semibold text-white transition-all duration-300 ease-out disabled:opacity-50" style={{ backgroundColor: primaryColour }}>
            Send Join Request →
          </button>
        </form>
      ) : null}
      {message ? <p className="mt-4 text-sm text-white/45">{message}</p> : null}
    </div>
  );
}

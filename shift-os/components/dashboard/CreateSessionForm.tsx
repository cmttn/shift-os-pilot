'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { CoachDashboardData } from '@/lib/dashboard/getCoachData';
import { createClient } from '@/lib/supabase/client';

type SessionType = 'match' | 'training' | 'tournament';

interface CreateSessionFormProps {
  coachData: CoachDashboardData;
}

export default function CreateSessionForm({ coachData }: CreateSessionFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultType = searchParams.get('type');
  const [type, setType] = useState<SessionType>(defaultType === 'training' || defaultType === 'tournament' ? defaultType : 'match');
  const [teamId, setTeamId] = useState(coachData.activeTeamId);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [postcode, setPostcode] = useState('');
  const [oppositionContactName, setOppositionContactName] = useState('');
  const [oppositionContactPhone, setOppositionContactPhone] = useState('');
  const [coachNotes, setCoachNotes] = useState('');
  const [tournifyLink, setTournifyLink] = useState('');
  const [opponent, setOpponent] = useState('');
  const [title, setTitle] = useState('');
  const [isHome, setIsHome] = useState(true);
  const [weekOffPlayerIds, setWeekOffPlayerIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const activeTeam = coachData.teams.find((team) => team.id === teamId) ?? coachData.teams[0] ?? null;
  const primaryColour = activeTeam?.club_primary_colour ?? '#00C851';
  const players = useMemo(() => coachData.players.filter((player) => player.team_id === teamId), [coachData.players, teamId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!teamId || !date || !time) {
      setError('Team, date and time are required.');
      return;
    }
    if (type === 'match' && !opponent.trim()) {
      setError('Opponent is required for matches.');
      return;
    }
    if (type === 'tournament' && (!title.trim() || !location.trim())) {
      setError('Tournament name and venue are required.');
      return;
    }

    setLoading(true);
    setError('');
    const sessionDate = new Date(`${date}T${time}`).toISOString();
    const { data, error: insertError } = await createClient()
      .from('sessions')
      .insert({
        team_id: teamId,
        created_by: coachData.coach.id,
        type,
        title: type === 'match' ? null : title.trim() || (type === 'training' ? 'Training' : null),
        opponent: type === 'match' ? opponent.trim() : null,
        session_date: sessionDate,
        location: location.trim() || null,
        full_address: fullAddress.trim() || null,
        postcode: postcode.trim() || null,
        opposition_contact_name: oppositionContactName.trim() || null,
        opposition_contact_phone: oppositionContactPhone.trim() || null,
        coach_notes: coachNotes.trim() || null,
        tournify_link: type === 'tournament' ? tournifyLink.trim() || null : null,
        is_home: isHome,
        notes: weekOffPlayerIds.length > 0 ? `Week off before poll: ${weekOffPlayerIds.join(',')}` : null
      })
      .select('id')
      .single<{ id: string }>();

    setLoading(false);
    if (insertError || !data) {
      setError(insertError?.message ?? 'Session could not be created.');
      return;
    }
    router.push(`/dashboard/coach/sessions/${data.id}`);
    router.refresh();
  }

  const inputClass = 'w-full rounded-[10px] border border-white/[0.08] bg-white/[0.04] p-4 text-white outline-none transition-all duration-300 ease-out placeholder:text-white/20 focus:border-white/30';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-3 gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1">
        {(['match', 'training', 'tournament'] as SessionType[]).map((option) => (
          <button key={option} type="button" onClick={() => setType(option)} className="rounded-full px-3 py-2 text-sm font-semibold capitalize transition-all duration-300 ease-out" style={type === option ? { backgroundColor: primaryColour, color: '#ffffff' } : { color: 'rgba(255,255,255,0.45)' }}>
            {option}
          </button>
        ))}
      </div>

      <select value={teamId} onChange={(event) => setTeamId(event.target.value)} className={inputClass}>
        {coachData.teams.map((team) => <option key={team.id} value={team.id} className="bg-[#0d1117]">{team.name}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-3">
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className={inputClass} />
        <input type="time" value={time} onChange={(event) => setTime(event.target.value)} className={inputClass} />
      </div>
      {type === 'match' ? (
        <>
          <input value={opponent} onChange={(event) => setOpponent(event.target.value)} className={inputClass} placeholder="Opponent" />
          <div className="grid grid-cols-2 gap-2">
            {[true, false].map((home) => (
              <button key={String(home)} type="button" onClick={() => setIsHome(home)} className="rounded-full border px-4 py-3 text-sm font-semibold transition-all duration-300 ease-out" style={isHome === home ? { backgroundColor: primaryColour, borderColor: primaryColour, color: '#ffffff' } : { borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}>
                {home ? 'Home' : 'Away'}
              </button>
            ))}
          </div>
        </>
      ) : (
        <input value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} placeholder={type === 'training' ? 'Session title (optional)' : 'Tournament name'} />
      )}
      <input value={location} onChange={(event) => setLocation(event.target.value)} className={inputClass} placeholder={type === 'tournament' ? 'Venue' : 'Location (optional)'} />
      <input value={fullAddress} onChange={(event) => setFullAddress(event.target.value)} className={inputClass} placeholder="Full address" />
      <div className="grid grid-cols-2 gap-3">
        <input value={postcode} onChange={(event) => setPostcode(event.target.value)} className={inputClass} placeholder="Postcode" />
        <input value={oppositionContactPhone} onChange={(event) => setOppositionContactPhone(event.target.value)} className={inputClass} placeholder="Opposition phone" />
      </div>
      <input value={oppositionContactName} onChange={(event) => setOppositionContactName(event.target.value)} className={inputClass} placeholder="Opposition contact name" />
      <textarea value={coachNotes} onChange={(event) => setCoachNotes(event.target.value)} className={`${inputClass} min-h-[112px]`} placeholder="Coach notes" />
      {type === 'tournament' ? <input value={tournifyLink} onChange={(event) => setTournifyLink(event.target.value)} className={inputClass} placeholder="Tournify link" /> : null}

      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <h2 className="font-bold text-white">Week Off Players</h2>
        <p className="mt-1 text-sm text-white/35">Set players as Week Off before sending the poll.</p>
        <div className="mt-4 space-y-2">
          {players.map((player) => {
            const selected = weekOffPlayerIds.includes(player.id);
            return (
              <button key={player.id} type="button" onClick={() => setWeekOffPlayerIds((current) => selected ? current.filter((id) => id !== player.id) : [...current, player.id])} className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition-all duration-300 ease-out">
                <span className="text-sm text-white">{player.full_name}</span>
                <span className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: selected ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.04)', color: selected ? '#ffffff' : 'rgba(255,255,255,0.35)' }}>Week Off</span>
              </button>
            );
          })}
        </div>
      </section>

      {error ? <p className="text-sm text-red-200">{error}</p> : null}
      <button disabled={loading} type="submit" className="w-full rounded-full px-6 py-4 font-semibold text-white transition-all duration-300 ease-out disabled:opacity-50" style={{ backgroundColor: primaryColour }}>
        {loading ? 'Creating Session...' : 'Create Session →'}
      </button>
    </form>
  );
}

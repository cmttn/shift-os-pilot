'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type PlayerMode = 'new' | 'attach';

interface CoachTeamOption {
  id: string;
  name: string;
  ageGroup: string | null;
}

interface ClubPlayerOption {
  id: string;
  fullName: string;
  ageGroup: string | null;
  teamId: string | null;
}

interface AddPlayerFormProps {
  clubId: string | null;
  invitedBy: string;
  primaryColour: string;
  teams: CoachTeamOption[];
  clubPlayers: ClubPlayerOption[];
}

interface SavedPlayer {
  id: string;
}

const ageGroups = ['U6', 'U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15', 'U16', 'U17', 'U18', 'Open Age', 'Veterans'];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export default function AddPlayerForm({ clubId, invitedBy, primaryColour, teams, clubPlayers }: AddPlayerFormProps) {
  const router = useRouter();
  const contrastText = getContrastText(primaryColour);
  const darkerPrimary = darkenHex(primaryColour, 15);
  const inputStyle = { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' };
  const firstTeamId = teams[0]?.id ?? '';
  const firstPlayerId = clubPlayers[0]?.id ?? '';

  const [mode, setMode] = useState<PlayerMode>('new');
  const [teamId, setTeamId] = useState(firstTeamId);
  const [existingPlayerId, setExistingPlayerId] = useState(firstPlayerId);
  const [playerName, setPlayerName] = useState('');
  const [ageGroup, setAgeGroup] = useState(teams[0]?.ageGroup ?? '');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [guardianOneName, setGuardianOneName] = useState('');
  const [guardianOnePhone, setGuardianOnePhone] = useState('');
  const [guardianOneEmail, setGuardianOneEmail] = useState('');
  const [guardianTwoName, setGuardianTwoName] = useState('');
  const [guardianTwoPhone, setGuardianTwoPhone] = useState('');
  const [guardianTwoEmail, setGuardianTwoEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedTeam = useMemo(() => teams.find((team) => team.id === teamId), [teamId, teams]);

  const validate = (): string | null => {
    if (!teamId) return 'Choose a team first.';
    if (mode === 'attach' && !existingPlayerId) return 'Choose a player from the club database.';
    if (mode === 'new') {
      if (!playerName.trim()) return 'Player name is required.';
      if (!ageGroup) return 'Age group is required.';
      if (!dateOfBirth) return 'Date of birth is required.';
    }
    if (!guardianOneName.trim()) return 'Guardian 1 name is required.';
    if (!guardianOnePhone.trim()) return 'Guardian 1 phone is required.';
    if (!guardianOneEmail.trim()) return 'Guardian 1 email is required.';
    if (!emailPattern.test(guardianOneEmail.trim())) return 'Guardian 1 email must be valid.';
    if (guardianTwoEmail.trim() && !emailPattern.test(guardianTwoEmail.trim())) return 'Guardian 2 email must be valid.';
    return null;
  };

  const createParentInvite = async (playerId: string, name: string, email: string, phone: string): Promise<string> => {
    if (!clubId) return '';
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error: inviteError } = await createClient().from('pending_invites').insert({
      club_id: clubId,
      team_id: teamId,
      player_id: playerId,
      invited_by: invitedBy,
      invite_token: token,
      role: 'parent',
      invitee_name: name.trim(),
      invitee_email: email.trim(),
      invitee_phone: phone.trim() || null,
      is_lead: true,
      expires_at: expiresAt
    });
    if (inviteError) throw inviteError;
    return `${window.location.origin}/auth/signup?role=parent&invite=${token}&club=${clubId}&team=${teamId}&player=${playerId}`;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);
    try {
      let playerId = existingPlayerId;

      if (mode === 'new') {
        const { data, error: playerError } = await createClient()
          .from('players')
          .insert({
            club_id: clubId,
            team_id: teamId,
            full_name: playerName.trim(),
            age_group: ageGroup,
            date_of_birth: dateOfBirth,
            guardian_1_name: guardianOneName.trim(),
            guardian_1_phone: guardianOnePhone.trim(),
            guardian_1_email: guardianOneEmail.trim(),
            guardian_2_name: guardianTwoName.trim() || null,
            guardian_2_phone: guardianTwoPhone.trim() || null,
            guardian_2_email: guardianTwoEmail.trim() || null,
            is_active: true
          })
          .select('id')
          .single();

        if (playerError) throw playerError;
        const savedPlayer = data as SavedPlayer | null;
        if (!savedPlayer) throw new Error('Player could not be created.');
        playerId = savedPlayer.id;
      } else {
        const { error: attachError } = await createClient()
          .from('players')
          .update({
            team_id: teamId,
            guardian_1_name: guardianOneName.trim(),
            guardian_1_phone: guardianOnePhone.trim(),
            guardian_1_email: guardianOneEmail.trim(),
            guardian_2_name: guardianTwoName.trim() || null,
            guardian_2_phone: guardianTwoPhone.trim() || null,
            guardian_2_email: guardianTwoEmail.trim() || null
          })
          .eq('id', playerId)
          .eq('club_id', clubId);
        if (attachError) throw attachError;
      }

      const primaryInviteUrl = await createParentInvite(playerId, guardianOneName, guardianOneEmail, guardianOnePhone);
      const secondaryInviteUrl =
        guardianTwoEmail.trim() && guardianTwoName.trim()
          ? await createParentInvite(playerId, guardianTwoName, guardianTwoEmail, guardianTwoPhone)
          : '';

      const params = new URLSearchParams({
        team_id: teamId,
        invite_url: primaryInviteUrl
      });
      if (secondaryInviteUrl) params.set('secondary_invite_url', secondaryInviteUrl);
      router.push(`/dashboard/coach/players/${playerId}/success?${params.toString()}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong while saving the player.');
      setLoading(false);
    }
  };

  const fieldClass = 'w-full rounded-[10px] border p-4 text-white outline-none transition-all duration-300 ease-out placeholder:text-white/20 focus:border-white/30';
  const labelClass = 'mb-2 block text-sm font-medium text-white/50';

  return (
    <form onSubmit={handleSubmit} className="max-w-[760px]">
      <section className="mb-6 rounded-2xl border p-8" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <h2 className="mb-6 text-xl font-bold text-white">Team Environment</h2>
        <div>
          <label className={labelClass}>Team</label>
          <select value={teamId} onChange={(event) => setTeamId(event.target.value)} className={fieldClass} style={inputStyle}>
            {teams.map((team) => (
              <option key={team.id} value={team.id} className="bg-[#0d1117] text-white">
                {team.name}
              </option>
            ))}
          </select>
          <p className="mt-3 text-sm text-white/30">{selectedTeam ? `Parent invites will open directly into ${selectedTeam.name}.` : 'Choose one of your assigned teams.'}</p>
        </div>
      </section>

      <section className="mb-6 rounded-2xl border p-8" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <h2 className="mb-6 text-xl font-bold text-white">Player Details</h2>
        <div className="mb-6 flex gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1">
          {(['new', 'attach'] as PlayerMode[]).map((tab) => (
            <button
              type="button"
              key={tab}
              onClick={() => setMode(tab)}
              className="flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out"
              style={mode === tab ? { backgroundColor: primaryColour, color: contrastText } : { color: 'rgba(255,255,255,0.45)' }}
            >
              {tab === 'new' ? 'New Player' : 'Attach From Club Database'}
            </button>
          ))}
        </div>

        {mode === 'attach' ? (
          clubPlayers.length > 0 ? (
            <div>
              <label className={labelClass}>Club Player</label>
              <select value={existingPlayerId} onChange={(event) => setExistingPlayerId(event.target.value)} className={fieldClass} style={inputStyle}>
                {clubPlayers.map((player) => (
                  <option key={player.id} value={player.id} className="bg-[#0d1117] text-white">
                    {player.fullName}{player.teamId ? ' - already assigned' : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="rounded-[10px] border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-white/40">No players are in the club database yet. Add a new player first.</p>
          )
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={labelClass}>Player Name</label>
              <input value={playerName} onChange={(event) => setPlayerName(event.target.value)} className={fieldClass} style={inputStyle} placeholder="e.g. Sam Taylor" />
            </div>
            <div>
              <label className={labelClass}>Age Group</label>
              <select value={ageGroup} onChange={(event) => setAgeGroup(event.target.value)} className={fieldClass} style={inputStyle}>
                <option value="" className="bg-[#0d1117] text-white">Select age group</option>
                {ageGroups.map((group) => (
                  <option key={group} value={group} className="bg-[#0d1117] text-white">{group}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Date of Birth</label>
              <input type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} className={fieldClass} style={inputStyle} />
            </div>
          </div>
        )}
      </section>

      <section className="mb-6 rounded-2xl border p-8" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <h2 className="mb-6 text-xl font-bold text-white">Guardian Contacts</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2"><label className={labelClass}>Guardian 1 Name</label><input value={guardianOneName} onChange={(event) => setGuardianOneName(event.target.value)} className={fieldClass} style={inputStyle} placeholder="Primary contact name" /></div>
          <div><label className={labelClass}>Primary Contact Phone</label><input value={guardianOnePhone} onChange={(event) => setGuardianOnePhone(event.target.value)} className={fieldClass} style={inputStyle} placeholder="+44 7700 000000" /></div>
          <div><label className={labelClass}>Primary Contact Email</label><input type="email" value={guardianOneEmail} onChange={(event) => setGuardianOneEmail(event.target.value)} className={fieldClass} style={inputStyle} placeholder="parent@example.com" /></div>
          <div className="md:col-span-2 pt-4"><label className={labelClass}>Guardian 2 Name</label><input value={guardianTwoName} onChange={(event) => setGuardianTwoName(event.target.value)} className={fieldClass} style={inputStyle} placeholder="Secondary contact name" /></div>
          <div><label className={labelClass}>Secondary Contact Phone</label><input value={guardianTwoPhone} onChange={(event) => setGuardianTwoPhone(event.target.value)} className={fieldClass} style={inputStyle} placeholder="+44 7700 000000" /></div>
          <div><label className={labelClass}>Secondary Contact Email</label><input type="email" value={guardianTwoEmail} onChange={(event) => setGuardianTwoEmail(event.target.value)} className={fieldClass} style={inputStyle} placeholder="second-parent@example.com" /></div>
        </div>
      </section>

      {error ? <p className="mb-5 rounded-[10px] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</p> : null}

      <button type="submit" disabled={loading || teams.length === 0} className="rounded-full px-8 py-4 font-semibold transition-all duration-300 ease-out hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${primaryColour}, ${darkerPrimary})`, color: contrastText, boxShadow: `0 4px 20px ${primaryColour}59` }}>
        {loading ? 'Saving Player...' : 'Save Player + Generate Parent Link'}
      </button>
    </form>
  );
}

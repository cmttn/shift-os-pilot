'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { contrastText as getContrastText } from '@/lib/utils/contrastText';

type PlayerMode = 'invite' | 'new' | 'attach';

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
  inviteToken: string | null;
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

interface InviteResult {
  playerId: string;
  playerFirstName: string;
  teamName: string;
  inviteUrl: string;
  message: string;
}

const ageGroups = ['U6', 'U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15', 'U16', 'U17', 'U18', 'Open Age', 'Veterans'];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const [mode, setMode] = useState<PlayerMode>('invite');
  const [teamId, setTeamId] = useState(firstTeamId);
  const [existingPlayerId, setExistingPlayerId] = useState(firstPlayerId);
  const [playerName, setPlayerName] = useState('');
  const [ageGroup, setAgeGroup] = useState(teams[0]?.ageGroup ?? '');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [faFanNumber, setFaFanNumber] = useState('');
  const [guardianOneName, setGuardianOneName] = useState('');
  const [guardianOnePhone, setGuardianOnePhone] = useState('');
  const [guardianOneEmail, setGuardianOneEmail] = useState('');
  const [guardianTwoName, setGuardianTwoName] = useState('');
  const [guardianTwoPhone, setGuardianTwoPhone] = useState('');
  const [guardianTwoEmail, setGuardianTwoEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedTeam = useMemo(() => teams.find((team) => team.id === teamId), [teamId, teams]);

  const validate = (): string | null => {
    if (!teamId) return 'Choose a team first.';
    if (mode === 'attach' && !existingPlayerId) return 'Choose a player from the club database.';
    if (mode === 'invite' && !playerName.trim()) return 'Enter the player first name to generate an invite.';
    if (mode === 'new') {
      if (!playerName.trim()) return 'Player name is required.';
      if (!ageGroup) return 'Age group is required.';
    }
    if (guardianOneEmail.trim() && !emailPattern.test(guardianOneEmail.trim())) return 'Guardian 1 email must be valid.';
    if (guardianTwoEmail.trim() && !emailPattern.test(guardianTwoEmail.trim())) return 'Guardian 2 email must be valid.';
    return null;
  };

  const getInviteUrl = (token: string): string => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || window.location.origin;
    return `${siteUrl}/invite/player/${token}`;
  };

  const getNameParts = (fullName: string): { firstName: string; lastName: string } => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    return {
      firstName: parts[0] ?? 'Player',
      lastName: parts.slice(1).join(' ')
    };
  };

  const getInviteMessage = (playerFirstName: string, teamName: string, inviteUrl: string): string =>
    `We would like to invite ${playerFirstName} to join ${teamName} on SHIFT OS.\n\nFollow this link to get connected:\n${inviteUrl}`;

  const resetFormForNextPlayer = () => {
    setInviteResult(null);
    setMode('invite');
    setPlayerName('');
    setAgeGroup(teams[0]?.ageGroup ?? '');
    setDateOfBirth('');
    setFaFanNumber('');
    setGuardianOneName('');
    setGuardianOnePhone('');
    setGuardianOneEmail('');
    setGuardianTwoName('');
    setGuardianTwoPhone('');
    setGuardianTwoEmail('');
    setCopied(false);
    router.refresh();
  };

  const copyInvite = async () => {
    if (!inviteResult) return;
    await createClient()
      .from('players')
      .update({ invite_status: 'sent', invite_sent_at: new Date().toISOString() })
      .eq('id', inviteResult.playerId);
    await navigator.clipboard.writeText(inviteResult.message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const markInviteSent = async () => {
    if (!inviteResult) return;
    await createClient()
      .from('players')
      .update({ invite_status: 'sent', invite_sent_at: new Date().toISOString() })
      .eq('id', inviteResult.playerId);
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
      let inviteToken = crypto.randomUUID();
      let savedFirstName = getNameParts(playerName).firstName;

      if (mode === 'new' || mode === 'invite') {
        const names = getNameParts(playerName);
        savedFirstName = names.firstName;
        const { data, error: playerError } = await createClient()
          .from('players')
          .insert({
            team_id: teamId,
            first_name: names.firstName,
            last_name: names.lastName,
            age_group: mode === 'invite' ? selectedTeam?.ageGroup ?? null : ageGroup,
            dob: mode === 'invite' ? null : dateOfBirth || null,
            fa_fan_number: mode === 'new' && faFanNumber.trim() ? faFanNumber.trim() : null,
            fa_fan_added_by: mode === 'new' && faFanNumber.trim() ? 'coach' : null,
            is_active: true,
            invite_token: inviteToken,
            invite_status: 'pending'
          })
          .select('id')
          .single();

        if (playerError) throw playerError;
        const savedPlayer = data as SavedPlayer | null;
        if (!savedPlayer) throw new Error('Player could not be created.');
        playerId = savedPlayer.id;
      } else {
        const existingPlayer = clubPlayers.find((player) => player.id === playerId);
        const existingName = existingPlayer?.fullName ?? 'Player';
        savedFirstName = getNameParts(existingName).firstName;
        inviteToken = existingPlayer?.inviteToken ?? inviteToken;
        const { error: attachError } = await createClient()
          .from('players')
          .update({
            team_id: teamId,
            invite_token: inviteToken,
            invite_status: 'pending'
          })
          .eq('id', playerId)
          .is('parent_user_id', null);
        if (attachError) throw attachError;
      }

      const inviteUrl = getInviteUrl(inviteToken);
      setInviteResult({
        playerId,
        playerFirstName: savedFirstName,
        teamName: selectedTeam?.name ?? 'the team',
        inviteUrl,
        message: getInviteMessage(savedFirstName, selectedTeam?.name ?? 'the team', inviteUrl)
      });
      setLoading(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong while saving the player.');
      setLoading(false);
    }
  };

  const fieldClass = 'w-full rounded-[10px] border p-4 text-white outline-none transition-all duration-300 ease-out placeholder:text-white/20 focus:border-white/30';
  const labelClass = 'mb-2 block text-sm font-medium text-white/50';

  if (inviteResult) {
    return (
      <section className="max-w-[760px] rounded-2xl border p-8" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <p className="text-5xl font-black leading-none" style={{ color: primaryColour }}>✓</p>
        <h2 className="mt-5 text-3xl font-black text-white">{inviteResult.playerFirstName} has been added to your squad</h2>

        <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
          <p className="mb-3 text-sm text-white/50">Invite {inviteResult.playerFirstName}&apos;s parent</p>
          <code className="block truncate rounded-xl bg-white/[0.06] px-4 py-3 font-mono text-sm text-white">{inviteResult.inviteUrl}</code>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/45">{inviteResult.message}</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={copyInvite} className="rounded-full px-5 py-3 text-sm font-semibold transition-all duration-300 ease-out hover:scale-[1.02]" style={{ backgroundColor: primaryColour, color: contrastText }}>
              {copied ? 'Copied ✓' : 'Copy Invite Message'}
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(inviteResult.message)}`} onClick={() => { void markInviteSent(); }} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-5 py-3 text-center text-sm font-semibold text-white transition-all duration-300 ease-out hover:bg-white/[0.06]">
              Share via WhatsApp
            </a>
          </div>
        </div>

        <button type="button" onClick={resetFormForNextPlayer} className="mt-6 rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ease-out hover:bg-white/[0.06]">
          Add Another Player +
        </button>
      </section>
    );
  }

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
          {(['invite', 'new', 'attach'] as PlayerMode[]).map((tab) => (
            <button
              type="button"
              key={tab}
              onClick={() => setMode(tab)}
              className="flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out"
              style={mode === tab ? { backgroundColor: primaryColour, color: contrastText } : { color: 'rgba(255,255,255,0.45)' }}
            >
              {tab === 'invite' ? 'Quick Invite' : tab === 'new' ? 'Full Details' : 'Attach Existing'}
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
        ) : mode === 'invite' ? (
          <div>
            <label className={labelClass}>Player First Name</label>
            <input value={playerName} onChange={(event) => setPlayerName(event.target.value)} className={fieldClass} style={inputStyle} placeholder="e.g. Sam" />
            <p className="mt-3 text-sm text-white/35">This creates a secure parent invite. The parent can complete the remaining player details after joining.</p>
          </div>
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
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-white">FA Registration Number (FAN)</label>
            <p className="mb-2 mt-0.5 text-xs text-white/40">Optional — you can ask the parent to add this later</p>
            <input
              type="text"
              name="fa_fan_number"
              value={faFanNumber}
              onChange={(event) => setFaFanNumber(event.target.value)}
              className={fieldClass}
              style={inputStyle}
              placeholder="e.g. 67618567"
            />
            <p className="mt-1.5 text-xs text-white/30">Find this on the FA Whole Game System or ask the parent directly.</p>
          </div>
        </div>
      )}
      </section>

      {mode === 'new' ? <section className="mb-6 rounded-2xl border p-8" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <h2 className="mb-6 text-xl font-bold text-white">Guardian Contacts</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2"><label className={labelClass}>Guardian 1 Name</label><input value={guardianOneName} onChange={(event) => setGuardianOneName(event.target.value)} className={fieldClass} style={inputStyle} placeholder="Primary contact name" /></div>
          <div><label className={labelClass}>Primary Contact Phone</label><input value={guardianOnePhone} onChange={(event) => setGuardianOnePhone(event.target.value)} className={fieldClass} style={inputStyle} placeholder="+44 7700 000000" /></div>
          <div><label className={labelClass}>Primary Contact Email</label><input type="email" value={guardianOneEmail} onChange={(event) => setGuardianOneEmail(event.target.value)} className={fieldClass} style={inputStyle} placeholder="parent@example.com" /></div>
          <div className="md:col-span-2 pt-4"><label className={labelClass}>Guardian 2 Name</label><input value={guardianTwoName} onChange={(event) => setGuardianTwoName(event.target.value)} className={fieldClass} style={inputStyle} placeholder="Secondary contact name" /></div>
          <div><label className={labelClass}>Secondary Contact Phone</label><input value={guardianTwoPhone} onChange={(event) => setGuardianTwoPhone(event.target.value)} className={fieldClass} style={inputStyle} placeholder="+44 7700 000000" /></div>
          <div><label className={labelClass}>Secondary Contact Email</label><input type="email" value={guardianTwoEmail} onChange={(event) => setGuardianTwoEmail(event.target.value)} className={fieldClass} style={inputStyle} placeholder="second-parent@example.com" /></div>
        </div>
      </section> : null}

      {error ? <p className="mb-5 rounded-[10px] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</p> : null}

      <button type="submit" disabled={loading || teams.length === 0} className="rounded-full px-8 py-4 font-semibold transition-all duration-300 ease-out hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${primaryColour}, ${darkerPrimary})`, color: contrastText, boxShadow: `0 4px 20px ${primaryColour}59` }}>
        {loading ? 'Saving Player...' : mode === 'invite' ? 'Generate Parent Invite' : 'Save Player + Generate Parent Link'}
      </button>
    </form>
  );
}

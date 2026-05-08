'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type CoachMode = 'existing' | 'invite';
type Gender = 'boys' | 'girls' | 'mixed';

interface ExistingCoach {
  userId: string;
  fullName: string;
}

interface AddTeamFormProps {
  clubId: string;
  invitedBy: string;
  primaryColour: string;
  coaches: ExistingCoach[];
}

interface InsertedTeam {
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

export default function AddTeamForm({ clubId, invitedBy, primaryColour, coaches }: AddTeamFormProps) {
  const router = useRouter();
  const contrastText = getContrastText(primaryColour);
  const darkerPrimary = darkenHex(primaryColour, 15);
  const firstCoachId = coaches[0]?.userId ?? '';
  const inputStyle = { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' };

  const [teamName, setTeamName] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [gender, setGender] = useState<Gender>('boys');
  const [league, setLeague] = useState('');
  const [season, setSeason] = useState('2025-26');
  const [headMode, setHeadMode] = useState<CoachMode>('existing');
  const [headCoachId, setHeadCoachId] = useState(firstCoachId);
  const [headName, setHeadName] = useState('');
  const [headPhone, setHeadPhone] = useState('');
  const [headEmail, setHeadEmail] = useState('');
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMode, setAssistantMode] = useState<CoachMode>('existing');
  const [assistantCoachId, setAssistantCoachId] = useState(firstCoachId);
  const [assistantName, setAssistantName] = useState('');
  const [assistantPhone, setAssistantPhone] = useState('');
  const [assistantEmail, setAssistantEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateInvite = (name: string, email: string, label: string): string | null => {
    if (!name.trim()) return `${label} full name is required.`;
    if (!email.trim()) return `${label} email is required.`;
    if (!emailPattern.test(email.trim())) return `${label} email must be valid.`;
    return null;
  };

  const validate = (): string | null => {
    if (!teamName.trim()) return 'Team name is required.';
    if (!ageGroup) return 'Age group is required.';
    if (headMode === 'existing' && !headCoachId) return 'Choose an existing head coach or invite a new coach.';
    if (headMode === 'invite') {
      const inviteError = validateInvite(headName, headEmail, 'Head coach');
      if (inviteError) return inviteError;
    }
    if (assistantOpen && assistantMode === 'existing' && !assistantCoachId) return 'Choose an existing assistant coach or invite a new coach.';
    if (assistantOpen && assistantMode === 'invite') {
      const inviteError = validateInvite(assistantName, assistantEmail, 'Assistant coach');
      if (inviteError) return inviteError;
    }
    return null;
  };

  const assignExistingCoach = async (teamId: string, userId: string, isLead: boolean): Promise<void> => {
    const { error: coachError } = await createClient().from('team_coaches').insert({ team_id: teamId, user_id: userId, is_lead: isLead });
    if (coachError) throw coachError;
  };

  const createInvite = async (teamId: string, name: string, email: string, phone: string, isLead: boolean): Promise<string> => {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error: inviteError } = await createClient().from('pending_invites').insert({
      club_id: clubId,
      team_id: teamId,
      invited_by: invitedBy,
      invite_token: token,
      role: 'coach',
      invitee_name: name.trim(),
      invitee_email: email.trim(),
      invitee_phone: phone.trim() || null,
      is_lead: isLead,
      expires_at: expiresAt
    });
    if (inviteError) throw inviteError;
    return `${window.location.origin}/auth/signup?role=coach&invite=${token}&club=${clubId}&team=${teamId}`;
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
      const { data, error: teamError } = await createClient()
        .from('teams')
        .insert({
          club_id: clubId,
          name: teamName.trim(),
          age_group: ageGroup,
          gender,
          league: league.trim() || null,
          season: season.trim() || null,
          is_active: true
        })
        .select('id')
        .single();

      if (teamError) throw teamError;
      const team = data as InsertedTeam | null;
      if (!team) throw new Error('Team could not be created.');

      let inviteUrl = '';
      if (headMode === 'existing') await assignExistingCoach(team.id, headCoachId, true);
      if (headMode === 'invite') inviteUrl = await createInvite(team.id, headName, headEmail, headPhone, true);

      if (assistantOpen && assistantMode === 'existing') await assignExistingCoach(team.id, assistantCoachId, false);
      if (assistantOpen && assistantMode === 'invite') inviteUrl = inviteUrl || (await createInvite(team.id, assistantName, assistantEmail, assistantPhone, false));

      router.push(`/dashboard/club/teams/${team.id}/success${inviteUrl ? `?invite_url=${encodeURIComponent(inviteUrl)}` : ''}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong while creating the team.');
      setLoading(false);
    }
  };

  const fieldClass = 'w-full rounded-[10px] border p-4 text-white outline-none transition-all duration-300 ease-out placeholder:text-white/20 focus:border-white/30';
  const labelClass = 'mb-2 block text-sm font-medium text-white/50';

  const coachTabs = (
    mode: CoachMode,
    setMode: (mode: CoachMode) => void,
    coachId: string,
    setCoachId: (value: string) => void,
    name: string,
    setName: (value: string) => void,
    phone: string,
    setPhone: (value: string) => void,
    email: string,
    setEmail: (value: string) => void
  ) => (
    <div>
      <div className="mb-5 flex gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1">
        {(['existing', 'invite'] as CoachMode[]).map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => setMode(tab)}
            className="flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out"
            style={mode === tab ? { backgroundColor: primaryColour, color: contrastText } : { color: 'rgba(255,255,255,0.45)' }}
          >
            {tab === 'existing' ? 'Existing Coach' : 'Invite New Coach'}
          </button>
        ))}
      </div>
      {mode === 'existing' ? (
        coaches.length > 0 ? (
          <select value={coachId} onChange={(event) => setCoachId(event.target.value)} className={fieldClass} style={inputStyle}>
            {coaches.map((coach) => (
              <option key={coach.userId} value={coach.userId} className="bg-[#0d1117] text-white">
                {coach.fullName}
              </option>
            ))}
          </select>
        ) : (
          <p className="rounded-[10px] border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-white/40">No coaches yet. Switch to Invite New Coach.</p>
        )
      ) : (
        <div className="space-y-4">
          <label className={labelClass}>Coach Full Name</label>
          <input value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} style={inputStyle} placeholder="e.g. Alex Morgan" />
          <label className={labelClass}>Coach Phone</label>
          <input value={phone} onChange={(event) => setPhone(event.target.value)} className={fieldClass} style={inputStyle} placeholder="+44 7700 000000" />
          <label className={labelClass}>Coach Email</label>
          <input value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass} style={inputStyle} placeholder="coach@example.com" type="email" />
        </div>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-[680px]">
      <section className="mb-6 rounded-2xl border p-8" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <h2 className="mb-6 text-xl font-bold text-white">Team Details</h2>
        <div className="space-y-5">
          <div>
            <label className={labelClass}>Team Name</label>
            <input value={teamName} onChange={(event) => setTeamName(event.target.value)} className={fieldClass} style={inputStyle} placeholder="e.g. MSC Under 8s Reds" />
          </div>
          <div>
            <label className={labelClass}>Age Group</label>
            <select value={ageGroup} onChange={(event) => setAgeGroup(event.target.value)} className={fieldClass} style={inputStyle}>
              <option value="" className="bg-[#0d1117] text-white">Select age group</option>
              {ageGroups.map((group) => <option key={group} value={group} className="bg-[#0d1117] text-white">{group}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Gender</label>
            <div className="grid grid-cols-3 gap-2">
              {(['boys', 'girls', 'mixed'] as Gender[]).map((option) => (
                <button type="button" key={option} onClick={() => setGender(option)} className="rounded-full border px-4 py-3 text-sm font-semibold capitalize transition-all duration-300 ease-out" style={gender === option ? { backgroundColor: primaryColour, borderColor: primaryColour, color: contrastText } : { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>{option}</button>
              ))}
            </div>
          </div>
          <div><label className={labelClass}>League</label><input value={league} onChange={(event) => setLeague(event.target.value)} className={fieldClass} style={inputStyle} placeholder="e.g. Manchester Junior Football League" /></div>
          <div><label className={labelClass}>Season</label><input value={season} onChange={(event) => setSeason(event.target.value)} className={fieldClass} style={inputStyle} placeholder="2025-26" /></div>
        </div>
      </section>

      <section className="mb-6 rounded-2xl border p-8" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <h2 className="mb-6 text-xl font-bold text-white">Head Coach</h2>
        {coachTabs(headMode, setHeadMode, headCoachId, setHeadCoachId, headName, setHeadName, headPhone, setHeadPhone, headEmail, setHeadEmail)}
      </section>

      <section className="mb-6 rounded-2xl border p-8" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <button type="button" onClick={() => setAssistantOpen((current) => !current)} className="text-left text-xl font-bold text-white transition-all duration-300 ease-out hover:text-white/75">
          {assistantOpen ? 'Assistant Coach' : '+ Add Assistant Coach'}
        </button>
        {assistantOpen ? <div className="mt-6">{coachTabs(assistantMode, setAssistantMode, assistantCoachId, setAssistantCoachId, assistantName, setAssistantName, assistantPhone, setAssistantPhone, assistantEmail, setAssistantEmail)}</div> : null}
      </section>

      {error ? <p className="mb-5 rounded-[10px] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</p> : null}

      <button type="submit" disabled={loading} className="rounded-full px-8 py-4 font-semibold transition-all duration-300 ease-out hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${primaryColour}, ${darkerPrimary})`, color: contrastText, boxShadow: `0 4px 20px ${primaryColour}59` }}>
        {loading ? 'Creating Team...' : 'Create Team →'}
      </button>
    </form>
  );
}

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { contrastText } from '@/lib/utils/contrastText';

interface ClubBrandingSettingsProps {
  clubId: string;
  allowTeamColours: boolean;
  allowTeamBadges: boolean;
  primaryColour: string;
}

function ToggleRow({
  checked,
  onChange,
  title,
  helper
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  helper: string;
}) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left">
      <span>
        <span className="block text-sm font-semibold text-white">{title}</span>
        <span className="mt-1 block text-xs text-white/40">{helper}</span>
      </span>
      <span className={`relative h-7 w-12 rounded-full transition-all duration-300 ease-out ${checked ? 'bg-emerald-500' : 'bg-white/[0.12]'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all duration-300 ease-out ${checked ? 'left-6' : 'left-1'}`} />
      </span>
    </button>
  );
}

export default function ClubBrandingSettings({ clubId, allowTeamColours, allowTeamBadges, primaryColour }: ClubBrandingSettingsProps) {
  const [teamColours, setTeamColours] = useState(allowTeamColours);
  const [teamBadges, setTeamBadges] = useState(allowTeamBadges);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const textColour = contrastText(primaryColour);

  async function saveBrandingControls() {
    setSaving(true);
    setMessage('');
    setError('');

    const { error: updateError } = await createClient()
      .from('clubs')
      .update({
        allow_team_colours: teamColours,
        allow_team_badges: teamBadges
      })
      .eq('id', clubId);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage('Team branding controls saved');
    window.setTimeout(() => setMessage(''), 3000);
  }

  return (
    <section className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <h2 className="text-xl font-bold">Team Branding</h2>
      <p className="mt-2 text-sm text-white/40">Control whether linked teams can keep their own colours or badge.</p>
      <div className="mt-5 space-y-3">
        <ToggleRow
          checked={teamColours}
          onChange={setTeamColours}
          title="Allow teams to use their own colour scheme"
          helper="When off, all teams display club colours"
        />
        <ToggleRow
          checked={teamBadges}
          onChange={setTeamBadges}
          title="Allow teams to use their own badge"
          helper="When off, all teams display the club badge"
        />
      </div>
      <button
        type="button"
        onClick={saveBrandingControls}
        disabled={saving}
        className="mt-5 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-300 ease-out disabled:opacity-50"
        style={{ backgroundColor: primaryColour, color: textColour }}
      >
        {saving ? 'Saving...' : 'Save Team Branding'}
      </button>
      {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}
    </section>
  );
}

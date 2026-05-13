'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { contrastText } from '@/lib/utils/contrastText';

interface CoachTeamBrandingSettingsProps {
  teamId: string;
  teamName: string;
  clubName: string | null;
  clubBadgeUrl: string | null;
  clubPrimaryColour: string;
  clubSecondaryColour: string;
  teamPrimaryColour: string | null;
  teamSecondaryColour: string | null;
  teamBadgeUrl: string | null;
  allowTeamColours: boolean;
  allowTeamBadges: boolean;
  clubImportToken: string | null;
  isClubManaged: boolean;
  primaryColour: string;
}

function Swatch({ colour, label }: { colour: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-white/45">
      <span className="h-4 w-4 rounded-full border border-white/20" style={{ backgroundColor: colour }} />
      {label}
    </span>
  );
}

export default function CoachTeamBrandingSettings({
  teamId,
  teamName,
  clubName,
  clubBadgeUrl,
  clubPrimaryColour,
  clubSecondaryColour,
  teamPrimaryColour,
  teamSecondaryColour,
  teamBadgeUrl,
  allowTeamColours,
  allowTeamBadges,
  clubImportToken,
  isClubManaged,
  primaryColour
}: CoachTeamBrandingSettingsProps) {
  const [primary, setPrimary] = useState(teamPrimaryColour ?? clubPrimaryColour);
  const [secondary, setSecondary] = useState(teamSecondaryColour ?? clubSecondaryColour);
  const [badgeUrl, setBadgeUrl] = useState(teamBadgeUrl ?? '');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const textColour = contrastText(primaryColour);
  const importCode = clubImportToken ?? '------';

  async function copyCode() {
    await navigator.clipboard.writeText(importCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function saveColours() {
    setSaving(true);
    setMessage('');
    setError('');

    const { error: updateError } = await createClient()
      .from('teams')
      .update({
        primary_colour: primary,
        secondary_colour: secondary
      })
      .eq('id', teamId);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage('Team colours saved');
    window.setTimeout(() => setMessage(''), 3000);
  }

  async function saveBadge() {
    setSaving(true);
    setMessage('');
    setError('');

    const { error: updateError } = await createClient()
      .from('teams')
      .update({ badge_url: badgeUrl.trim() || null })
      .eq('id', teamId);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage('Team badge saved');
    window.setTimeout(() => setMessage(''), 3000);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <h2 className="text-xl font-bold">{isClubManaged ? 'Club Link' : 'Join a Club'}</h2>
        {isClubManaged ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
            {clubBadgeUrl ? <img src={clubBadgeUrl} alt="" className="h-12 w-12 rounded-full object-cover" /> : <span className="h-12 w-12 rounded-full" style={{ backgroundColor: clubPrimaryColour }} />}
            <div>
              <p className="text-sm font-semibold text-white">Your team is linked to {clubName ?? 'your club'}</p>
              <p className="mt-1 text-xs text-white/35">{teamName} uses the club branding rules below.</p>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-white/40">Share this code with your club admin to link your team to their club.</p>
            <div className="mt-5 rounded-xl bg-white/[0.06] px-6 py-4 text-center">
              <p className="font-mono text-2xl font-black tracking-[0.3em] text-white">{importCode}</p>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={copyCode} className="rounded-full px-5 py-3 text-sm font-semibold" style={{ backgroundColor: primaryColour, color: textColour }}>
                {copied ? 'Copied' : 'Copy Code'}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Here's my team code to link to your club on SHIFT OS: ${importCode}`)}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/10 px-5 py-3 text-center text-sm font-semibold text-white/60"
              >
                Share via WhatsApp
              </a>
            </div>
          </>
        )}
      </section>

      <section className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <h2 className="text-xl font-bold">Team Appearance</h2>
        {allowTeamColours ? (
          <div className="mt-5 space-y-4">
            <p className="text-xs text-white/40">Your club allows each team to set their own colours.</p>
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-wider text-white/40">Primary Colour</span>
              <span className="flex gap-3">
                <input type="color" value={primary} onChange={(event) => setPrimary(event.target.value)} className="h-12 w-16 rounded-xl border border-white/[0.08] bg-white/[0.04]" />
                <input value={primary} onChange={(event) => setPrimary(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none" />
              </span>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-wider text-white/40">Secondary Colour</span>
              <span className="flex gap-3">
                <input type="color" value={secondary} onChange={(event) => setSecondary(event.target.value)} className="h-12 w-16 rounded-xl border border-white/[0.08] bg-white/[0.04]" />
                <input value={secondary} onChange={(event) => setSecondary(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none" />
              </span>
            </label>
            <button type="button" onClick={saveColours} disabled={saving} className="rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: primaryColour, color: textColour }}>
              Save Colours
            </button>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
            <p className="text-sm text-white/50">Colour scheme is set by your club admin.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Swatch colour={clubPrimaryColour} label="Primary" />
              <Swatch colour={clubSecondaryColour} label="Secondary" />
            </div>
          </div>
        )}

        <div className="my-6 h-px bg-white/[0.06]" />

        {allowTeamBadges ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-white">Team Badge</p>
            <p className="text-xs text-white/40">Paste the uploaded badge URL for this team.</p>
            <input value={badgeUrl} onChange={(event) => setBadgeUrl(event.target.value)} placeholder="https://..." className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20" />
            <button type="button" onClick={saveBadge} disabled={saving} className="rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: primaryColour, color: textColour }}>
              Save Badge
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
            <p className="text-sm text-white/50">Badge is set by your club admin.</p>
            {clubBadgeUrl ? <img src={clubBadgeUrl} alt="" className="mt-3 h-16 w-16 rounded-full object-cover" /> : null}
          </div>
        )}

        {message ? <p className="mt-4 text-sm text-emerald-400">{message}</p> : null}
        {error ? <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}
      </section>
    </div>
  );
}

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
  const [joinTab, setJoinTab] = useState<'club-code' | 'team-code'>('club-code');
  const [clubCode, setClubCode] = useState('');
  const [clubPreview, setClubPreview] = useState<{ id: string; name: string; badge_url: string | null; plan_tier: string | null; team_count: number; coach_count: number } | null>(null);
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

  async function findClub() {
    setSaving(true);
    setError('');
    setMessage('');
    setClubPreview(null);
    const response = await fetch(`/api/clubs/join-request?code=${encodeURIComponent(clubCode.trim().toUpperCase())}`);
    const payload = await response.json() as { club?: { id: string; name: string; badge_url: string | null; plan_tier: string | null }; team_count?: number; coach_count?: number; error?: string };
    setSaving(false);
    if (!response.ok || !payload.club) {
      setError(payload.error ?? 'No club found with that code.');
      return;
    }
    setClubPreview({
      ...payload.club,
      team_count: payload.team_count ?? 0,
      coach_count: payload.coach_count ?? 0
    });
  }

  async function requestToJoinClub() {
    if (!clubPreview) return;
    setSaving(true);
    setError('');
    setMessage('');
    const response = await fetch('/api/clubs/join-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', coach_join_code: clubCode.trim().toUpperCase(), team_id: teamId })
    });
    const payload = await response.json() as { club_name?: string; error?: string };
    setSaving(false);
    if (!response.ok) {
      setError(payload.error ?? 'Unable to send request.');
      return;
    }
    setMessage(`Request sent. ${payload.club_name ?? clubPreview.name} will review it shortly.`);
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
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-white/[0.03] p-1">
              <button
                type="button"
                onClick={() => setJoinTab('club-code')}
                className="rounded-lg px-3 py-2 text-sm font-semibold transition"
                style={joinTab === 'club-code' ? { backgroundColor: primaryColour, color: textColour } : { color: 'rgba(255,255,255,0.45)' }}
              >
                Enter Club Code
              </button>
              <button
                type="button"
                onClick={() => setJoinTab('team-code')}
                className="rounded-lg px-3 py-2 text-sm font-semibold transition"
                style={joinTab === 'team-code' ? { backgroundColor: primaryColour, color: textColour } : { color: 'rgba(255,255,255,0.45)' }}
              >
                Share My Team Code
              </button>
            </div>

            {joinTab === 'club-code' ? (
              <div className="mt-5 space-y-4">
                <p className="text-sm text-white/40">Enter your club&apos;s coach join code to request approval.</p>
                <div className="flex gap-2">
                  <input
                    value={clubCode}
                    onChange={(event) => setClubCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                    className="min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-center font-mono text-lg tracking-[0.18em] text-white outline-none"
                    placeholder="MSC001"
                  />
                  <button type="button" onClick={findClub} disabled={clubCode.length < 6 || saving} className="rounded-xl px-4 text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: primaryColour, color: textColour }}>
                    Find Club
                  </button>
                </div>
                {clubPreview ? (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                    <div className="flex items-center gap-3">
                      {clubPreview.badge_url ? <img src={clubPreview.badge_url} alt="" className="h-12 w-12 rounded-full object-cover" /> : <span className="h-12 w-12 rounded-full" style={{ backgroundColor: primaryColour }} />}
                      <div>
                        <p className="font-semibold text-white">{clubPreview.name}</p>
                        <p className="mt-1 text-xs text-white/35">{clubPreview.plan_tier ?? 'free'} plan / {clubPreview.team_count} teams / {clubPreview.coach_count} coaches</p>
                      </div>
                    </div>
                    <button type="button" onClick={requestToJoinClub} disabled={saving} className="mt-4 w-full rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: primaryColour, color: textColour }}>
                      Request to Join {clubPreview.name}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <p className="mt-5 text-sm text-white/40">Share this code with your club admin to link your team to their club.</p>
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

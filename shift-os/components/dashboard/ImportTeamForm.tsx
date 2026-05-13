'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { contrastText } from '@/lib/utils/contrastText';

interface ImportTeamFormProps {
  clubId: string;
  clubName: string;
  clubBadgeUrl: string | null;
  clubPrimaryColour: string;
  clubSecondaryColour: string;
  allowTeamColours: boolean;
  allowTeamBadges: boolean;
}

interface TeamPreview {
  id: string;
  name: string;
  age_group: string | null;
  gender: string | null;
  season: string | null;
  club_id: string | null;
  primary_colour: string | null;
  secondary_colour: string | null;
  badge_url: string | null;
  coach_name: string | null;
  player_count: number;
}

interface PreviewResponse {
  team: TeamPreview;
}

interface ImportResponse {
  success: boolean;
  team_name?: string;
  club_name?: string;
  error?: string;
}

function isPreviewResponse(value: unknown): value is PreviewResponse {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return Boolean(record.team && typeof record.team === 'object');
}

function titleCase(value: string | null): string {
  if (!value) return 'Not set';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function ImportTeamForm({
  clubId,
  clubName,
  clubBadgeUrl,
  clubPrimaryColour,
  clubSecondaryColour,
  allowTeamColours,
  allowTeamBadges
}: ImportTeamFormProps) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState<TeamPreview | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const primaryText = contrastText(clubPrimaryColour);

  async function findTeam() {
    setLoading(true);
    setError('');
    setMessage('');
    setPreview(null);

    const response = await fetch(`/api/clubs/import-team?token=${encodeURIComponent(code.trim().toUpperCase())}&clubId=${encodeURIComponent(clubId)}`);
    const payload: unknown = await response.json();
    setLoading(false);

    if (!response.ok || !isPreviewResponse(payload)) {
      const record = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
      setError(typeof record.error === 'string' ? record.error : 'No team found with that code. Check with your coach.');
      return;
    }

    setPreview(payload.team);
  }

  async function confirmImport() {
    if (!preview) return;
    setImporting(true);
    setError('');
    setMessage('');

    const response = await fetch('/api/clubs/import-team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ club_import_token: code.trim().toUpperCase(), club_id: clubId })
    });
    const payload = await response.json() as ImportResponse;
    setImporting(false);

    if (!response.ok || !payload.success) {
      setError(payload.error ?? 'Unable to import that team.');
      return;
    }

    setMessage(`${payload.team_name ?? preview.name} has been linked to ${payload.club_name ?? clubName}.`);
    router.refresh();
    window.setTimeout(() => router.push('/dashboard/club/teams'), 1200);
  }

  return (
    <main className="min-h-screen px-5 pb-28 pt-10 text-white" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[480px]">
        <Link href="/dashboard/club/teams" className="text-sm text-white/40 transition hover:text-white">Back to Teams</Link>
        <h1 className="mt-6 text-3xl font-black">Import Existing Team</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/40">Link an independent coach&apos;s team to {clubName}.</p>

        <section className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-wider text-white/40">Team Code</span>
            <input
              value={code}
              onChange={(event) => {
                setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8));
                setPreview(null);
                setError('');
                setMessage('');
              }}
              placeholder="TITANS7"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 py-4 text-center font-mono text-xl tracking-[0.25em] text-white outline-none transition focus:border-white/20 placeholder:text-white/20"
            />
          </label>
          <button
            type="button"
            onClick={findTeam}
            disabled={code.trim().length < 6 || loading}
            className="mt-4 w-full rounded-full px-5 py-3 text-sm font-bold transition-all duration-300 ease-out disabled:opacity-45"
            style={{ backgroundColor: clubPrimaryColour, color: primaryText }}
          >
            {loading ? 'Finding...' : 'Find Team'}
          </button>
        </section>

        {error ? <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}
        {message ? <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">{message}</p> : null}

        {preview ? (
          <section className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
            {preview.club_id ? (
              <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-100">This team is already linked to another club.</p>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black">{preview.name}</h2>
                    <p className="mt-1 text-sm text-white/35">Coach: {preview.coach_name ?? 'Not assigned'}</p>
                  </div>
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.05] px-3 py-1 text-xs text-white/50">{titleCase(preview.gender)}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/45">
                  <p>Age group: {preview.age_group ?? 'Not set'}</p>
                  <p>Players: {preview.player_count}</p>
                  <p className="col-span-2">Season: {preview.season ?? 'Not set'}</p>
                </div>

                <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-sm font-semibold text-white">Branding changes</p>
                  {!allowTeamColours ? (
                    <div className="mt-3 text-sm text-white/45">
                      <p>Team colours will update to match {clubName}.</p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="h-8 w-8 rounded-full border border-white/15" style={{ backgroundColor: preview.primary_colour ?? '#3b82f6' }} />
                        <span className="text-white/25">to</span>
                        <span className="h-8 w-8 rounded-full border border-white/15" style={{ backgroundColor: clubPrimaryColour }} />
                        <span className="h-8 w-8 rounded-full border border-white/15" style={{ backgroundColor: clubSecondaryColour }} />
                      </div>
                    </div>
                  ) : <p className="mt-3 text-sm text-white/45">This club allows team colours, so existing team colours can stay.</p>}

                  {!allowTeamBadges ? (
                    <div className="mt-4 text-sm text-white/45">
                      <p>Team badge will update to {clubName}&apos;s badge.</p>
                      <div className="mt-3 flex items-center gap-2">
                        {preview.badge_url ? <img src={preview.badge_url} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="h-10 w-10 rounded-full border border-white/15 bg-white/[0.05]" />}
                        <span className="text-white/25">to</span>
                        {clubBadgeUrl ? <img src={clubBadgeUrl} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="h-10 w-10 rounded-full border border-white/15" style={{ backgroundColor: clubPrimaryColour }} />}
                      </div>
                    </div>
                  ) : <p className="mt-4 text-sm text-white/45">This club allows team badges, so the existing team badge can stay.</p>}
                </div>

                <button
                  type="button"
                  onClick={confirmImport}
                  disabled={importing}
                  className="mt-5 w-full rounded-full px-5 py-3 text-sm font-bold transition-all duration-300 ease-out disabled:opacity-45"
                  style={{ backgroundColor: clubPrimaryColour, color: primaryText }}
                >
                  {importing ? 'Importing...' : 'Confirm Import'}
                </button>
              </>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}

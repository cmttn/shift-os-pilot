'use client';

import { MouseEvent, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PendingCoachInvite } from '@/lib/dashboard/getClubData';

interface CoachInviteDrawerProps {
  clubId: string;
  teamId: string;
  primaryColour: string;
  initialInvite: PendingCoachInvite;
}

interface PendingInviteRow {
  invite_token: string;
  expires_at: string | null;
}

function formatExpiry(value: string | null): string {
  if (!value) return 'No expiry set';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return `Expires ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

export default function CoachInviteDrawer({ clubId, teamId, primaryColour, initialInvite }: CoachInviteDrawerProps) {
  const [open, setOpen] = useState(false);
  const [invite, setInvite] = useState<PendingInviteRow>(initialInvite);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const inviteUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/auth/signup?role=coach&invite=${invite.invite_token}&club=${clubId}&team=${teamId}`;
  }, [clubId, invite.invite_token, teamId]);

  async function openDrawer(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setError('');
    const { data, error: queryError } = await createClient()
      .from('pending_invites')
      .select('invite_token,expires_at')
      .eq('team_id', teamId)
      .eq('role', 'coach')
      .eq('status', 'pending')
      .maybeSingle<PendingInviteRow>();

    if (queryError) setError(queryError.message);
    if (data) setInvite(data);
    setOpen(true);
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function regenerate() {
    setError('');
    const nextInvite = {
      invite_token: crypto.randomUUID(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    const { error: updateError } = await createClient()
      .from('pending_invites')
      .update(nextInvite)
      .eq('team_id', teamId)
      .eq('role', 'coach')
      .eq('status', 'pending');

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setInvite(nextInvite);
  }

  return (
    <>
      <button
        type="button"
        onClick={openDrawer}
        className="mt-3 rounded-full border px-4 py-2 text-xs font-semibold text-white transition-all duration-300 ease-out hover:bg-white/[0.06]"
        style={{ borderColor: `${primaryColour}66` }}
      >
        Resend Invite
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <section
            className="fixed inset-x-0 bottom-0 rounded-t-[20px] border-t p-6 shadow-2xl transition-all duration-300 ease-out md:left-auto md:right-6 md:max-w-[520px] md:rounded-2xl md:border"
            style={{ backgroundColor: 'rgba(8,10,15,0.98)', borderColor: 'rgba(255,255,255,0.08)' }}
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" onClick={() => setOpen(false)} className="absolute right-5 top-4 text-2xl text-white/40 transition-all duration-300 ease-out hover:text-white">
              ×
            </button>
            <p className="text-xs uppercase tracking-[0.28em] text-white/25">Coach Invite</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Resend invite link</h2>
            <code className="mt-5 block overflow-x-auto rounded-[10px] border border-white/[0.08] bg-black/30 p-4 text-sm text-white/70">{inviteUrl}</code>
            <p className="mt-3 text-sm text-white/35">{formatExpiry(invite.expires_at)}</p>
            {error ? <p className="mt-3 text-sm text-red-200">{error}</p> : null}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={copyInvite} className="rounded-full px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ease-out" style={{ backgroundColor: primaryColour }}>
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button type="button" onClick={regenerate} className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ease-out hover:bg-white/[0.06]">
                Regenerate Link
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

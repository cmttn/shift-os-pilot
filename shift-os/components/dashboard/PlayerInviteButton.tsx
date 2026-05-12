'use client';

import { useState } from 'react';

interface PlayerInviteButtonProps {
  playerId: string;
  playerFirstName: string;
  teamName: string;
  inviteToken: string | null;
  parentLinked: boolean;
  primaryColour: string;
}

interface InviteResponse {
  invite_url: string;
  invite_message: string;
}

function isInviteResponse(value: unknown): value is InviteResponse {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.invite_url === 'string' && typeof record.invite_message === 'string';
}

function getErrorMessage(value: unknown): string {
  if (!value || typeof value !== 'object') return 'Invite could not be generated.';
  const error = (value as Record<string, unknown>).error;
  return typeof error === 'string' ? error : 'Invite could not be generated.';
}

export default function PlayerInviteButton({ playerId, playerFirstName, teamName, inviteToken, parentLinked, primaryColour }: PlayerInviteButtonProps) {
  const [token, setToken] = useState(inviteToken);
  const [inviteUrl, setInviteUrl] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function prepareInvite(): Promise<InviteResponse | null> {
    if (parentLinked || loading) return null;

    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/players/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      });
      const payload: unknown = await response.json();

      if (!response.ok || !isInviteResponse(payload)) {
        setError(getErrorMessage(payload));
        return null;
      }

      setInviteUrl(payload.invite_url);
      setInviteMessage(payload.invite_message);
      setToken(payload.invite_url.split('/').filter(Boolean).at(-1) ?? token);
      return payload;
    } catch {
      setError('Invite could not be generated.');
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function copyInviteLink() {
    const preparedInvite = inviteUrl && inviteMessage ? { invite_url: inviteUrl, invite_message: inviteMessage } : await prepareInvite();
    if (!preparedInvite) return;

    await navigator.clipboard.writeText(preparedInvite.invite_url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function shareViaWhatsApp() {
    const preparedInvite = inviteUrl && inviteMessage ? { invite_url: inviteUrl, invite_message: inviteMessage } : await prepareInvite();
    if (!preparedInvite) return;

    window.open(`https://wa.me/?text=${encodeURIComponent(preparedInvite.invite_message)}`, '_blank', 'noopener,noreferrer');
  }

  const label = parentLinked ? 'Parent linked' : copied ? 'Copied' : loading ? 'Preparing...' : token ? 'Copy Invite Link' : `Invite ${playerFirstName}'s parent`;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={copyInviteLink}
        disabled={parentLinked || loading}
        className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-300 ease-out disabled:cursor-default disabled:opacity-50"
        style={{ borderColor: parentLinked ? 'rgba(255,255,255,0.08)' : `${primaryColour}66`, color: parentLinked ? 'rgba(255,255,255,0.35)' : primaryColour }}
        aria-label={parentLinked ? `${playerFirstName} already has a linked parent` : `Copy invite link for ${playerFirstName} in ${teamName}`}
      >
        {label}
      </button>
      {!parentLinked ? (
        <button
          type="button"
          onClick={shareViaWhatsApp}
          disabled={loading}
          className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 transition-all duration-300 ease-out hover:bg-white/[0.06] disabled:cursor-default disabled:opacity-50"
          aria-label={`Share invite for ${playerFirstName} in ${teamName} by WhatsApp`}
        >
          WhatsApp
        </button>
      ) : null}
      {error ? <p className="basis-full text-xs text-red-200">{error}</p> : null}
    </div>
  );
}

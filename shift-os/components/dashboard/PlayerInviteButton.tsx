'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface PlayerInviteButtonProps {
  playerId: string;
  playerFirstName: string;
  teamName: string;
  inviteToken: string | null;
  parentLinked: boolean;
  primaryColour: string;
}

export default function PlayerInviteButton({ playerId, playerFirstName, teamName, inviteToken, parentLinked, primaryColour }: PlayerInviteButtonProps) {
  const [token, setToken] = useState(inviteToken);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  async function copyInviteLink() {
    if (parentLinked) return;
    setLoading(true);
    const nextToken = token ?? crypto.randomUUID();

    const { error } = await createClient()
      .from('players')
      .update({
        invite_token: nextToken,
        invite_status: 'sent',
        invite_sent_at: new Date().toISOString()
      })
      .eq('id', playerId);

    if (error) {
      setLoading(false);
      return;
    }
    setToken(nextToken);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || window.location.origin;
    const inviteUrl = `${siteUrl}/invite/player/${nextToken}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setLoading(false);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const label = parentLinked ? 'Parent linked' : copied ? 'Copied ✓' : loading ? 'Preparing...' : token ? 'Copy Invite Link' : `Invite ${playerFirstName}'s parent`;

  return (
    <button
      type="button"
      onClick={copyInviteLink}
      disabled={parentLinked || loading}
      className="mt-3 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-300 ease-out disabled:cursor-default disabled:opacity-50"
      style={{ borderColor: parentLinked ? 'rgba(255,255,255,0.08)' : `${primaryColour}66`, color: parentLinked ? 'rgba(255,255,255,0.35)' : primaryColour }}
      aria-label={parentLinked ? `${playerFirstName} already has a linked parent` : `Copy invite link for ${playerFirstName} in ${teamName}`}
    >
      {label}
    </button>
  );
}

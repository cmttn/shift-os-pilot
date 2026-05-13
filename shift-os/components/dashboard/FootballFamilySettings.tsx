'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { contrastText } from '@/lib/utils/contrastText';

export interface FamilySettingsPlayer {
  id: string;
  name: string;
  parents: Array<{
    id: string;
    name: string;
    detail: string;
  }>;
  members: Array<{
    id: string;
    name: string;
    relationship: string | null;
    status: string;
  }>;
  invites: Array<{
    id: string;
    inviteeName: string | null;
    relationship: string | null;
    status: string;
    inviteToken: string;
  }>;
  coParentInvites: Array<{
    id: string;
    inviteeName: string | null;
    status: string;
    inviteToken: string;
  }>;
}

interface FootballFamilySettingsProps {
  userId: string;
  players: FamilySettingsPlayer[];
  primaryColour: string;
}

export default function FootballFamilySettings({ userId, players, primaryColour }: FootballFamilySettingsProps) {
  const [activePlayerId, setActivePlayerId] = useState(players[0]?.id ?? '');
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [email, setEmail] = useState('');
  const [coParentName, setCoParentName] = useState('');
  const [coParentEmail, setCoParentEmail] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [coParentInviteUrl, setCoParentInviteUrl] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const textColour = contrastText(primaryColour);
  const activePlayer = players.find((player) => player.id === activePlayerId) ?? players[0] ?? null;

  async function sendInvite() {
    if (!activePlayer) return;
    setError('');
    setMessage('');
    const token = crypto.randomUUID();
    const { error: insertError } = await createClient().from('football_family_invites').insert({
      player_id: activePlayer.id,
      invited_by: userId,
      invite_token: token,
      invitee_name: name.trim() || null,
      invitee_email: email.trim() || null,
      relationship: relationship.trim() || null
    });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    const url = `${window.location.origin}/invite/family/${token}`;
    setInviteUrl(url);
    setMessage('Invite created. Copy it or share it below.');
  }

  async function sendCoParentInvite() {
    if (!activePlayer) return;
    setError('');
    setMessage('');
    const token = crypto.randomUUID();
    const { error: insertError } = await createClient().from('football_family_invites').insert({
      player_id: activePlayer.id,
      invited_by: userId,
      invite_token: token,
      invitee_name: coParentName.trim() || null,
      invitee_email: coParentEmail.trim() || null,
      relationship: 'Co-parent'
    });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    const url = `${window.location.origin}/invite/coparent/${token}`;
    setCoParentInviteUrl(url);
    setMessage('Co-parent invite created. Copy it or share it below.');
  }

  async function removeMember(memberId: string) {
    const { error: updateError } = await createClient()
      .from('football_family')
      .update({ status: 'revoked' })
      .eq('id', memberId);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setMessage('Family member removed.');
  }

  async function copyInvite() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setMessage('Invite copied.');
  }

  async function copyCoParentInvite() {
    if (!coParentInviteUrl) return;
    await navigator.clipboard.writeText(coParentInviteUrl);
    setMessage('Co-parent invite copied.');
  }

  if (players.length === 0) return null;

  const shareText = activePlayer && inviteUrl ? `Join ${activePlayer.name}'s Football Family on SHIFT OS!\n${inviteUrl}` : '';
  const coParentShareText = activePlayer && coParentInviteUrl ? `You have been invited as a parent for ${activePlayer.name} on SHIFT OS.\n${coParentInviteUrl}` : '';

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
      <h2 className="text-xl font-bold">Football Family</h2>
      <p className="mt-2 text-sm text-white/40">Invite trusted family members to view a player&apos;s updates without edit access.</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {players.map((player) => (
          <button key={player.id} type="button" onClick={() => setActivePlayerId(player.id)} className="rounded-full px-4 py-2 text-sm font-semibold" style={player.id === activePlayer?.id ? { backgroundColor: primaryColour, color: textColour } : { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
            {player.name}
          </button>
        ))}
      </div>

      {activePlayer ? (
        <div className="mt-5 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-white/30">Connected parents</p>
            <div className="mt-3 space-y-2">
              {activePlayer.parents.map((parent) => (
                <div key={parent.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="text-sm font-semibold text-white">{parent.name}</p>
                  <p className="mt-1 text-xs text-white/35">{parent.detail} / Full access</p>
                </div>
              ))}
              {activePlayer.coParentInvites.map((invite) => (
                <div key={invite.id} className="rounded-xl border border-amber-400/10 bg-amber-400/[0.04] p-3">
                  <p className="text-sm font-semibold text-white">{invite.inviteeName ?? 'Pending co-parent'}</p>
                  <p className="mt-1 text-xs text-amber-200/60">Co-parent / {invite.status}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-sm font-semibold text-white">Invite Co-Parent</p>
            <p className="mt-1 text-xs text-white/35">Co-parents get full access for this player.</p>
            <div className="mt-3 space-y-3">
              <input value={coParentName} onChange={(event) => setCoParentName(event.target.value)} placeholder="Their name" className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25" />
              <input value={coParentEmail} onChange={(event) => setCoParentEmail(event.target.value)} placeholder="Email optional" className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25" />
              <button type="button" onClick={sendCoParentInvite} className="w-full rounded-full px-5 py-3 text-sm font-semibold" style={{ backgroundColor: primaryColour, color: textColour }}>Create Co-Parent Invite</button>
            </div>
            {coParentInviteUrl ? (
              <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                <code className="block truncate text-xs text-white/65">{coParentInviteUrl}</code>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <button type="button" onClick={copyCoParentInvite} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">Copy Link</button>
                  <a href={`https://wa.me/?text=${encodeURIComponent(coParentShareText)}`} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-4 py-2 text-center text-sm font-semibold text-white/55">Share WhatsApp</a>
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-white/30">{activePlayer.name}&apos;s Football Family</p>
            <div className="mt-3 space-y-2">
              {[...activePlayer.members, ...activePlayer.invites.map((invite) => ({ id: invite.id, name: invite.inviteeName ?? 'Pending invite', relationship: invite.relationship, status: invite.status }))].length === 0 ? (
                <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-white/35">No family members invited yet.</p>
              ) : null}
              {activePlayer.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{member.name}</p>
                    <p className="mt-1 text-xs text-white/35">{member.relationship ?? 'Family'} / {member.status}</p>
                  </div>
                  <button type="button" onClick={() => void removeMember(member.id)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/45">Remove</button>
                </div>
              ))}
              {activePlayer.invites.map((invite) => (
                <div key={invite.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="text-sm font-semibold text-white">{invite.inviteeName ?? 'Pending invite'}</p>
                  <p className="mt-1 text-xs text-white/35">{invite.relationship ?? 'Family'} / {invite.status}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-sm font-semibold text-white">Invite Family Member</p>
            <div className="mt-3 space-y-3">
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Their name" className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25" />
              <input value={relationship} onChange={(event) => setRelationship(event.target.value)} placeholder="Relationship, e.g. Grandad" className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25" />
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email optional" className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25" />
              <button type="button" onClick={sendInvite} className="w-full rounded-full px-5 py-3 text-sm font-semibold" style={{ backgroundColor: primaryColour, color: textColour }}>Send Invite</button>
            </div>
            {inviteUrl ? (
              <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                <code className="block truncate text-xs text-white/65">{inviteUrl}</code>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <button type="button" onClick={copyInvite} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">Copy Link</button>
                  <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-4 py-2 text-center text-sm font-semibold text-white/55">Share WhatsApp</a>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {message ? <p className="mt-4 text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}
    </section>
  );
}

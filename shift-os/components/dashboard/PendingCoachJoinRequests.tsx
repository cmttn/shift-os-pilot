'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { contrastText } from '@/lib/utils/contrastText';

export interface PendingCoachJoinRequest {
  id: string;
  coachName: string;
  coachEmail: string;
  teamName: string | null;
  ageGroup: string | null;
  playerCount: number;
}

interface PendingCoachJoinRequestsProps {
  requests: PendingCoachJoinRequest[];
  primaryColour: string;
}

export default function PendingCoachJoinRequests({ requests, primaryColour }: PendingCoachJoinRequestsProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const textColour = contrastText(primaryColour);

  async function review(requestId: string, action: 'approve' | 'reject') {
    setBusyId(requestId);
    setError('');
    const response = await fetch('/api/clubs/join-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, request_id: requestId })
    });
    const payload = await response.json() as { error?: string };
    setBusyId(null);
    if (!response.ok) {
      setError(payload.error ?? 'Unable to update that request.');
      return;
    }
    router.refresh();
  }

  if (requests.length === 0) return null;

  return (
    <section className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-white">Pending Coach Requests</h2>
        <span className="rounded-full px-3 py-1 text-xs font-black" style={{ backgroundColor: primaryColour, color: textColour }}>{requests.length}</span>
      </div>
      {error ? <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}
      <div className="mt-4 space-y-3">
        {requests.map((request) => (
          <article key={request.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">{request.coachName}</p>
                <p className="mt-1 text-xs text-white/35">{request.coachEmail}</p>
                <p className="mt-2 text-sm text-white/55">{request.teamName ?? 'No team selected'} {request.ageGroup ? ` / ${request.ageGroup}` : ''}</p>
                <p className="mt-1 text-xs text-white/30">{request.playerCount} players</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void review(request.id, 'approve')}
                  disabled={busyId === request.id}
                  className="rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  style={{ backgroundColor: primaryColour, color: textColour }}
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => void review(request.id, 'reject')}
                  disabled={busyId === request.id}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/55 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

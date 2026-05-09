'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { CoachTeamRecord, PendingJoinRequestRecord } from '@/lib/dashboard/getCoachDashboardData';

interface PendingJoinRequestsProps {
  primaryColour: string;
  requests: PendingJoinRequestRecord[];
  teams: CoachTeamRecord[];
}

export default function PendingJoinRequests({ primaryColour, requests, teams }: PendingJoinRequestsProps) {
  const [visibleRequests, setVisibleRequests] = useState(requests);
  const [message, setMessage] = useState('');

  async function reviewRequest(request: PendingJoinRequestRecord, status: 'accepted' | 'declined') {
    const supabase = createClient();
    setMessage('');

    if (status === 'accepted') {
      const { data: teamData, error: teamError } = await supabase.from('teams').select('club_id,age_group').eq('id', request.team_id).maybeSingle<{ club_id: string | null; age_group: string | null }>();
      if (teamError) {
        setMessage(teamError.message);
        return;
      }
      const isEmail = request.parent_contact.includes('@');
      const { error: playerError } = await supabase.from('players').insert({
        club_id: teamData?.club_id ?? null,
        team_id: request.team_id,
        full_name: request.full_name,
        age_group: teamData?.age_group ?? null,
        date_of_birth: request.dob,
        guardian_1_name: request.parent_name,
        guardian_1_email: isEmail ? request.parent_contact : null,
        guardian_1_phone: isEmail ? null : request.parent_contact,
        is_active: true
      });
      if (playerError) {
        setMessage(playerError.message);
        return;
      }
    }

    const { error } = await supabase
      .from('pending_join_requests')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', request.id);

    if (error) {
      setMessage(error.message);
      return;
    }
    setVisibleRequests((current) => current.filter((item) => item.id !== request.id));
  }

  if (visibleRequests.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-white">Pending Requests</h2>
      <p className="mt-1 text-sm text-white/30">Review players asking to join your teams.</p>
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {visibleRequests.map((request) => {
          const team = teams.find((item) => item.id === request.team_id);
          return (
            <article key={request.id} className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg, #0d1117, #0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="text-xs uppercase tracking-[0.24em] text-white/25">{team?.name ?? 'Team request'}</p>
              <h3 className="mt-3 text-xl font-bold text-white">{request.full_name}</h3>
              <p className="mt-2 text-sm text-white/35">DOB: {request.dob}</p>
              <p className="mt-2 text-sm text-white/35">Guardian: {request.parent_name}</p>
              <p className="mt-2 text-sm text-white/35">Contact: {request.parent_contact}</p>
              <div className="mt-5 flex gap-3">
                <button type="button" onClick={() => reviewRequest(request, 'accepted')} className="rounded-full px-5 py-2 text-sm font-semibold text-white transition-all duration-300 ease-out" style={{ backgroundColor: primaryColour }}>
                  Approve
                </button>
                <button type="button" onClick={() => reviewRequest(request, 'declined')} className="rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-white transition-all duration-300 ease-out hover:bg-white/[0.06]">
                  Decline
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {message ? <p className="mt-4 text-sm text-red-200">{message}</p> : null}
    </section>
  );
}

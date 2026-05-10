'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CopyInviteButton from '@/components/dashboard/CopyInviteButton';
import type { TeamRecord } from '@/lib/dashboard/getClubData';

interface ClubTeamScrollerProps {
  teams: TeamRecord[];
  clubId: string;
  clubName: string;
  primaryColour: string;
  contrastText: string;
}

function genderIcon(gender: string | null): string {
  if (gender === 'boys') return 'M';
  if (gender === 'girls') return 'F';
  return 'X';
}

export default function ClubTeamScroller({ teams, clubId, clubName, primaryColour, contrastText }: ClubTeamScrollerProps) {
  const [selectedTeam, setSelectedTeam] = useState<TeamRecord | null>(null);
  const [teamSearch, setTeamSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const filteredTeams = useMemo(() => {
    const query = teamSearch.trim().toLowerCase();
    if (!query) return teams;
    return teams.filter((team) => team.name.toLowerCase().includes(query));
  }, [teamSearch, teams]);
  const inviteUrl = useMemo(() => {
    if (!selectedTeam?.pending_invite) return '';
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/auth/signup?role=coach&invite=${selectedTeam.pending_invite.invite_token}&club=${clubId}&team=${selectedTeam.id}`;
  }, [clubId, selectedTeam]);
  const shareText = selectedTeam ? `Hi ${selectedTeam.coach_name ?? 'Coach'}, you've been invited to join ${selectedTeam.name} on Shift OS.\nClick this link to set up your coach account:\n${inviteUrl}\nYour team is waiting for you!` : '';

  const stopAutoScroll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startAutoScroll = useCallback(() => {
    stopAutoScroll();
    const el = scrollRef.current;
    if (!el || teamSearch.trim().length > 0 || teams.length < 6 || !window.matchMedia('(min-width: 768px)').matches) return;
    intervalRef.current = setInterval(() => {
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 1) {
        el.scrollLeft = 0;
      } else {
        el.scrollLeft += 1;
      }
    }, 30);
  }, [stopAutoScroll, teamSearch, teams.length]);

  useEffect(() => {
    startAutoScroll();
    return stopAutoScroll;
  }, [startAutoScroll, stopAutoScroll]);

  async function nativeShare() {
    if (!selectedTeam?.join_code) return;
    const text = `${selectedTeam.name} join code: ${selectedTeam.join_code}`;
    if (navigator.share) await navigator.share({ text });
    else await navigator.clipboard.writeText(text);
  }

  return (
    <>
      <div className="mt-4 flex items-center justify-end gap-2">
        <label className="relative block w-[200px] max-w-full">
          <input value={teamSearch} onChange={(event) => setTeamSearch(event.target.value)} placeholder="Find team..." className="w-full rounded-full border bg-white/[0.04] px-3 py-1.5 pr-8 text-xs text-white outline-none transition-all duration-300 ease-out placeholder:text-white/30 focus:border-white/20" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
          {teamSearch ? <button type="button" onClick={() => setTeamSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/35 transition-all duration-300 ease-out hover:text-white">x</button> : <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/25">⌕</span>}
        </label>
        <Link href="/dashboard/club/teams/new" className="hidden rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out hover:scale-[1.02] sm:inline-flex" style={{ backgroundColor: primaryColour, color: contrastText }}>
          Add Team +
        </Link>
      </div>
      <div ref={scrollRef} onMouseEnter={stopAutoScroll} onMouseLeave={startAutoScroll} className="-mx-5 mt-4 flex gap-3 overflow-x-auto px-5 pb-3 scrollbar-hide md:gap-4">
        {filteredTeams.map((team) => (
          <button key={team.id} type="button" onClick={() => setSelectedTeam(team)} className="h-[140px] w-[160px] flex-shrink-0 overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 ease-out hover:-translate-y-0.5 md:h-[160px] md:w-[200px]" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="mb-3 h-0.5 w-full rounded-full" style={{ backgroundColor: primaryColour }} />
            <h4 className="truncate text-sm font-bold text-white">{team.name}</h4>
            <div className="mt-2 flex items-center gap-1">
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-white/45">{team.age_group ?? 'Team'}</span>
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-white/45">{genderIcon(team.gender)}</span>
            </div>
            <p className="mt-3 text-2xl font-black" style={{ color: primaryColour }}>{team.player_count}</p>
            <p className="text-xs text-white/30">players</p>
            <p className="mt-2 truncate text-xs text-white/40">{team.coach_name ?? 'Unassigned'}</p>
          </button>
        ))}
        {filteredTeams.length === 0 ? <p className="flex h-[140px] w-[220px] flex-shrink-0 items-center justify-center rounded-2xl border border-white/[0.06] text-sm text-white/35 md:h-[160px]">No teams found.</p> : null}
        <Link href="/dashboard/club/teams/new" className="flex h-[140px] w-[100px] flex-shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed text-center transition-all duration-300 ease-out hover:-translate-y-0.5 md:h-[160px]" style={{ borderColor: primaryColour, color: primaryColour }}>
          <span className="text-2xl">+</span>
          <span className="text-xs font-semibold">Add Team</span>
        </Link>
      </div>

      {selectedTeam ? (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedTeam(null)}>
          <section className="drawer-enter fixed inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[20px] border-t p-5" style={{ backgroundColor: '#0d1117', borderColor: 'rgba(255,255,255,0.08)' }} onClick={(event) => event.stopPropagation()}>
            <div className="mx-auto mb-5 h-1 w-8 rounded-full bg-white/20" />
            <button type="button" onClick={() => setSelectedTeam(null)} className="absolute right-5 top-4 text-xl text-white/45">x</button>
            <h3 className="text-2xl font-bold text-white">{selectedTeam.name}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/55">{selectedTeam.age_group ?? 'Age group'}</span>
              <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/55">{selectedTeam.gender ?? 'mixed'}</span>
              <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/55">{selectedTeam.season ?? 'Season'}</span>
            </div>

            <section className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-white/30">Team Join Code</p>
              <p className="mt-2 font-mono text-3xl font-black tracking-[0.3em]" style={{ color: primaryColour }}>{selectedTeam.join_code ?? '------'}</p>
              <div className="mt-4 flex gap-2">
                {selectedTeam.join_code ? <CopyInviteButton inviteUrl={selectedTeam.join_code} label="Copy Code" /> : null}
                <button type="button" onClick={nativeShare} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white">Share Code</button>
              </div>
            </section>

            <section className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-sm text-white/40">Coach</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="font-semibold text-white">{selectedTeam.coach_name ?? 'Unassigned'}</p>
                <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: selectedTeam.coach_status === 'assigned' ? '#10b981' : selectedTeam.coach_status === 'pending' ? '#f59e0b' : 'rgba(255,255,255,0.12)', color: '#ffffff' }}>{selectedTeam.coach_status}</span>
              </div>
              {selectedTeam.coach_status !== 'assigned' && selectedTeam.pending_invite ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <CopyInviteButton inviteUrl={inviteUrl} label="Copy Link" />
                  <a className="rounded-full border border-white/10 px-4 py-2 text-sm text-white" href={`mailto:${selectedTeam.coach_email ?? ''}?subject=Shift OS Invite&body=${encodeURIComponent(inviteUrl)}`}>Email</a>
                  <a className="rounded-full px-4 py-2 text-sm font-semibold" style={{ backgroundColor: primaryColour, color: contrastText }} href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer">WhatsApp</a>
                </div>
              ) : null}
            </section>

            <section className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <h4 className="font-semibold text-white">{selectedTeam.player_count} Players</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedTeam.players.length === 0 ? <span className="text-sm text-white/35">No players yet</span> : selectedTeam.players.map((player, index) => (
                  <span key={`${player.first_name}-${player.last_name}-${index}`} className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/55">{[player.first_name, player.last_name].filter(Boolean).join(' ')}</span>
                ))}
              </div>
            </section>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link href={`/dashboard/club/teams/${selectedTeam.id}`} className="rounded-full px-4 py-2 text-sm font-semibold" style={{ backgroundColor: primaryColour, color: contrastText }}>View Full Team</Link>
              {selectedTeam.coach_user_id ? <Link href={`/dashboard/club/teams/${selectedTeam.id}/coach-view`} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white">View as Coach</Link> : null}
              <button type="button" className="rounded-full border border-white/10 px-4 py-2 text-sm text-white">Edit Team</button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

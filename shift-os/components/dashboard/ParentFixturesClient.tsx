import ParentAvailabilityButton from '@/components/dashboard/ParentAvailabilityButton';
import type { ReactNode } from 'react';
import type { ParentAvailabilityStatus, ParentPlayerTeam, ParentSession } from '@/lib/dashboard/getParentDashboardData';

interface ParentFixturesClientProps {
  playerId: string;
  playerName: string;
  team: ParentPlayerTeam;
  heroSessionId: string | null;
  afterHero?: ReactNode;
}

function formatDay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatLongDay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '';
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function sessionTitle(teamName: string, session: ParentSession): string {
  if (session.type === 'match') return `${teamName} v ${session.opponent ?? 'Opponent TBC'}`;
  if (session.type === 'tournament') return session.title ?? session.opponent ?? 'Tournament';
  return session.title ?? 'Training Session';
}

function statusStyles(status: ParentAvailabilityStatus): { label: string; colour: string; icon: string } {
  if (status === 'available') return { label: 'Available', colour: '#10b981', icon: 'OK' };
  if (status === 'unavailable') return { label: 'Not Available', colour: '#ef4444', icon: 'NO' };
  if (status === 'week_off') return { label: 'Week Off', colour: 'rgba(255,255,255,0.25)', icon: '--' };
  return { label: 'Pending', colour: '#f59e0b', icon: '...' };
}

function typeLabel(type: string): string {
  if (type === 'match') return 'Next Match';
  if (type === 'tournament') return 'Next Tournament';
  return 'Next Training';
}

function typeIcon(type: string): string {
  if (type === 'match') return 'M';
  if (type === 'tournament') return 'T';
  return 'S';
}

function displayAddress(session: ParentSession): string {
  if (session.full_address) {
    return session.postcode && !session.full_address.includes(session.postcode)
      ? `${session.full_address}, ${session.postcode}`
      : session.full_address;
  }
  return session.location ?? 'TBC';
}

function nextToggleStatus(status: ParentAvailabilityStatus): 'available' | 'unavailable' {
  return status === 'available' ? 'unavailable' : 'available';
}

export default function ParentFixturesClient({ playerId, playerName, team, heroSessionId, afterHero }: ParentFixturesClientProps) {
  const sessions = team.upcoming_sessions;
  const heroSession = sessions.find((session) => session.id === heroSessionId) ?? sessions[0] ?? null;
  const visibleSessions = sessions.filter((session) => session.id !== heroSession?.id);

  function renderHeroAvailability(session: ParentSession, desktop: boolean) {
    if (session.my_availability === 'week_off') {
      return (
        <div className={`${desktop ? 'rounded-2xl p-6 text-lg' : 'rounded-full px-4 text-sm'} flex min-h-14 items-center justify-center bg-white/10 font-semibold text-white/60`}>
          Week Off - set by coach
        </div>
      );
    }

    if (session.my_availability === 'available' || session.my_availability === 'unavailable') {
      const isAvailable = session.my_availability === 'available';
      return (
        <ParentAvailabilityButton
          playerId={playerId}
          sessionId={session.id}
          status={isAvailable ? 'unavailable' : 'available'}
          className={`${desktop ? 'rounded-2xl border p-6 text-left' : 'min-h-14 rounded-full px-5 text-sm'} w-full font-bold transition-all duration-300 ease-out hover:-translate-y-0.5`}
          style={{
            backgroundColor: isAvailable ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            borderColor: isAvailable ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
            color: isAvailable ? '#10b981' : '#ef4444'
          }}
        >
          <span className={desktop ? 'block text-2xl' : ''}>{isAvailable ? "You're Available" : 'Not Available'}</span>
          {desktop ? <span className="mt-1 block text-sm font-normal text-white/35">Tap to change</span> : null}
        </ParentAvailabilityButton>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-3">
        <ParentAvailabilityButton
          playerId={playerId}
          sessionId={session.id}
          status="available"
          className={`${desktop ? 'rounded-2xl py-5 text-lg' : 'rounded-full py-4 text-sm'} px-4 font-bold text-white transition-all duration-300 ease-out hover:scale-[1.01]`}
          style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}
        >
          Available
        </ParentAvailabilityButton>
        <ParentAvailabilityButton
          playerId={playerId}
          sessionId={session.id}
          status="unavailable"
          className={`${desktop ? 'rounded-2xl py-5 text-lg' : 'rounded-full py-4 text-sm'} px-4 font-bold text-white transition-all duration-300 ease-out hover:scale-[1.01]`}
          style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}
        >
          Not Available
        </ParentAvailabilityButton>
      </div>
    );
  }

  function renderHeroCard(session: ParentSession, desktop: boolean) {
    return (
      <section
        className={`${desktop ? 'mt-6 min-h-[220px] p-6' : 'mt-8 p-5'} relative overflow-hidden rounded-2xl`}
        style={{ background: `linear-gradient(135deg, ${team.club_primary_colour} 0%, #102015 52%, #080a0f 100%)` }}
      >
        <div className="absolute inset-x-0 bottom-0 h-full" style={{ background: 'linear-gradient(to bottom, transparent 50%, #080a0f 100%)' }} />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">{typeLabel(session.type)}</p>
          <h2 className={`${desktop ? 'text-3xl' : 'text-2xl'} mt-2 font-black text-white`}>{sessionTitle(team.team_name, session)}</h2>
          <div className={`${desktop ? 'mt-5' : 'mt-4'} space-y-3`}>
            <p><span className="mr-2 text-xs uppercase tracking-wider text-white/35">Date:</span><span className="text-sm text-white/85">{desktop ? formatLongDay(session.session_date) : formatDay(session.session_date)}</span></p>
            <p><span className="mr-2 text-xs uppercase tracking-wider text-white/35">Time:</span><span className="text-sm text-white/85">KO {formatTime(session.session_date)}</span></p>
            <p><span className="mr-2 text-xs uppercase tracking-wider text-white/35">Location:</span><span className="text-sm text-white/85">{displayAddress(session)}</span></p>
            {session.coach_notes ? <p><span className="mr-2 text-xs uppercase tracking-wider text-white/35">Notes:</span><span className="text-sm italic text-white/70">{session.coach_notes}</span></p> : null}
          </div>
          {session.tournify_link ? <a href={session.tournify_link} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white">View Tournament -&gt;</a> : null}
        </div>
      </section>
    );
  }

  function renderScheduleList(desktop: boolean) {
    return (
      <section className="mt-8">
        <h2 className={desktop ? 'text-xs font-bold uppercase tracking-[0.24em] text-white/35' : 'text-xl font-bold text-white'}>Upcoming Schedule</h2>
        <div className="mt-4 space-y-3">
          {visibleSessions.length === 0 ? (
            <p className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-sm text-white/35">No other sessions are posted yet.</p>
          ) : visibleSessions.map((session) => {
            const status = statusStyles(session.my_availability);
            const accent = session.type === 'match' ? team.club_primary_colour : 'rgba(255,255,255,0.15)';
            return (
              <article key={session.id} className={`${desktop ? 'p-5' : 'p-4'} rounded-xl border`} style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)', borderLeft: `3px solid ${accent}` }}>
                <div className="flex gap-3">
                  <span className={`${desktop ? 'flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] text-xs font-bold' : 'mt-1 text-xs font-bold'} shrink-0`}>{typeIcon(session.type)}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-white">{sessionTitle(team.team_name, session)}</h3>
                    <p className="mt-1 text-sm text-white/40">{formatDay(session.session_date)} at {formatTime(session.session_date)}</p>
                    <p className="mt-1 truncate text-xs text-white/30">{displayAddress(session)}</p>
                    {session.coach_notes ? <p className="mt-2 line-clamp-2 text-xs italic text-white/35">{session.coach_notes}</p> : null}
                    {desktop && (session.opposition_contact_name || session.opposition_contact_phone) ? <p className="mt-1 text-xs text-white/30">{[session.opposition_contact_name, session.opposition_contact_phone].filter(Boolean).join(' - ')}</p> : null}
                  </div>
                  <ParentAvailabilityButton
                    playerId={playerId}
                    sessionId={session.id}
                    status={nextToggleStatus(session.my_availability)}
                    disabled={session.my_availability === 'week_off'}
                    className="h-9 shrink-0 rounded-full px-3 text-xs font-semibold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 disabled:cursor-not-allowed"
                    style={{ backgroundColor: status.colour }}
                  >
                    {status.icon} {status.label}
                  </ParentAvailabilityButton>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="md:hidden">
        {heroSession ? (
          <>
            {renderHeroCard(heroSession, false)}
            {afterHero ? <div className="mt-4">{afterHero}</div> : null}
            <div className="mt-6">{renderHeroAvailability(heroSession, false)}</div>
          </>
        ) : (
          <section className="mt-8 rounded-2xl border border-white/[0.06] p-5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)' }}>
            <h2 className="text-xl font-bold text-white">No sessions yet</h2>
            <p className="mt-2 text-sm text-white/40">Your coach has not posted a fixture, training session or tournament yet.</p>
          </section>
        )}
        {renderScheduleList(false)}
      </section>

      <section className="hidden min-h-[calc(100vh-64px)] grid-cols-2 md:grid">
        <aside className="sticky top-16 h-[calc(100vh-64px)] overflow-y-auto px-12 py-10">
          <h1 className="text-4xl font-black text-white">{playerName}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full px-3 py-1 text-xs font-semibold text-black" style={{ backgroundColor: team.club_primary_colour }}>{team.age_group ?? 'Age TBC'}</span>
            <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/55">{team.gender ?? 'Mixed'}</span>
          </div>
          {heroSession ? renderHeroCard(heroSession, true) : (
            <section className="mt-6 rounded-2xl border border-white/[0.06] p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)' }}>
              <h2 className="text-2xl font-bold text-white">No sessions yet</h2>
              <p className="mt-2 text-sm text-white/40">Your coach has not posted a fixture, training session or tournament yet.</p>
            </section>
          )}
          {afterHero ? <div className="mt-4">{afterHero}</div> : null}
        </aside>

        <section className="min-h-[calc(100vh-64px)] border-l px-12 py-10" style={{ backgroundColor: 'rgba(255,255,255,0.01)', borderColor: 'rgba(255,255,255,0.04)' }}>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-white/35">Your Availability</p>
          {heroSession ? renderHeroAvailability(heroSession, true) : <p className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-sm text-white/35">No current session to respond to.</p>}
          {renderScheduleList(true)}
        </section>
      </section>
    </>
  );
}

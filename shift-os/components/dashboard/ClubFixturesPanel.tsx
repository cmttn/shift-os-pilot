'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { FixtureRecord } from '@/lib/dashboard/getClubData';

interface ClubFixturesPanelProps {
  fixtures: FixtureRecord[];
  primaryColour: string;
  darkerPrimary: string;
  contrastText: string;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '';
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function typeBadge(fixture: FixtureRecord, primaryColour: string, contrastText: string) {
  if (fixture.type === 'match') {
    return { label: 'MATCH', style: { backgroundColor: primaryColour, color: contrastText } };
  }
  if (fixture.type === 'tournament') {
    return { label: 'TOURNAMENT', style: { backgroundColor: 'rgba(245,158,11,0.14)', color: '#f59e0b' } };
  }
  return { label: 'TRAINING', style: { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)' } };
}

export default function ClubFixturesPanel({ fixtures, primaryColour, darkerPrimary, contrastText }: ClubFixturesPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleFixtures = expanded ? fixtures : fixtures.slice(0, 3);

  return (
    <section className="mt-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">Fixtures</h3>
          <p className="mt-1 text-sm text-white/35">Manage your club schedule from the fixtures page</p>
        </div>
        <Link href="/dashboard/club/fixtures" className="rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out hover:scale-[1.02]" style={{ background: `linear-gradient(135deg, ${primaryColour}, ${darkerPrimary})`, color: contrastText }}>
          Manage Fixtures
        </Link>
      </div>

      <div className="mt-5">
        {fixtures.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] py-8 text-center">
            <p className="font-semibold text-white">No fixtures scheduled yet.</p>
            <p className="mt-2 text-sm text-white/35">Open fixture management to upload, import or manage fixtures.</p>
            <div className="mt-5 flex justify-center">
              <Link href="/dashboard/club/fixtures" className="rounded-full px-4 py-2 text-sm font-semibold" style={{ backgroundColor: primaryColour, color: contrastText }}>Manage Fixtures</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {visibleFixtures.map((fixture) => {
                const badge = typeBadge(fixture, primaryColour, contrastText);
                return (
                  <article key={fixture.id} className="rounded-xl border p-4 transition-all duration-300 ease-out hover:translate-x-1 hover:bg-white/[0.04]" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)', borderLeft: `3px solid ${fixture.type === 'match' ? primaryColour : 'rgba(255,255,255,0.1)'}` }}>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0 md:w-[38%]">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider" style={badge.style}>{badge.label}</span>
                        <p className="mt-2 text-sm text-white/50">{fixture.team_name}</p>
                        <h4 className="mt-1 truncate text-base font-semibold text-white">{fixture.type === 'match' ? `vs ${fixture.opponent}` : fixture.title ?? fixture.opponent}</h4>
                      </div>
                      <div className="min-w-0 text-sm text-white/50 md:flex-1">
                        <p>{formatDate(fixture.fixture_date)}</p>
                        <p>{formatTime(fixture.fixture_date)}</p>
                        <p className="truncate text-xs text-white/35">{fixture.location ?? 'Location TBC'}</p>
                      </div>
                      <div className="flex items-center justify-between gap-4 md:min-w-[150px]">
                        <p className="text-xs text-white/45">Available {fixture.available_count} / No {fixture.unavailable_count} / Pending {fixture.pending_count}</p>
                        <Link href="/dashboard/club/fixtures" className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/55">Manage</Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            {fixtures.length > 3 ? (
              <button type="button" onClick={() => setExpanded((current) => !current)} className="mt-4 rounded-full border border-white/10 px-4 py-2 text-sm text-white transition-all duration-300 ease-out hover:bg-white/[0.04]">
                {expanded ? 'Show less' : `Show all ${fixtures.length} fixtures`}
              </button>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

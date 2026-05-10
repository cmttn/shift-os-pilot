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

function downloadTemplate() {
  const csvContent = 'Date,Time,Type,Home/Away,Opponent,Venue,Full Address,Postcode,Opposition Contact Name,Opposition Contact Phone,Notes,Tournify Link\n';
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'shiftos-fixtures-template.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ClubFixturesPanel({ fixtures, primaryColour, darkerPrimary, contrastText }: ClubFixturesPanelProps) {
  const [showImport, setShowImport] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const visibleFixtures = expanded ? fixtures : fixtures.slice(0, 3);

  return (
    <section className="mt-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">Fixtures</h3>
          <p className="mt-1 text-sm text-white/35">Manage and import your club&apos;s schedule</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setShowImport((current) => !current)} className="rounded-full border px-4 py-2 text-sm text-white transition-all duration-300 ease-out hover:bg-white/[0.08]" style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }}>
            ↑ Import Fixtures
          </button>
          <Link href="/dashboard/club/fixtures/new" className="rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out hover:scale-[1.02]" style={{ background: `linear-gradient(135deg, ${primaryColour}, ${darkerPrimary})`, color: contrastText }}>
            Add Fixture +
          </Link>
        </div>
      </div>

      {showImport ? (
        <div className="mt-3 rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <h4 className="text-lg font-semibold text-white">Import your fixtures</h4>
          <p className="mt-1 text-sm text-white/40">Works with Full-Time FA, Pitchero, Tournify and any CSV export</p>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              ['📄', 'CSV Import', 'Upload a CSV from Full-Time FA, Pitchero or our template', '/dashboard/club/fixtures/import', 'Upload CSV →'],
              ['⚽', 'Full-Time FA', 'Export from your FA Full-Time league page and import directly', '/dashboard/club/fixtures/import?source=fulltime', 'Import →']
            ].map(([icon, title, description, href, label]) => (
              <article key={title} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-2xl">{icon}</p>
                <h5 className="mt-3 font-semibold text-white">{title}</h5>
                <p className="mt-2 text-sm text-white/40">{description}</p>
                <Link href={href} className="mt-4 inline-flex rounded-full px-4 py-2 text-sm font-semibold" style={{ backgroundColor: primaryColour, color: contrastText }}>{label}</Link>
              </article>
            ))}
            <article className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-2xl">⬇</p>
              <h5 className="mt-3 font-semibold text-white">Download Template</h5>
              <p className="mt-2 text-sm text-white/40">Get our CSV template pre-formatted for easy fixture entry</p>
              <button type="button" onClick={downloadTemplate} className="mt-4 rounded-full border border-white/10 px-4 py-2 text-sm text-white transition-all duration-300 ease-out hover:bg-white/[0.04]">Download →</button>
            </article>
          </div>
        </div>
      ) : null}

      <div className="mt-5">
        {fixtures.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] py-8 text-center">
            <p className="font-semibold text-white">No fixtures scheduled yet.</p>
            <p className="mt-2 text-sm text-white/35">Import from your league system or add manually.</p>
            <div className="mt-5 flex justify-center gap-2">
              <button type="button" onClick={() => setShowImport(true)} className="rounded-full px-4 py-2 text-sm font-semibold" style={{ backgroundColor: primaryColour, color: contrastText }}>Import Fixtures</button>
              <Link href="/dashboard/club/fixtures/new" className="rounded-full border border-white/10 px-4 py-2 text-sm text-white">Add Fixture +</Link>
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
                        <p>📅 {formatDate(fixture.fixture_date)}</p>
                        <p>⏰ {formatTime(fixture.fixture_date)}</p>
                        <p className="truncate text-xs text-white/35">📍 {fixture.location ?? 'Location TBC'}</p>
                      </div>
                      <div className="flex items-center justify-between gap-4 md:min-w-[150px]">
                        <p className="text-xs text-white/45">✅{fixture.available_count} ❌{fixture.unavailable_count} ⏳{fixture.pending_count}</p>
                        <span className="text-xl text-white/35">→</span>
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

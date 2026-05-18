'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { FixtureRecord, TeamRecord } from '@/lib/dashboard/getClubData';
import { createClient } from '@/lib/supabase/client';
import { contrastText } from '@/lib/utils/contrastText';

interface ClubFixturesManagerProps {
  fixtures: FixtureRecord[];
  teams: TeamRecord[];
  primaryColour: string;
}

type FixtureFilter = 'all' | 'match' | 'training' | 'tournament';

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '';
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function fixtureTitle(fixture: FixtureRecord): string {
  if (fixture.type === 'match') return `vs ${fixture.opponent}`;
  return fixture.title ?? fixture.opponent ?? fixture.type;
}

export default function ClubFixturesManager({ fixtures, teams, primaryColour }: ClubFixturesManagerProps) {
  const [items, setItems] = useState(fixtures);
  const [filter, setFilter] = useState<FixtureFilter>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const textColour = contrastText(primaryColour);
  const filteredFixtures = useMemo(() => items.filter((fixture) => filter === 'all' || fixture.type === filter), [items, filter]);
  const matchCount = items.filter((fixture) => fixture.type === 'match').length;
  const trainingCount = items.filter((fixture) => fixture.type === 'training').length;
  const tournamentCount = items.filter((fixture) => fixture.type === 'tournament').length;

  async function archiveFixture(fixtureId: string) {
    const confirmed = window.confirm('Remove this fixture from the club schedule?');
    if (!confirmed) return;

    setDeletingId(fixtureId);
    setError('');
    const { error: updateError } = await createClient()
      .from('sessions')
      .update({ is_active: false })
      .eq('id', fixtureId);

    setDeletingId(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    setItems((current) => current.filter((fixture) => fixture.id !== fixtureId));
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border p-6" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/30">Club Fixtures</p>
            <h1 className="mt-3 text-3xl font-black text-white">Fixture Management</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/40">
              Upload league fixtures, manage team schedules, remove old entries and control whether coaches can import their own fixtures.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/club/fixtures/import" className="rounded-full px-5 py-3 text-sm font-semibold" style={{ backgroundColor: primaryColour, color: textColour }}>
              Upload Fixtures
            </Link>
            <button
              type="button"
              onClick={() => {
                const csvContent = 'Date,Time,Type,Home/Away,Opponent,Venue,Full Address,Postcode,Opposition Contact Name,Opposition Contact Phone,Notes,Tournify Link\n';
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = 'shiftos-fixtures-template.csv';
                anchor.click();
                URL.revokeObjectURL(url);
              }}
              className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white/60 transition hover:bg-white/[0.05]"
            >
              Download Template
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ['Total', items.length],
            ['Matches', matchCount],
            ['Training', trainingCount],
            ['Tournaments', tournamentCount]
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/25">{label}</p>
              <p className="mt-2 text-2xl font-black text-white">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border p-5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Import Options</h2>
            <p className="mt-1 text-sm text-white/35">Club admins can upload fixtures for every team. Coaches can add friendlies unless import access is enabled.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/club/fixtures/import" className="rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: primaryColour, color: primaryColour }}>
              CSV Import
            </Link>
            <Link href="/dashboard/club/fixtures/import?source=fulltime" className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/55">
              Full-Time Import
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border p-5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Upcoming Fixtures</h2>
            <p className="mt-1 text-sm text-white/35">Manage the club schedule across {teams.length} team{teams.length === 1 ? '' : 's'}.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'match', 'training', 'tournament'] as FixtureFilter[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className="rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition"
                style={filter === item ? { backgroundColor: primaryColour, borderColor: primaryColour, color: textColour } : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.42)' }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {error ? <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}

        {filteredFixtures.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
            <p className="font-semibold text-white">No fixtures found.</p>
            <p className="mt-2 text-sm text-white/35">Upload a CSV, use Full-Time import, or let coaches add friendlies from their schedule.</p>
            <Link href="/dashboard/club/fixtures/import" className="mt-5 inline-flex rounded-full px-5 py-3 text-sm font-semibold" style={{ backgroundColor: primaryColour, color: textColour }}>
              Upload Fixtures
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {filteredFixtures.map((fixture) => (
              <article key={fixture.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ backgroundColor: fixture.type === 'match' ? primaryColour : 'rgba(255,255,255,0.07)', color: fixture.type === 'match' ? textColour : 'rgba(255,255,255,0.55)' }}>
                        {fixture.type}
                      </span>
                      <span className="text-xs text-white/35">{fixture.team_name}</span>
                    </div>
                    <h3 className="mt-2 truncate text-lg font-bold text-white">{fixtureTitle(fixture)}</h3>
                    <p className="mt-1 text-sm text-white/40">{formatDate(fixture.fixture_date)} at {formatTime(fixture.fixture_date)}</p>
                    <p className="mt-1 truncate text-sm text-white/30">{fixture.location ?? 'Location TBC'}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[250px]">
                    <div className="rounded-xl bg-white/[0.04] px-3 py-2">
                      <p className="text-sm font-bold text-white">{fixture.available_count}</p>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-white/25">Available</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.04] px-3 py-2">
                      <p className="text-sm font-bold text-white">{fixture.unavailable_count}</p>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-white/25">No</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.04] px-3 py-2">
                      <p className="text-sm font-bold text-white">{fixture.pending_count}</p>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-white/25">Pending</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {fixture.team_id ? (
                      <Link href={`/dashboard/club/teams/${fixture.team_id}/coach-view`} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/60 transition hover:bg-white/[0.05]">
                        Team View
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => { void archiveFixture(fixture.id); }}
                      disabled={deletingId === fixture.id}
                      className="rounded-full border border-red-400/20 px-4 py-2 text-sm text-red-100/70 transition hover:bg-red-500/10 disabled:opacity-50"
                    >
                      {deletingId === fixture.id ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

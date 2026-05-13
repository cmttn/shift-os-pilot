'use client';

import { ChangeEvent, RefObject, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { contrastText } from '@/lib/utils/contrastText';

type ImportMethod = 'tournify' | 'fulltime' | 'matchday';
type FixtureType = 'match' | 'training' | 'tournament';
type HomeAway = 'home' | 'away' | 'neutral' | null;
type WizardScreen = 'methods' | 'steps' | 'review' | 'success';

interface TeamOption {
  id: string;
  name: string;
  primaryColour: string;
}

interface FixtureImportWizardProps {
  teams: TeamOption[];
  coachId: string;
  primaryColour: string;
}

interface ApiFixture {
  date: string | null;
  time: string | null;
  opponent: string | null;
  venue: string | null;
  home_away: HomeAway;
  type: FixtureType | null;
}

interface EditableFixture {
  id: string;
  selected: boolean;
  date: string;
  time: string;
  opponent: string;
  venue: string;
  homeAway: HomeAway;
  type: FixtureType;
}

interface ExtractResponse {
  fixtures?: ApiFixture[];
  source?: string;
  error?: string;
  message?: string;
}

const methodCopy: Record<ImportMethod, { name: string; icon: string; iconClass: string; description: string; tags: string[] }> = {
  tournify: {
    name: 'Tournify',
    icon: 'T',
    iconClass: 'bg-emerald-500 text-white',
    description: 'Import league matches and tournaments',
    tags: ['League matches', 'Tournaments']
  },
  fulltime: {
    name: 'FA Full-Time',
    icon: 'FA',
    iconClass: 'bg-[#cc0000] text-white',
    description: 'Import league fixtures from the FA system',
    tags: ['League matches']
  },
  matchday: {
    name: 'FA Matchday App',
    icon: 'M',
    iconClass: 'bg-blue-900 text-white',
    description: 'Import fixtures from the Matchday app',
    tags: ['League matches']
  }
};

function normaliseApiFixture(fixture: ApiFixture, index: number): EditableFixture {
  return {
    id: `${fixture.date ?? 'fixture'}-${fixture.opponent ?? 'opponent'}-${index}`,
    selected: true,
    date: fixture.date ?? '',
    time: fixture.time ?? '10:00',
    opponent: fixture.opponent ?? '',
    venue: fixture.venue ?? '',
    homeAway: fixture.home_away,
    type: fixture.type ?? 'match'
  };
}

function formatFixtureDate(date: string, time: string): string {
  if (!date) return 'Date needed';
  const parsed = new Date(`${date}T${time || '00:00'}:00`);
  if (Number.isNaN(parsed.getTime())) return `${date} · ${time || 'Time needed'}`;
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(parsed);
}

function toSessionDate(date: string, time: string): string {
  return new Date(`${date}T${time || '10:00'}:00`).toISOString();
}

function homeAwayLabel(value: HomeAway): string {
  if (value === 'home') return 'Home';
  if (value === 'away') return 'Away';
  if (value === 'neutral') return 'Neutral';
  return 'Unknown';
}

function homeAwayClass(value: HomeAway): string {
  if (value === 'home') return 'bg-emerald-500/12 text-emerald-400';
  if (value === 'away') return 'bg-blue-500/12 text-blue-400';
  return 'bg-white/[0.06] text-white/40';
}

function ChevronIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true" className="mx-auto">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="m21 15-5-5L5 21" />
      <circle cx="8.5" cy="8.5" r="1.5" />
    </svg>
  );
}

function Spinner() {
  return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />;
}

export default function FixtureImportWizard({ teams, coachId, primaryColour }: FixtureImportWizardProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [screen, setScreen] = useState<WizardScreen>('methods');
  const [method, setMethod] = useState<ImportMethod>('tournify');
  const [step, setStep] = useState(1);
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id ?? '');
  const [files, setFiles] = useState<File[]>([]);
  const [fullTimeUrl, setFullTimeUrl] = useState('');
  const [fixtures, setFixtures] = useState<EditableFixture[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successCount, setSuccessCount] = useState(0);

  const activeTeam = teams.find((team) => team.id === selectedTeamId) ?? teams[0] ?? null;
  const accentColour = activeTeam?.primaryColour ?? primaryColour;
  const accentText = contrastText(accentColour);
  const selectedCount = fixtures.filter((fixture) => fixture.selected).length;
  const validFullTimeUrl = fullTimeUrl.includes('fulltime.thefa.com');
  const previewUrls = useMemo(() => files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })), [files]);

  function chooseMethod(nextMethod: ImportMethod) {
    setMethod(nextMethod);
    setStep(1);
    setFiles([]);
    setFullTimeUrl('');
    setFixtures([]);
    setError('');
    setScreen('steps');
  }

  function goBack() {
    setError('');
    if (screen === 'review') {
      setScreen('steps');
      setStep(4);
      return;
    }
    if (screen === 'success') {
      setScreen('methods');
      return;
    }
    if (screen === 'steps' && step > 1) {
      setStep((current) => current - 1);
      return;
    }
    setScreen('methods');
  }

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    setFiles((current) => [...current, ...selectedFiles]);
    event.target.value = '';
  }

  function removeFile(fileName: string) {
    setFiles((current) => current.filter((file) => file.name !== fileName));
  }

  function updateFixture(id: string, patch: Partial<EditableFixture>) {
    setFixtures((current) => current.map((fixture) => fixture.id === id ? { ...fixture, ...patch } : fixture));
  }

  async function extractFromImages() {
    if (files.length === 0) return;
    setLoading(true);
    setError('');
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    const response = await fetch('/api/fixtures/extract-from-image', {
      method: 'POST',
      body: formData
    });
    const payload = (await response.json()) as ExtractResponse;
    setLoading(false);
    if (!response.ok || payload.error) {
      setFixtures([]);
      setError(payload.error ?? 'Could not read fixtures from those screenshots.');
      setScreen('review');
      return;
    }
    setFixtures((payload.fixtures ?? []).map(normaliseApiFixture));
    setError(payload.message ?? '');
    setScreen('review');
  }

  async function fetchFromFullTime() {
    if (!validFullTimeUrl || !activeTeam) return;
    setLoading(true);
    setError('');
    const response = await fetch('/api/fixtures/fetch-from-fulltime', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: fullTimeUrl.trim(), teamName: activeTeam.name })
    });
    const payload = (await response.json()) as ExtractResponse;
    setLoading(false);
    if (!response.ok || payload.error) {
      setFixtures([]);
      setError(payload.error ?? 'Could not fetch fixtures from Full-Time.');
      setScreen('review');
      return;
    }
    setFixtures((payload.fixtures ?? []).map(normaliseApiFixture));
    setError(payload.message ?? '');
    setScreen('review');
  }

  async function importFixtures() {
    if (!activeTeam || selectedCount === 0) return;
    const included = fixtures.filter((fixture) => fixture.selected);
    const invalid = included.some((fixture) => !fixture.date || !fixture.time || (fixture.type === 'match' && !fixture.opponent.trim()));
    if (invalid) {
      setError('Please complete the date, time and opponent for every selected fixture.');
      return;
    }

    setLoading(true);
    setError('');
    const supabase = createClient();
    const inserts = included.map((fixture) => ({
      team_id: activeTeam.id,
      created_by: coachId,
      type: fixture.type,
      title: fixture.type === 'match' ? null : fixture.type === 'training' ? 'Training' : (fixture.opponent.trim() || 'Tournament'),
      opponent: fixture.type === 'match' ? fixture.opponent.trim() : null,
      session_date: toSessionDate(fixture.date, fixture.time),
      location: fixture.venue.trim() || null,
      is_home: fixture.homeAway === 'home',
      is_active: true,
      imported_from: method
    }));

    const { data, error: insertError } = await supabase.from('sessions').insert(inserts).select('id');
    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    const firstSessionId = data?.[0]?.id;
    if (firstSessionId) {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: firstSessionId,
          team_id: activeTeam.id,
          title: 'Fixtures imported!',
          message: `${included.length} fixtures added to your schedule.`,
          audience: 'coaches'
        })
      }).catch(() => undefined);
    }

    setSuccessCount(included.length);
    setScreen('success');
    router.refresh();
  }

  if (screen === 'methods') {
    return (
      <div className="mx-auto max-w-[560px] pb-24">
        <h1 className="text-2xl font-black text-white">Import Fixtures</h1>
        <p className="mb-8 mt-1 text-sm text-white/40">How would you like to import your fixtures?</p>

        {teams.length > 1 ? (
          <label className="mb-5 block">
            <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/30">Team</span>
            <select value={selectedTeamId} onChange={(event) => setSelectedTeamId(event.target.value)} className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none">
              {teams.map((team) => <option key={team.id} value={team.id} className="bg-[#0d1117]">{team.name}</option>)}
            </select>
          </label>
        ) : null}

        <div className="space-y-3">
          {(Object.keys(methodCopy) as ImportMethod[]).map((item) => {
            const copy = methodCopy[item];
            return (
              <button key={item} type="button" onClick={() => chooseMethod(item)} className="flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 text-left transition duration-300 ease-out hover:border-white/10 hover:bg-white/[0.06]">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black ${copy.iconClass}`}>{copy.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-bold text-white">{copy.name}</span>
                  <span className="mt-0.5 block text-xs text-white/40">{copy.description}</span>
                  <span className="mt-2 flex flex-wrap gap-1">
                    {copy.tags.map((tag) => <span key={tag} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-white/40">{tag}</span>)}
                  </span>
                </span>
                <span className="text-white/20"><ChevronIcon /></span>
              </button>
            );
          })}

          <button type="button" onClick={() => router.push('/dashboard/coach/sessions/new')} className="flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 text-left transition duration-300 ease-out hover:border-white/10 hover:bg-white/[0.06]">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-white/60"><PencilIcon /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-bold text-white">Manual Entry</span>
              <span className="mt-0.5 block text-xs text-white/40">Add a friendly, training or tournament manually</span>
              <span className="mt-2 flex flex-wrap gap-1">
                {['Friendlies', 'Training', 'Tournaments'].map((tag) => <span key={tag} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-white/40">{tag}</span>)}
              </span>
            </span>
            <span className="text-white/20"><ChevronIcon /></span>
          </button>
        </div>

        <section className="mt-6 rounded-2xl border border-green-500/10 bg-[rgba(0,200,81,0.05)] p-4">
          <div className="flex items-start gap-3">
            <span className="mt-1.5 h-2 w-2 animate-pulse rounded-full bg-[#00C851]" />
            <div>
              <h2 className="text-sm font-semibold text-white">League connections coming soon</h2>
              <p className="mt-1 text-xs leading-relaxed text-white/40">We are working directly with leagues so fixture uploads become automatic. When your league is connected, fixtures will appear in SHIFT OS the moment they are published, no import needed.</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (screen === 'success') {
    return (
      <div className="mx-auto flex max-w-[560px] flex-col items-center pb-24 pt-12 text-center">
        <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-emerald-500/15 text-3xl text-emerald-300">✓</div>
        <h1 className="mt-6 text-2xl font-black text-white">{successCount} fixtures imported ✓</h1>
        <p className="mt-1 text-sm text-white/40">They are now live on your schedule.</p>
        <button type="button" onClick={() => router.push('/dashboard/coach/schedule')} className="mt-8 w-full rounded-full px-6 py-4 text-sm font-bold transition duration-300 ease-out" style={{ backgroundColor: accentColour, color: accentText }}>View Schedule -&gt;</button>
        <button type="button" onClick={() => { setScreen('methods'); setFixtures([]); setFiles([]); }} className="mt-3 w-full rounded-full border border-white/[0.08] px-6 py-4 text-sm font-semibold text-white/45 transition duration-300 ease-out hover:text-white">Import More Fixtures</button>
      </div>
    );
  }

  if (screen === 'review') {
    return (
      <div className="mx-auto max-w-[560px] pb-24">
        <button type="button" onClick={goBack} className="text-sm text-white/40">← Back</button>
        <h1 className="mt-6 text-2xl font-black text-white">{fixtures.length} fixtures found</h1>
        <p className="mt-1 text-sm text-white/40">Review and confirm before importing.</p>

        {fixtures.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-red-500/10 bg-red-500/[0.06] p-5">
            <h2 className="font-semibold text-white">No fixtures could be found.</h2>
            <p className="mt-2 text-xs text-white/40">{error || 'Try again with a clearer screenshot or URL.'}</p>
            <button type="button" onClick={goBack} className="mt-5 rounded-full border border-white/[0.08] px-5 py-3 text-sm font-semibold text-white/50">Try again ←</button>
          </section>
        ) : (
          <>
            {error ? <p className="mt-5 rounded-xl border border-amber-500/10 bg-amber-500/[0.06] p-3 text-xs text-amber-200/80">{error}</p> : null}
            <div className="mt-6 space-y-2">
              {fixtures.map((fixture) => {
                const editing = editingId === fixture.id;
                return (
                  <article key={fixture.id} className={`rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 transition duration-300 ease-out ${fixture.selected ? '' : 'opacity-40'}`}>
                    <div className="flex gap-3">
                      <input aria-label="Include fixture" type="checkbox" checked={fixture.selected} onChange={(event) => updateFixture(fixture.id, { selected: event.target.checked })} className="mt-1 h-4 w-4 accent-white" />
                      <div className="min-w-0 flex-1">
                        {editing ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <input type="date" value={fixture.date} onChange={(event) => updateFixture(fixture.id, { date: event.target.value })} className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none" />
                              <input type="time" value={fixture.time} onChange={(event) => updateFixture(fixture.id, { time: event.target.value })} className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none" />
                            </div>
                            <input value={fixture.opponent} onChange={(event) => updateFixture(fixture.id, { opponent: event.target.value })} placeholder="Opponent" className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-white/20" />
                            <input value={fixture.venue} onChange={(event) => updateFixture(fixture.id, { venue: event.target.value })} placeholder="Venue" className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-white/20" />
                            <div className="grid grid-cols-2 gap-2">
                              <select value={fixture.homeAway ?? 'neutral'} onChange={(event) => updateFixture(fixture.id, { homeAway: event.target.value as HomeAway })} className="rounded-lg border border-white/[0.08] bg-[#0d1117] px-3 py-2 text-sm text-white outline-none">
                                <option value="home">Home</option>
                                <option value="away">Away</option>
                                <option value="neutral">Neutral</option>
                              </select>
                              <select value={fixture.type} onChange={(event) => updateFixture(fixture.id, { type: event.target.value as FixtureType })} className="rounded-lg border border-white/[0.08] bg-[#0d1117] px-3 py-2 text-sm text-white outline-none">
                                <option value="match">Match</option>
                                <option value="training">Training</option>
                                <option value="tournament">Tournament</option>
                              </select>
                            </div>
                            <button type="button" onClick={() => setEditingId(null)} className="rounded-full px-4 py-2 text-xs font-bold" style={{ backgroundColor: accentColour, color: accentText }}>Done</button>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-semibold text-white">{formatFixtureDate(fixture.date, fixture.time)}</p>
                            <p className="mt-0.5 text-sm text-white/70">vs {fixture.opponent || 'Opponent needed'}</p>
                            {fixture.venue ? <p className="mt-0.5 text-xs text-white/30">{fixture.venue}</p> : null}
                            <div className="mt-3 flex items-center gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-xs ${homeAwayClass(fixture.homeAway)}`}>{homeAwayLabel(fixture.homeAway)}</span>
                              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs capitalize text-white/40">{fixture.type}</span>
                            </div>
                          </>
                        )}
                      </div>
                      {!editing ? <button type="button" onClick={() => setEditingId(fixture.id)} className="self-start text-xs text-white/25 underline">Edit</button> : null}
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="sticky bottom-0 mt-6 flex items-center justify-between gap-3 border-t border-white/[0.06] bg-[rgba(8,10,15,0.97)] px-1 py-4">
              <p className="text-sm text-white/50">{selectedCount} of {fixtures.length} fixtures selected</p>
              <button type="button" onClick={importFixtures} disabled={loading || selectedCount === 0} className="rounded-full px-5 py-3 text-sm font-bold transition duration-300 ease-out disabled:opacity-40" style={{ backgroundColor: accentColour, color: accentText }}>
                {loading ? <span className="flex items-center gap-2"><Spinner /> Importing...</span> : `Import ${selectedCount} Fixtures ->`}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[560px] pb-24">
      <button type="button" onClick={goBack} className="text-sm text-white/40">← Back</button>
      <div className="mt-6 mb-8">
        <div className="flex justify-center gap-3">
          {[1, 2, 3, 4].map((dot) => (
            <span key={dot} className="h-2 w-2 rounded-full" style={dot === step ? { backgroundColor: accentColour } : { border: '1px solid rgba(255,255,255,0.2)' }} />
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-white/30">Step {step} of 4</p>
      </div>

      {method === 'tournify' ? renderTournifySteps(step, setStep, extractFromImages, loading, files, fileInputRef, handleFileSelection, previewUrls, removeFile, accentColour, accentText) : null}
      {method === 'fulltime' ? renderFullTimeSteps(step, setStep, fullTimeUrl, setFullTimeUrl, validFullTimeUrl, fetchFromFullTime, loading, accentColour, accentText) : null}
      {method === 'matchday' ? renderMatchdaySteps(step, setStep, extractFromImages, loading, files, fileInputRef, handleFileSelection, previewUrls, removeFile, accentColour, accentText) : null}
    </div>
  );
}

function NextButton({ onClick, label, accentColour, accentText }: { onClick: () => void; label?: string; accentColour: string; accentText: string }) {
  return (
    <button type="button" onClick={onClick} className="mt-6 w-full rounded-full px-6 py-4 text-sm font-bold transition duration-300 ease-out" style={{ backgroundColor: accentColour, color: accentText }}>
      {label ?? 'Next ->'}
    </button>
  );
}

function InstructionList({ items }: { items: string[] }) {
  return (
    <ol className="mt-6 space-y-3 text-sm text-white/60">
      {items.map((item, index) => (
        <li key={item} className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-bold text-white/50">{index + 1}</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function UploadStep({
  loading,
  files,
  fileInputRef,
  handleFileSelection,
  previewUrls,
  removeFile,
  onSubmit,
  accentColour,
  accentText
}: {
  loading: boolean;
  files: File[];
  fileInputRef: RefObject<HTMLInputElement>;
  handleFileSelection: (event: ChangeEvent<HTMLInputElement>) => void;
  previewUrls: Array<{ name: string; url: string }>;
  removeFile: (fileName: string) => void;
  onSubmit: () => void;
  accentColour: string;
  accentText: string;
}) {
  return (
    <>
      <h1 className="text-xl font-black text-white">Upload Your Screenshots</h1>
      <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-4 w-full cursor-pointer rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] p-8 text-center transition duration-300 ease-out hover:border-white/20 hover:bg-white/[0.04]">
        <span className="block text-white/15"><ImageIcon /></span>
        <span className="mt-3 block font-medium text-white/60">Tap to upload screenshots</span>
        <span className="mt-1 block text-xs text-white/25">or drag and drop here</span>
        <span className="mt-3 block text-xs text-white/15">JPG, PNG, HEIC supported</span>
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelection} />
      {files.length > 0 ? (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {previewUrls.map((preview) => (
              <div key={preview.name} className="relative h-20 w-20 overflow-hidden rounded-xl bg-white/[0.04]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview.url} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => removeFile(preview.name)} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white">x</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-2 text-xs text-white/30 underline">+ Add more screenshots</button>
        </>
      ) : null}
      <button type="button" onClick={onSubmit} disabled={files.length === 0 || loading} className="mt-6 w-full rounded-full px-6 py-4 text-sm font-bold transition duration-300 ease-out disabled:opacity-40" style={{ backgroundColor: accentColour, color: accentText }}>
        {loading ? <span className="flex items-center justify-center gap-2"><Spinner /> Reading your fixtures...</span> : 'Extract Fixtures ->'}
      </button>
    </>
  );
}

function renderTournifySteps(
  step: number,
  setStep: (step: number) => void,
  extractFromImages: () => void,
  loading: boolean,
  files: File[],
  fileInputRef: RefObject<HTMLInputElement>,
  handleFileSelection: (event: ChangeEvent<HTMLInputElement>) => void,
  previewUrls: Array<{ name: string; url: string }>,
  removeFile: (fileName: string) => void,
  accentColour: string,
  accentText: string
) {
  if (step === 1) {
    return (
      <>
        <h1 className="text-xl font-black text-white">Open Tournify</h1>
        <section className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
          <p className="mb-4 text-sm text-white/60">Open the Tournify app on your phone or in your browser:</p>
          <a href="https://tournifyapp.com/live" target="_blank" rel="noreferrer" className="mb-3 block w-full rounded-xl border border-white/10 px-4 py-3 text-center text-sm text-white/60">Open Tournify -&gt;</a>
          <p className="mb-2 text-xs text-white/30">For MYSL fixtures go directly to:</p>
          <div className="grid grid-cols-2 gap-2">
            <a href="https://tournifyapp.com/live/myslsaturday" target="_blank" rel="noreferrer" className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-center text-xs text-white/50">MYSL Saturday -&gt;</a>
            <a href="https://tournifyapp.com/live/myslsunday" target="_blank" rel="noreferrer" className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-center text-xs text-white/50">MYSL Sunday -&gt;</a>
          </div>
        </section>
        <NextButton onClick={() => setStep(2)} accentColour={accentColour} accentText={accentText} />
      </>
    );
  }
  if (step === 2) {
    return (
      <>
        <h1 className="text-xl font-black text-white">Find Your Team</h1>
        <InstructionList items={['Use the search to find your team name', 'Or browse your league and find your division', 'Navigate to your team fixture list']} />
        <p className="mt-4 rounded-xl border border-blue-500/10 bg-blue-500/[0.06] p-4 text-xs text-blue-300/70">Tip: Your team name in Tournify should match your team name in SHIFT OS. If it does not, you can correct it after import.</p>
        <NextButton onClick={() => setStep(3)} accentColour={accentColour} accentText={accentText} />
      </>
    );
  }
  if (step === 3) {
    return (
      <>
        <h1 className="text-xl font-black text-white">Screenshot Your Fixtures</h1>
        <InstructionList items={['Navigate to your fixtures list in Tournify', 'Make sure all upcoming fixtures are visible', 'Take a screenshot of the page', 'If fixtures span multiple screens, take one screenshot per screen']} />
        <section className="mt-4 rounded-xl bg-white/[0.03] p-4">
          <p className="mb-2 text-xs font-semibold text-white/50">How to take a screenshot:</p>
          <p className="text-xs text-white/30">iPhone: Press Side button + Volume Up together</p>
          <p className="text-xs text-white/30">Android: Press Power + Volume Down together</p>
        </section>
        <NextButton onClick={() => setStep(4)} accentColour={accentColour} accentText={accentText} />
      </>
    );
  }
  return <UploadStep loading={loading} files={files} fileInputRef={fileInputRef} handleFileSelection={handleFileSelection} previewUrls={previewUrls} removeFile={removeFile} onSubmit={extractFromImages} accentColour={accentColour} accentText={accentText} />;
}

function renderFullTimeSteps(
  step: number,
  setStep: (step: number) => void,
  fullTimeUrl: string,
  setFullTimeUrl: (url: string) => void,
  validFullTimeUrl: boolean,
  fetchFromFullTime: () => void,
  loading: boolean,
  accentColour: string,
  accentText: string
) {
  if (step === 1) {
    return (
      <>
        <h1 className="text-xl font-black text-white">Open FA Full-Time</h1>
        <p className="mb-6 mt-2 text-sm text-white/50">FA Full-Time is The FA official league system. Your league fixtures are published here.</p>
        <a href="https://fulltime.thefa.com" target="_blank" rel="noreferrer" className="block w-full rounded-xl border border-white/10 px-4 py-3 text-center text-sm text-white/60">Open Full-Time -&gt;</a>
        <NextButton onClick={() => setStep(2)} accentColour={accentColour} accentText={accentText} />
      </>
    );
  }
  if (step === 2) {
    return (
      <>
        <h1 className="text-xl font-black text-white">Search For Your Team</h1>
        <InstructionList items={['Use the search bar at the top of the page', "Type your team name, for example 'MSC United'", 'Click on your team in the search results', 'You should now see your upcoming fixtures']} />
        <p className="mt-4 rounded-xl border border-blue-500/10 bg-blue-500/[0.06] p-4 text-xs text-blue-300/70">Make sure you are on the fixtures page for your team. You should see a list of upcoming matches with dates, times and opponents.</p>
        <NextButton onClick={() => setStep(3)} accentColour={accentColour} accentText={accentText} />
      </>
    );
  }
  if (step === 3) {
    return (
      <>
        <h1 className="text-xl font-black text-white">Copy Your Team URL</h1>
        <InstructionList items={['Once you can see your team fixtures page', 'Tap or click the address bar at the top of your browser so the whole URL highlights', 'Copy it by long pressing Copy, or Ctrl+C']} />
        <p className="mt-4 break-all rounded-xl bg-white/[0.04] px-4 py-3 font-mono text-xs leading-relaxed text-white/40">https://fulltime.thefa.com/displayFixtures.html?selectedSeason=...&teamId=12345...</p>
        <p className="mt-2 text-xs text-white/20">Your URL will look similar to this.</p>
        <NextButton onClick={() => setStep(4)} accentColour={accentColour} accentText={accentText} />
      </>
    );
  }
  return (
    <>
      <h1 className="text-xl font-black text-white">Paste Your Team URL</h1>
      <textarea value={fullTimeUrl} onChange={(event) => setFullTimeUrl(event.target.value)} placeholder="Paste your Full-Time URL here..." className="mt-4 min-h-[100px] w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.06] px-4 py-4 font-mono text-sm text-white outline-none placeholder:text-white/20" />
      {fullTimeUrl ? (
        validFullTimeUrl
          ? <p className="mt-2 text-xs text-green-400">Valid Full-Time URL</p>
          : <p className="mt-2 text-xs text-red-400">This does not look like a Full-Time URL. Copy the full address from your browser address bar.</p>
      ) : null}
      <button type="button" onClick={fetchFromFullTime} disabled={!validFullTimeUrl || loading} className="mt-6 w-full rounded-full px-6 py-4 text-sm font-bold transition duration-300 ease-out disabled:opacity-40" style={{ backgroundColor: accentColour, color: accentText }}>
        {loading ? <span className="flex items-center justify-center gap-2"><Spinner /> Fetching your fixtures...</span> : 'Fetch Fixtures ->'}
      </button>
    </>
  );
}

function renderMatchdaySteps(
  step: number,
  setStep: (step: number) => void,
  extractFromImages: () => void,
  loading: boolean,
  files: File[],
  fileInputRef: RefObject<HTMLInputElement>,
  handleFileSelection: (event: ChangeEvent<HTMLInputElement>) => void,
  previewUrls: Array<{ name: string; url: string }>,
  removeFile: (fileName: string) => void,
  accentColour: string,
  accentText: string
) {
  if (step === 1) {
    return (
      <>
        <h1 className="text-xl font-black text-white">Open the FA Matchday App</h1>
        <p className="mb-6 mt-2 text-sm text-white/50">The FA Matchday app shows your league fixtures linked to your FA account.</p>
        <a href="https://apps.apple.com/gb/app/fa-matchday/id1412195755" target="_blank" rel="noreferrer" className="mb-3 block w-full rounded-xl border border-white/10 px-4 py-3 text-center text-sm text-white/60">Download for iPhone -&gt;</a>
        <a href="https://play.google.com/store/apps/details?id=com.thefa.matchday" target="_blank" rel="noreferrer" className="block w-full rounded-xl border border-white/10 px-4 py-3 text-center text-sm text-white/60">Download for Android -&gt;</a>
        <p className="mt-2 text-xs text-white/25">Already installed? Open the app and log in.</p>
        <NextButton onClick={() => setStep(2)} accentColour={accentColour} accentText={accentText} />
      </>
    );
  }
  if (step === 2) {
    return (
      <>
        <h1 className="text-xl font-black text-white">Find Your Fixtures</h1>
        <InstructionList items={['Log in to the Matchday app with your FA account', 'Make sure you are viewing the correct team using the team switcher at the top if needed', "Tap 'Fixtures' in the bottom navigation", 'You should now see your upcoming matches']} />
        <p className="mt-4 rounded-xl border border-amber-500/10 bg-amber-500/[0.06] p-4 text-xs text-amber-300/70">Make sure all upcoming fixtures are visible. Scroll down if needed before taking your screenshot.</p>
        <NextButton onClick={() => setStep(3)} accentColour={accentColour} accentText={accentText} />
      </>
    );
  }
  if (step === 3) {
    return (
      <>
        <h1 className="text-xl font-black text-white">Screenshot Your Fixtures</h1>
        <InstructionList items={['Navigate to your fixtures list in Matchday', 'Make sure all upcoming fixtures are visible', 'Take a screenshot of the page', 'If fixtures span multiple screens, take one screenshot per screen']} />
        <section className="mt-4 rounded-xl bg-white/[0.03] p-4">
          <p className="mb-2 text-xs font-semibold text-white/50">How to take a screenshot:</p>
          <p className="text-xs text-white/30">iPhone: Press Side button + Volume Up together</p>
          <p className="text-xs text-white/30">Android: Press Power + Volume Down together</p>
        </section>
        <NextButton onClick={() => setStep(4)} accentColour={accentColour} accentText={accentText} />
      </>
    );
  }
  return <UploadStep loading={loading} files={files} fileInputRef={fileInputRef} handleFileSelection={handleFileSelection} previewUrls={previewUrls} removeFile={removeFile} onSubmit={extractFromImages} accentColour={accentColour} accentText={accentText} />;
}

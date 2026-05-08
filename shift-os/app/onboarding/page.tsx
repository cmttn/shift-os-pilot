'use client';

import { ChangeEvent, FormEvent, useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { uploadClubBadge } from '@/lib/supabase/storage';

interface EyeDropper {
  open(): Promise<{ sRGBHex: string }>;
}

declare global {
  interface Window {
    EyeDropper?: new () => EyeDropper;
  }
}

type BadgeState = {
  file: File | null;
  previewUrl: string | null;
  name: string;
  sizeLabel: string;
  isValid: boolean;
};

type DragState = {
  pointerOffsetX: number;
  pointerOffsetY: number;
};

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
const MAX_BADGE_SIZE_BYTES = 5 * 1024 * 1024;
const BADGE_BASE_SIZE = 80;

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function OnboardingPage() {
  const router = useRouter();
  const badgeFrameRef = useRef<HTMLDivElement | null>(null);
  const [clubName, setClubName] = useState('');
  const [slug, setSlug] = useState('');
  const [primaryColour, setPrimaryColour] = useState('#000000');
  const [secondaryColour, setSecondaryColour] = useState('#ffffff');
  const [primarySwatches, setPrimarySwatches] = useState<string[]>(['#000000']);
  const [secondarySwatches, setSecondarySwatches] = useState<string[]>(['#ffffff']);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [ethos, setEthos] = useState('');
  const [badgeScale, setBadgeScale] = useState(1);
  const [badgeOffsetX, setBadgeOffsetX] = useState(0);
  const [badgeOffsetY, setBadgeOffsetY] = useState(0);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [badge, setBadge] = useState<BadgeState>({ file: null, previewUrl: null, name: '', sizeLabel: '', isValid: false });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const welcomeCount = useMemo(() => welcomeMessage.length, [welcomeMessage]);
  const ethosCount = useMemo(() => ethos.length, [ethos]);
  const badgeDisplaySize = BADGE_BASE_SIZE * badgeScale;

  const upsertSwatch = useCallback((value: string, swatches: string[]): string[] => {
    const normalised = value.toLowerCase();
    return [normalised, ...swatches.filter((item) => item.toLowerCase() !== normalised)].slice(0, 5);
  }, []);

  const setPrimaryWithHistory = useCallback((value: string) => {
    setPrimaryColour(value);
    setPrimarySwatches((current) => upsertSwatch(value, current));
  }, [upsertSwatch]);

  const setSecondaryWithHistory = useCallback((value: string) => {
    setSecondaryColour(value);
    setSecondarySwatches((current) => upsertSwatch(value, current));
  }, [upsertSwatch]);

  const constrainOffset = useCallback((nextX: number, nextY: number, scale: number) => {
    const frame = badgeFrameRef.current;
    if (!frame) {
      return { x: nextX, y: nextY };
    }

    const halfFrameWidth = frame.clientWidth / 2;
    const halfFrameHeight = frame.clientHeight / 2;
    const halfBadge = (BADGE_BASE_SIZE * scale) / 2;
    const maxX = Math.max(0, halfFrameWidth - halfBadge);
    const maxY = Math.max(0, halfFrameHeight - halfBadge);

    return {
      x: Math.min(maxX, Math.max(-maxX, nextX)),
      y: Math.min(maxY, Math.max(-maxY, nextY))
    };
  }, []);

  const processBadgeFile = useCallback((file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Badge must be a PNG, JPEG, SVG, or WEBP image.');
      return;
    }

    if (file.size > MAX_BADGE_SIZE_BYTES) {
      setError('Badge file size must be 5MB or less.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setBadge({
        file,
        previewUrl: typeof reader.result === 'string' ? reader.result : null,
        name: file.name,
        sizeLabel: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        isValid: true
      });
      setBadgeScale(1);
      setBadgeOffsetX(0);
      setBadgeOffsetY(0);
      setError(null);
    };

    reader.onerror = () => {
      setError('Could not read badge file. Please try again.');
    };

    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processBadgeFile(file);
    }
  }, [processBadgeFile]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processBadgeFile(file);
    }
  }, [processBadgeFile]);

  const beginDrag = useCallback((clientX: number, clientY: number) => {
    const frame = badgeFrameRef.current;
    if (!frame || !badge.previewUrl) {
      return;
    }

    const rect = frame.getBoundingClientRect();
    const pointerX = clientX - rect.left;
    const pointerY = clientY - rect.top;
    const badgeCenterX = rect.width / 2 + badgeOffsetX;
    const badgeCenterY = rect.height / 2 + badgeOffsetY;

    setDragState({
      pointerOffsetX: pointerX - badgeCenterX,
      pointerOffsetY: pointerY - badgeCenterY
    });
  }, [badge.previewUrl, badgeOffsetX, badgeOffsetY]);

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    const frame = badgeFrameRef.current;
    if (!frame || !dragState) {
      return;
    }

    const rect = frame.getBoundingClientRect();
    const pointerX = clientX - rect.left;
    const pointerY = clientY - rect.top;
    const nextCenterX = pointerX - dragState.pointerOffsetX;
    const nextCenterY = pointerY - dragState.pointerOffsetY;
    const rawOffsetX = nextCenterX - rect.width / 2;
    const rawOffsetY = nextCenterY - rect.height / 2;
    const constrained = constrainOffset(rawOffsetX, rawOffsetY, badgeScale);

    setBadgeOffsetX(constrained.x);
    setBadgeOffsetY(constrained.y);
  }, [badgeScale, constrainOffset, dragState]);

  const resetBadgeTransform = useCallback(() => {
    setBadgeScale(1);
    setBadgeOffsetX(0);
    setBadgeOffsetY(0);
  }, []);

  const handleEyedrop = useCallback(async (target: 'primary' | 'secondary') => {
    if (typeof window === 'undefined' || !window.EyeDropper) {
      setError('Use the colour picker or try Chrome for eyedropper support');
      return;
    }

    try {
      const eyedropper = new window.EyeDropper();
      const { sRGBHex } = await eyedropper.open();
      if (target === 'primary') {
        setPrimaryWithHistory(sRGBHex);
      } else {
        setSecondaryWithHistory(sRGBHex);
      }
      setError(null);
    } catch {
      // User cancelled eyedropper; no action needed.
    }
  }, [setPrimaryWithHistory, setSecondaryWithHistory]);

  const handleClubNameChange = (value: string) => {
    setClubName(value);
    setSlug(toSlug(value));
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!clubName.trim()) {
      setError('Club name is required.');
      return;
    }

    if (!slug.trim()) {
      setError('Club slug is required.');
      return;
    }

    if (!badge.file || !badge.isValid) {
      setError('A valid badge image is required.');
      return;
    }

    setIsSubmitting(true);

    const supabase = createClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setIsSubmitting(false);
      setError('Could not verify your account. Please log in again.');
      return;
    }

    try {
      const badgeUrl = await uploadClubBadge(badge.file, slug);

      const { data: clubRow, error: clubError } = await supabase
        .from('clubs')
        .insert({
          name: clubName.trim(),
          slug,
          badge_url: badgeUrl,
          badge_scale: badgeScale,
          badge_offset_x: Math.round(badgeOffsetX),
          badge_offset_y: Math.round(badgeOffsetY),
          primary_colour: primaryColour,
          secondary_colour: secondaryColour,
          welcome_message: welcomeMessage.trim() || null,
          ethos: ethos.trim() || null,
          is_active: true
        })
        .select('id')
        .single<{ id: string }>();

      if (clubError || !clubRow) {
        throw new Error(clubError?.message ?? 'Could not create club.');
      }

      const { error: membershipError } = await supabase.from('club_members').insert({
        club_id: clubRow.id,
        user_id: user.id,
        club_role: 'admin',
        is_active: true
      });

      if (membershipError) {
        throw new Error(membershipError.message);
      }

      setIsSuccess(true);
      router.push('/dashboard/club');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Onboarding failed. Please try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Launch your club</h1>
        <p className="mt-2 text-slate-300">Set up your identity once. Coaches and parents will see this everywhere.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl backdrop-blur">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Club Name</h2>
            <input value={clubName} onChange={(e) => handleClubNameChange(e.target.value)} required className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3" placeholder="Enter your club name" />
            <p className="text-sm text-slate-300">Your club URL: shiftos.club/{slug || 'your-club-slug'}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Badge Upload</h2>
            <label onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-600 bg-slate-950/70 p-8 text-center transition hover:border-blue-400">
              <input type="file" accept={ACCEPTED_TYPES.join(',')} onChange={handleFileChange} className="hidden" />
              <p className="text-base font-medium">Click to upload or drag & drop</p>
              <p className="mt-1 text-sm text-slate-400">PNG, JPEG, SVG or WEBP up to 5MB</p>
            </label>
            {badge.name && (
              <div className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm">
                <p className="font-medium">{badge.name}</p>
                <p className="text-slate-400">{badge.sizeLabel}</p>
                {badge.isValid && <p className="mt-1 text-emerald-400">✓ File ready</p>}
              </div>
            )}
            {badge.previewUrl && (
              <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-950 p-3">
                <div
                  ref={badgeFrameRef}
                  className="relative mx-auto h-44 w-44 overflow-hidden rounded-full border border-slate-500 bg-slate-800 touch-none"
                  onMouseDown={(e) => beginDrag(e.clientX, e.clientY)}
                  onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
                  onMouseUp={() => setDragState(null)}
                  onMouseLeave={() => setDragState(null)}
                  onTouchStart={(e) => beginDrag(e.touches[0].clientX, e.touches[0].clientY)}
                  onTouchMove={(e) => {
                    moveDrag(e.touches[0].clientX, e.touches[0].clientY);
                  }}
                  onTouchEnd={() => setDragState(null)}
                >
                  <img
                    src={badge.previewUrl}
                    alt="Badge transform preview"
                    className="absolute left-1/2 top-1/2 select-none object-cover"
                    draggable={false}
                    style={{
                      width: `${badgeDisplaySize}px`,
                      height: `${badgeDisplaySize}px`,
                      transform: `translate(calc(-50% + ${badgeOffsetX}px), calc(-50% + ${badgeOffsetY}px))`
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Size</label>
                  <input
                    type="range"
                    min={50}
                    max={150}
                    value={Math.round(badgeScale * 100)}
                    onChange={(e) => {
                      const nextScale = Number(e.target.value) / 100;
                      setBadgeScale(nextScale);
                      const constrained = constrainOffset(badgeOffsetX, badgeOffsetY, nextScale);
                      setBadgeOffsetX(constrained.x);
                      setBadgeOffsetY(constrained.y);
                    }}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-400">{Math.round(badgeScale * 100)}%</p>
                </div>
                <button type="button" onClick={resetBadgeTransform} className="text-xs text-slate-300 underline decoration-slate-500 underline-offset-2 hover:text-white">
                  Reset position &amp; size
                </button>
              </div>
            )}
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Primary Club Colour</label>
              <div className="flex items-center gap-2">
                <input type="color" value={primaryColour} onChange={(e) => setPrimaryWithHistory(e.target.value)} className="h-12 w-full rounded-lg border border-slate-700 bg-slate-950 p-1" />
                <button type="button" onClick={() => void handleEyedrop('primary')} title="Use the colour picker or try Chrome for eyedropper support" className="whitespace-nowrap rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:border-blue-400">
                  Pick from badge 🎨
                </button>
              </div>
              <div className="flex gap-2">
                {primarySwatches.map((swatch) => (
                  <button key={swatch} type="button" onClick={() => setPrimaryWithHistory(swatch)} className="h-6 w-6 rounded-full border border-slate-500" style={{ backgroundColor: swatch }} aria-label={`Apply ${swatch}`} />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Secondary Club Colour</label>
              <div className="flex items-center gap-2">
                <input type="color" value={secondaryColour} onChange={(e) => setSecondaryWithHistory(e.target.value)} className="h-12 w-full rounded-lg border border-slate-700 bg-slate-950 p-1" />
                <button type="button" onClick={() => void handleEyedrop('secondary')} title="Use the colour picker or try Chrome for eyedropper support" className="whitespace-nowrap rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:border-blue-400">
                  Pick from badge 🎨
                </button>
              </div>
              <div className="flex gap-2">
                {secondarySwatches.map((swatch) => (
                  <button key={swatch} type="button" onClick={() => setSecondaryWithHistory(swatch)} className="h-6 w-6 rounded-full border border-slate-500" style={{ backgroundColor: swatch }} aria-label={`Apply ${swatch}`} />
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <label className="text-sm font-medium">Welcome Message</label>
            <textarea value={welcomeMessage} maxLength={300} onChange={(e) => setWelcomeMessage(e.target.value)} placeholder="Write a welcome message for your coaches and parents..." className="h-28 w-full rounded-lg border border-slate-700 bg-slate-950 p-3" />
            <p className="text-right text-xs text-slate-400">{welcomeCount}/300</p>
          </section>

          <section className="space-y-2">
            <label className="text-sm font-medium">Club Ethos</label>
            <textarea value={ethos} maxLength={500} onChange={(e) => setEthos(e.target.value)} placeholder="What does your club stand for? Share your values..." className="h-32 w-full rounded-lg border border-slate-700 bg-slate-950 p-3" />
            <p className="text-right text-xs text-slate-400">{ethosCount}/500</p>
          </section>

          {error && <p className="rounded-lg border border-red-700 bg-red-950/30 p-3 text-sm text-red-300">{error}</p>}
          {isSuccess && <p className="rounded-lg border border-emerald-700 bg-emerald-950/30 p-3 text-sm text-emerald-300">Club created! Redirecting...</p>}

          <button disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-base font-semibold transition hover:bg-blue-500 disabled:opacity-70">
            {isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />}
            {isSubmitting ? 'Launching...' : 'Launch My Club →'}
          </button>
        </form>

        <aside className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl backdrop-blur">
          <p className="text-sm font-medium text-slate-300">Live preview — this is how your club will appear</p>
          <div className="mt-4 rounded-xl border border-slate-700 p-6 transition-all duration-300" style={{ backgroundColor: secondaryColour }}>
            <div className="mb-4 h-1.5 w-24 rounded-full" style={{ backgroundColor: primaryColour }} />
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-slate-500 bg-slate-800">
              {badge.previewUrl ? (
                <img
                  src={badge.previewUrl}
                  alt="Club badge preview"
                  className="absolute left-1/2 top-1/2 object-cover"
                  style={{
                    width: `${badgeDisplaySize}px`,
                    height: `${badgeDisplaySize}px`,
                    transform: `translate(calc(-50% + ${badgeOffsetX}px), calc(-50% + ${badgeOffsetY}px))`
                  }}
                />
              ) : (
                <span className="text-3xl">🛡️</span>
              )}
            </div>
            <h3 className="mt-4 text-center text-2xl font-bold" style={{ color: primaryColour }}>{clubName || 'Your Club Name'}</h3>
            <p className="mt-3 text-center text-sm text-slate-700">{welcomeMessage || 'Welcome message will appear here.'}</p>
          </div>
        </aside>
      </div>
    </main>
  );
}

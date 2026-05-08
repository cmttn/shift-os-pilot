'use client';

import { ChangeEvent, FormEvent, useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

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
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'svg'];
const MAX_BADGE_SIZE_BYTES = 5 * 1024 * 1024;
const PREVIEW_SIZE = 280;

export default function OnboardingPage() {
  const router = useRouter();
  const badgeFrameRef = useRef<HTMLDivElement | null>(null);
  const [clubName, setClubName] = useState('');
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
  const [noBadge, setNoBadge] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const welcomeCount = useMemo(() => welcomeMessage.length, [welcomeMessage]);
  const ethosCount = useMemo(() => ethos.length, [ethos]);
  const generatedSlug = clubName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

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
    const maxOffset = (PREVIEW_SIZE * Math.max(0, scale - 1)) / 2;
    return {
      x: Math.min(maxOffset, Math.max(-maxOffset, nextX)),
      y: Math.min(maxOffset, Math.max(-maxOffset, nextY))
    };
  }, []);

  const clearBadge = useCallback(() => {
    setBadge({ file: null, previewUrl: null, name: '', sizeLabel: '', isValid: false });
    setBadgeScale(1);
    setBadgeOffsetX(0);
    setBadgeOffsetY(0);
    setDragState(null);
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
      setNoBadge(false);
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

  const handleNoBadge = useCallback(() => {
    clearBadge();
    setNoBadge(true);
    setError(null);
  }, [clearBadge]);

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
    setDragState({ pointerOffsetX: pointerX - badgeCenterX, pointerOffsetY: pointerY - badgeCenterY });
  }, [badge.previewUrl, badgeOffsetX, badgeOffsetY]);

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    const frame = badgeFrameRef.current;
    if (!frame || !dragState || !badge.previewUrl) {
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
  }, [badge.previewUrl, badgeScale, constrainOffset, dragState]);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedClubName = clubName.trim();
    if (!trimmedClubName) {
      setError('Club name is required.');
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setIsSubmitting(false);
      setError('Could not verify your account. Please log in again.');
      return;
    }

    try {
      let badgeUrl: string | null = null;
      if (!noBadge && badge.file && badge.isValid) {
        const slug = generatedSlug || user.id;
        const extFromName = badge.file.name.split('.').pop()?.toLowerCase() || 'png';
        const ext = ALLOWED_EXTENSIONS.includes(extFromName) ? extFromName : 'png';
        const filePath = `clubs/${slug}/badge.${ext}`;
        const { error: uploadError } = await supabase.storage.from('club-assets').upload(filePath, badge.file, { cacheControl: '3600', upsert: true });

        if (uploadError) {
          console.error('Badge upload failed:', uploadError);
          setError(`Badge upload failed: ${uploadError.message}`);
          setIsSubmitting(false);
          return;
        }

        const { data: urlData } = supabase.storage.from('club-assets').getPublicUrl(filePath);
        badgeUrl = urlData.publicUrl;
      }

      const { data: clubRow, error: clubError } = await supabase.from('clubs').insert({
        name: trimmedClubName,
        slug: generatedSlug || user.id,
        badge_url: noBadge ? null : badgeUrl,
        badge_scale: badgeScale,
        badge_offset_x: Math.round(badgeOffsetX),
        badge_offset_y: Math.round(badgeOffsetY),
        primary_colour: primaryColour,
        secondary_colour: secondaryColour,
        welcome_message: welcomeMessage.trim() || null,
        ethos: ethos.trim() || null,
        is_active: true
      }).select('id').single<{ id: string }>();

      if (clubError || !clubRow) {
        throw new Error(clubError?.message ?? 'Could not create club.');
      }

      const { error: membershipError } = await supabase.from('club_members').insert({ club_id: clubRow.id, user_id: user.id, club_role: 'admin', is_active: true });
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
      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <section className="space-y-2"><h2 className="text-lg font-semibold">Club Name</h2><input value={clubName} onChange={(e)=>setClubName(e.target.value)} required className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3" /></section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Badge Upload</h2>
            {!badge.previewUrl && !noBadge && <label onDrop={handleDrop} onDragOver={(e)=>e.preventDefault()} className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-600 bg-slate-950/70 p-8 text-center"><input type="file" accept={ACCEPTED_TYPES.join(',')} onChange={handleFileChange} className="hidden" /><p>Click to upload or drag & drop</p></label>}
            {badge.previewUrl && <div className="space-y-3"><div ref={badgeFrameRef} className="relative mx-auto h-[280px] w-[280px] overflow-hidden rounded-xl border border-slate-500 bg-slate-800" onMouseDown={(e)=>beginDrag(e.clientX,e.clientY)} onMouseMove={(e)=>moveDrag(e.clientX,e.clientY)} onMouseUp={()=>setDragState(null)} onMouseLeave={()=>setDragState(null)}><img src={badge.previewUrl} alt="Badge" className="absolute left-1/2 top-1/2 h-full w-full object-contain" draggable={false} style={{transform:`translate(calc(-50% + ${badgeOffsetX}px), calc(-50% + ${badgeOffsetY}px)) scale(${badgeScale})`}}/></div><input type="range" min={50} max={200} value={Math.round(badgeScale*100)} onChange={(e)=>{const s=Number(e.target.value)/100;const c=constrainOffset(badgeOffsetX,badgeOffsetY,s);setBadgeScale(s);setBadgeOffsetX(c.x);setBadgeOffsetY(c.y);}} className="w-full" /><button type="button" onClick={clearBadge} className="text-sm text-red-400">✕ Remove badge</button></div>}
            <button type="button" onClick={handleNoBadge} className="text-sm underline">Continue without badge →</button>
          </section>
          <section className="grid gap-4 sm:grid-cols-2"><input type="color" value={primaryColour} onChange={(e)=>setPrimaryWithHistory(e.target.value)} className="h-12 w-full"/><input type="color" value={secondaryColour} onChange={(e)=>setSecondaryWithHistory(e.target.value)} className="h-12 w-full"/></section>
          <textarea value={welcomeMessage} maxLength={300} onChange={(e)=>setWelcomeMessage(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3" />
          <textarea value={ethos} maxLength={500} onChange={(e)=>setEthos(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3" />
          {error && <p className="rounded-lg border border-red-700 bg-red-950/30 p-3 text-sm text-red-300">{error}</p>}
          {isSuccess && <p className="rounded-lg border border-emerald-700 bg-emerald-950/30 p-3 text-sm text-emerald-300">Club created! Redirecting...</p>}
          <button disabled={isSubmitting} className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold">{isSubmitting ? 'Launching...' : 'Launch My Club →'}</button>
        </div>
        <aside className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="mt-4 rounded-xl border border-slate-700 p-6" style={{ backgroundColor: secondaryColour }}>
            {badge.previewUrl ? <div className="relative mx-auto h-[280px] w-[280px] overflow-hidden rounded-xl border border-slate-500 bg-slate-800"><img src={badge.previewUrl} alt="Club badge preview" className="absolute left-1/2 top-1/2 h-full w-full object-contain" style={{transform:`translate(calc(-50% + ${badgeOffsetX}px), calc(-50% + ${badgeOffsetY}px)) scale(${badgeScale})`}}/></div> : noBadge ? <div className="mx-auto flex h-[280px] w-[280px] items-center justify-center rounded-xl text-center text-4xl font-bold" style={{color:primaryColour, backgroundColor:secondaryColour}}>{clubName || 'Your Club Name'}</div> : <div className="mx-auto flex h-[280px] w-[280px] items-center justify-center rounded-xl border-2 border-dashed border-slate-500 text-center text-slate-400">🛡️ Your club identity will appear here</div>}
            {noBadge && <p className="mt-3 text-center text-sm text-slate-700">No badge selected — your club name will be used as your identity</p>}
          </div>
        </aside>
      </form>
    </main>
  );
}

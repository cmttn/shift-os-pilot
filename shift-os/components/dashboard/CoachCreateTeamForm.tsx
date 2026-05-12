'use client';

import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { generateJoinCode } from '@/lib/utils/generateJoinCode';

type Gender = 'boys' | 'girls' | 'mixed';

interface CoachCreateTeamFormProps {
  userId: string;
}

interface InsertedClub {
  id: string;
}

interface InsertedTeam {
  id: string;
}

const ageGroups = ['U6', 'U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15', 'U16', 'U17', 'U18', 'Open Age', 'Veterans'];
const acceptedBadgeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
const maxBadgeBytes = 5 * 1024 * 1024;
const colourBucketSize = 32;

interface ColourBucket {
  count: number;
  red: number;
  green: number;
  blue: number;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function componentToHex(value: number): string {
  return value.toString(16).padStart(2, '0');
}

function rgbToHex(red: number, green: number, blue: number): string {
  return `#${componentToHex(red)}${componentToHex(green)}${componentToHex(blue)}`;
}

function getColourScore(red: number, green: number, blue: number): number {
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const saturation = max - min;
  const brightness = (red + green + blue) / 3;
  const balancedBrightness = 255 - Math.abs(145 - brightness);
  return saturation * 1.6 + balancedBrightness * 0.4;
}

async function extractColoursFromImage(imageUrl: string): Promise<string[]> {
  const image = new Image();
  image.decoding = 'async';
  image.src = imageUrl;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Could not read colours from that badge.'));
  });

  const canvas = document.createElement('canvas');
  const size = 96;
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Your browser could not sample the badge colours.');

  context.drawImage(image, 0, 0, size, size);
  const pixels = context.getImageData(0, 0, size, size).data;
  const buckets = new Map<string, ColourBucket>();

  for (let index = 0; index < pixels.length; index += 16) {
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const alpha = pixels[index + 3];
    if (alpha < 160) continue;

    const brightness = (red + green + blue) / 3;
    const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);
    if (brightness < 24 || brightness > 238 || saturation < 18) continue;

    const bucketRed = Math.round(red / colourBucketSize) * colourBucketSize;
    const bucketGreen = Math.round(green / colourBucketSize) * colourBucketSize;
    const bucketBlue = Math.round(blue / colourBucketSize) * colourBucketSize;
    const key = `${bucketRed}-${bucketGreen}-${bucketBlue}`;
    const current = buckets.get(key) ?? { count: 0, red: 0, green: 0, blue: 0 };
    current.count += 1;
    current.red += red;
    current.green += green;
    current.blue += blue;
    buckets.set(key, current);
  }

  return Array.from(buckets.values())
    .map((bucket) => {
      const red = Math.round(bucket.red / bucket.count);
      const green = Math.round(bucket.green / bucket.count);
      const blue = Math.round(bucket.blue / bucket.count);
      return {
        hex: rgbToHex(red, green, blue),
        score: bucket.count * getColourScore(red, green, blue)
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((colour) => colour.hex)
    .filter((colour, index, allColours) => allColours.indexOf(colour) === index)
    .slice(0, 6);
}

export default function CoachCreateTeamForm({ userId }: CoachCreateTeamFormProps) {
  const router = useRouter();
  const [clubName, setClubName] = useState('');
  const [motto, setMotto] = useState('');
  const [primaryColour, setPrimaryColour] = useState('#38bdf8');
  const [secondaryColour, setSecondaryColour] = useState('#6366f1');
  const [extractedColours, setExtractedColours] = useState<string[]>([]);
  const [extractingColours, setExtractingColours] = useState(false);
  const [badgeFile, setBadgeFile] = useState<File | null>(null);
  const [badgePreview, setBadgePreview] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [gender, setGender] = useState<Gender>('boys');
  const [league, setLeague] = useState('');
  const [season, setSeason] = useState('2025-26');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const slug = useMemo(() => slugify(clubName || teamName), [clubName, teamName]);

  function handleBadgeChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    if (!acceptedBadgeTypes.includes(file.type)) {
      setError('Please upload PNG, JPG, WEBP, or SVG only.');
      return;
    }
    if (file.size > maxBadgeBytes) {
      setError('Badge file must be 5MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      setBadgeFile(file);
      setBadgePreview(result);
      setExtractedColours([]);
      setError('');
    };
    reader.onerror = () => setError('Unable to read that badge file. Try another image.');
    reader.readAsDataURL(file);
  }

  async function handleGrabColours() {
    if (!badgePreview) {
      setError('Upload a badge first, then grab its colours.');
      return;
    }

    setExtractingColours(true);
    setError('');
    try {
      const colours = await extractColoursFromImage(badgePreview);
      if (colours.length === 0) {
        setError('No strong badge colours were found. Try a clearer badge or choose colours manually.');
        return;
      }
      setExtractedColours(colours);
      setPrimaryColour(colours[0]);
      setSecondaryColour(colours[1] ?? colours[0]);
    } catch (colourError) {
      setError(colourError instanceof Error ? colourError.message : 'Unable to grab colours from that badge.');
    } finally {
      setExtractingColours(false);
    }
  }

  async function uploadBadge(supabase: ReturnType<typeof createClient>, clubSlug: string): Promise<string | null> {
    if (!badgeFile) return null;
    const extension = badgeFile.name.split('.').pop()?.toLowerCase() ?? 'png';
    const path = `coach-clubs/${clubSlug || userId}/badge.${extension}`;
    const { error: uploadError } = await supabase.storage.from('club-assets').upload(path, badgeFile, { cacheControl: '3600', upsert: true });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('club-assets').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clubName.trim() || !teamName.trim() || !ageGroup) {
      setError('Club identity, team name and age group are required.');
      return;
    }

    setLoading(true);
    setError('');
    const supabase = createClient();

    try {
      const clubSlug = slug || userId;
      const badgeUrl = await uploadBadge(supabase, clubSlug);
      const { data: club, error: clubError } = await supabase
        .from('clubs')
        .insert({
          name: clubName.trim(),
          slug: clubSlug,
          badge_url: badgeUrl,
          primary_colour: primaryColour,
          secondary_colour: secondaryColour,
          ethos: motto.trim() || null,
          plan_tier: 'free',
          is_active: true
        })
        .select('id')
        .single<InsertedClub>();

      if (clubError || !club) throw new Error(clubError?.message ?? 'Club identity could not be created.');

      const { error: memberError } = await supabase.from('club_members').insert({
        club_id: club.id,
        user_id: userId,
        club_role: 'coach',
        is_active: true
      });
      if (memberError) throw memberError;

      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          club_id: club.id,
          name: teamName.trim(),
          age_group: ageGroup,
          gender,
          league: league.trim() || null,
          season: season.trim() || null,
          join_code: generateJoinCode(),
          is_active: true
        })
        .select('id')
        .single<InsertedTeam>();

      if (teamError || !team) throw new Error(teamError?.message ?? 'Team could not be created.');

      const { error: coachError } = await supabase.from('team_coaches').insert({ team_id: team.id, user_id: userId, is_lead: true });
      if (coachError) throw coachError;

      router.push('/dashboard/coach');
      router.refresh();
    } catch (submitError) {
      setLoading(false);
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong while creating your team.');
    }
  }

  const inputClass = 'w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/70 placeholder:text-slate-500';

  return (
    <form onSubmit={handleSubmit} className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-2xl border border-white/12 bg-white/5 p-6 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.95)] backdrop-blur-md md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300/80">Identity</p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-50">Build your team identity</h2>

        <div className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Club or coaching name</label>
            <input value={clubName} onChange={(event) => setClubName(event.target.value)} className={inputClass} placeholder="e.g. Northside Juniors" />
            <p className="mt-2 text-xs text-slate-500">Workspace ID: {slug || 'your-team-identity'}</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Club or team motto</label>
            <textarea
              value={motto}
              maxLength={180}
              onChange={(event) => setMotto(event.target.value)}
              className={`${inputClass} min-h-24 resize-none`}
              placeholder="e.g. Play brave. Work together. Enjoy every moment."
            />
            <p className="mt-2 text-right text-xs text-slate-500">{motto.length}/180</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Badge upload</label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 px-4 py-8 text-center text-sm text-slate-300 transition hover:border-sky-300/50 hover:bg-white/[0.04]">
              <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.webp,.svg" onChange={handleBadgeChange} />
              <span className="font-medium">Click to upload your badge</span>
              <span className="mt-1 text-xs text-slate-500">PNG, JPG, WEBP, SVG / max 5MB</span>
            </label>
            <button
              type="button"
              disabled={!badgePreview || extractingColours}
              onClick={handleGrabColours}
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-sky-300/25 bg-sky-300/10 px-4 py-3 text-sm font-semibold text-sky-100 transition hover:border-sky-200/50 hover:bg-sky-300/15 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {extractingColours ? 'Reading badge colours...' : 'Grab colours from badge'}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Primary colour</label>
              <input type="color" value={primaryColour} onChange={(event) => setPrimaryColour(event.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 p-1" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Secondary colour</label>
              <input type="color" value={secondaryColour} onChange={(event) => setSecondaryColour(event.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 p-1" />
            </div>
          </div>

          {extractedColours.length > 0 ? (
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Badge colours</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {extractedColours.map((colour) => (
                  <div key={colour} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <span className="flex items-center gap-3 text-xs font-mono text-slate-300">
                      <span className="h-8 w-8 rounded-full border border-white/20" style={{ backgroundColor: colour }} />
                      {colour.toUpperCase()}
                    </span>
                    <span className="flex gap-2">
                      <button type="button" onClick={() => setPrimaryColour(colour)} className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-semibold text-white/70 transition hover:bg-white/10">P</button>
                      <button type="button" onClick={() => setSecondaryColour(colour)} className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-semibold text-white/70 transition hover:bg-white/10">S</button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="h-px bg-white/10" />

          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300/80">Team</p>
          <input value={teamName} onChange={(event) => setTeamName(event.target.value)} className={inputClass} placeholder="Team name, e.g. U8 Reds" />
          <select value={ageGroup} onChange={(event) => setAgeGroup(event.target.value)} className={inputClass}>
            <option value="" className="bg-slate-950">Age group</option>
            {ageGroups.map((group) => <option key={group} value={group} className="bg-slate-950">{group}</option>)}
          </select>
          <div className="grid grid-cols-3 gap-2">
            {(['boys', 'girls', 'mixed'] as Gender[]).map((option) => (
              <button key={option} type="button" onClick={() => setGender(option)} className="rounded-full border px-4 py-3 text-sm font-semibold capitalize transition-all duration-300 ease-out" style={gender === option ? { backgroundColor: primaryColour, borderColor: primaryColour, color: '#020617' } : { borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(226,232,240,0.72)' }}>
                {option}
              </button>
            ))}
          </div>
          <input value={league} onChange={(event) => setLeague(event.target.value)} className={inputClass} placeholder="League (optional)" />
          <input value={season} onChange={(event) => setSeason(event.target.value)} className={inputClass} placeholder="Season" />
        </div>

        {error ? <p className="mt-5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
        <button disabled={loading} type="submit" className="mt-8 w-full rounded-xl px-6 py-4 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${primaryColour}, ${secondaryColour})` }}>
          {loading ? 'Creating workspace...' : 'Create my team →'}
        </button>
      </section>

      <aside className="rounded-2xl border border-white/12 bg-white/5 p-6 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.95)] backdrop-blur-md lg:sticky lg:top-8 lg:h-fit">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Preview</p>
        <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/70 p-5">
          <div className="flex items-center gap-4">
            {badgePreview ? (
              <img src={badgePreview} alt="Badge preview" className="h-20 w-20 rounded-2xl object-cover" />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-2xl text-xl font-black text-slate-950" style={{ background: `linear-gradient(135deg, ${primaryColour}, ${secondaryColour})` }}>
                {(clubName || teamName || 'SO').slice(0, 2).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold text-white">{clubName || 'Your identity'}</p>
              <p className="mt-1 truncate text-sm text-slate-400">{teamName || 'Your team'} {ageGroup ? ` / ${ageGroup}` : ''}</p>
            </div>
          </div>
          <div className="mt-6 h-2 rounded-full" style={{ background: `linear-gradient(90deg, ${primaryColour}, ${secondaryColour})` }} />
          <p className="mt-5 text-sm leading-relaxed text-slate-400">{motto || 'This identity will drive your coach pages, club badge, and team colour accents.'}</p>
        </div>
      </aside>
    </form>
  );
}

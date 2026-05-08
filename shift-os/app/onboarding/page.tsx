'use client'

import { ChangeEvent, FormEvent, MouseEvent, TouchEvent, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface EyeDropper {
  open(): Promise<{ sRGBHex: string }>
}

declare global {
  interface Window {
    EyeDropper?: new () => EyeDropper
  }
}

interface FormState {
  clubName: string
  slug: string
  primaryColour: string
  secondaryColour: string
  welcomeMessage: string
  ethos: string
  badgeFile: File | null
  badgePreview: string | null
  noBadge: boolean
  scale: number
  offsetX: number
  offsetY: number
  primarySwatches: string[]
  secondarySwatches: string[]
  loading: boolean
  error: string | null
}

interface DragState {
  pointerOffsetX: number
  pointerOffsetY: number
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024
const PREVIEW_SIZE = 280
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']

const initialState: FormState = {
  clubName: '',
  slug: '',
  primaryColour: '#000000',
  secondaryColour: '#ffffff',
  welcomeMessage: '',
  ethos: '',
  badgeFile: null,
  badgePreview: null,
  noBadge: false,
  scale: 100,
  offsetX: 0,
  offsetY: 0,
  primarySwatches: ['#000000'],
  secondarySwatches: ['#ffffff'],
  loading: false,
  error: null
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function OnboardingPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(initialState)
  const [drag, setDrag] = useState<DragState | null>(null)
  const badgeFrameRef = useRef<HTMLDivElement | null>(null)

  const welcomeCount = useMemo(() => form.welcomeMessage.length, [form.welcomeMessage])
  const ethosCount = useMemo(() => form.ethos.length, [form.ethos])

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const pushSwatch = (swatches: string[], next: string): string[] => {
    const normalized = next.toLowerCase()
    return [normalized, ...swatches.filter((swatch) => swatch !== normalized)].slice(0, 5)
  }

  const resetBadge = () => {
    setForm((prev) => ({ ...prev, badgeFile: null, badgePreview: null, scale: 100, offsetX: 0, offsetY: 0 }))
    setDrag(null)
  }

  const processFile = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setField('error', 'Please upload PNG, JPG, WEBP, or SVG only.')
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      setField('error', 'File must be 5MB or smaller.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const preview = typeof reader.result === 'string' ? reader.result : null
      setForm((prev) => ({ ...prev, badgeFile: file, badgePreview: preview, noBadge: false, scale: 100, offsetX: 0, offsetY: 0, error: null }))
    }
    reader.onerror = () => setField('error', 'Unable to read file. Try again.')
    reader.readAsDataURL(file)
  }

  const handleClubNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextName = event.target.value
    setForm((prev) => ({ ...prev, clubName: nextName, slug: slugify(nextName) }))
  }

  const handleDragStart = (clientX: number, clientY: number) => {
    if (!form.badgePreview || !badgeFrameRef.current) return
    const rect = badgeFrameRef.current.getBoundingClientRect()
    const pointerX = clientX - rect.left
    const pointerY = clientY - rect.top
    setDrag({ pointerOffsetX: pointerX - (rect.width / 2 + form.offsetX), pointerOffsetY: pointerY - (rect.height / 2 + form.offsetY) })
  }

  const maxOffset = ((form.scale - 100) / 100) * (PREVIEW_SIZE / 2)

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!drag || !badgeFrameRef.current) return
    const rect = badgeFrameRef.current.getBoundingClientRect()
    const pointerX = clientX - rect.left
    const pointerY = clientY - rect.top
    const rawX = pointerX - drag.pointerOffsetX - rect.width / 2
    const rawY = pointerY - drag.pointerOffsetY - rect.height / 2
    setForm((prev) => ({
      ...prev,
      offsetX: Math.max(-maxOffset, Math.min(maxOffset, rawX)),
      offsetY: Math.max(-maxOffset, Math.min(maxOffset, rawY))
    }))
  }

  const eyedrop = async (target: 'primary' | 'secondary') => {
    if (!window.EyeDropper) {
      setField('error', 'Use Chrome for eyedropper support')
      return
    }
    try {
      const picked = await new window.EyeDropper().open()
      setForm((prev) =>
        target === 'primary'
          ? { ...prev, primaryColour: picked.sRGBHex, primarySwatches: pushSwatch(prev.primarySwatches, picked.sRGBHex), error: null }
          : { ...prev, secondaryColour: picked.sRGBHex, secondarySwatches: pushSwatch(prev.secondarySwatches, picked.sRGBHex), error: null }
      )
    } catch {
      // cancelled by user
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.clubName.trim()) {
      setField('error', 'Club name is required.')
      return
    }

    setForm((prev) => ({ ...prev, loading: true, error: null }))
    const supabase = createClient()

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData.user) throw new Error('Could not verify your account. Please sign in again.')

      let badgeUrl: string | null = null
      const slug = form.slug || slugify(form.clubName) || authData.user.id

      if (form.badgeFile && !form.noBadge) {
        const extension = form.badgeFile.name.split('.').pop()?.toLowerCase() ?? 'png'
        const filePath = `clubs/${slug}/badge.${extension}`
        const { error: uploadError } = await supabase.storage.from('club-assets').upload(filePath, form.badgeFile, { cacheControl: '3600', upsert: true })
        if (uploadError) throw new Error(uploadError.message)
        const { data: publicData } = supabase.storage.from('club-assets').getPublicUrl(filePath)
        badgeUrl = publicData.publicUrl
      }

      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .insert({
          name: form.clubName.trim(),
          slug,
          badge_url: form.noBadge ? null : badgeUrl,
          primary_colour: form.primaryColour,
          secondary_colour: form.secondaryColour,
          welcome_message: form.welcomeMessage.trim() || null,
          ethos: form.ethos.trim() || null,
          plan_tier: 'free',
          is_active: true
        })
        .select('id')
        .single<{ id: string }>()

      if (clubError || !clubData) throw new Error(clubError?.message ?? 'Unable to create club.')

      const { error: memberError } = await supabase.from('club_members').insert({
        club_id: clubData.id,
        user_id: authData.user.id,
        club_role: 'admin',
        is_active: true
      })
      if (memberError) throw new Error(memberError.message)

      router.push('/dashboard/club')
      router.refresh()
    } catch (error) {
      console.error('Onboarding submission error:', error)
      setField('error', error instanceof Error ? error.message : 'Something went wrong. Please try again.')
      setField('loading', false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-2xl font-bold tracking-widest text-white">SHIFT/<span className="text-green-400">OS</span></p>
          <h1 className="mt-6 text-3xl font-bold text-white">Set up your club</h1>
          <p className="mt-2 text-gray-400">Your club. Your identity. Your platform.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <form onSubmit={handleSubmit} className="space-y-8 rounded-2xl border border-gray-800 bg-gray-900 p-8">
            <section>
              <label className="mb-2 block text-sm font-medium text-gray-300">Club Name</label>
              <input className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white" placeholder="e.g. Manchester Sports Coaching" value={form.clubName} onChange={handleClubNameChange} />
              <p className="mt-2 text-sm text-gray-400">Your club ID: {form.slug || 'your-club-id'}</p>
            </section>

            <section>
              <label className="mb-2 block text-sm font-medium text-gray-300">Badge Upload (optional)</label>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-700 bg-gray-800 px-4 py-10 text-center text-gray-300" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files?.[0]; if (file) processFile(file) }}>
                <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.webp,.svg" onChange={(e) => { const file = e.target.files?.[0]; if (file) processFile(file) }} />
                <p>Click to upload or drag and drop</p>
                <p className="mt-1 text-xs text-gray-400">PNG, JPG, WEBP, SVG — max 5MB</p>
              </label>
              {form.badgePreview && form.badgeFile && (
                <div className="mt-4 space-y-2">
                  <img src={form.badgePreview} alt="Badge preview" className="h-24 w-24 rounded-lg object-contain" />
                  <p className="text-sm text-gray-300">{form.badgeFile.name} ({(form.badgeFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                  <button type="button" onClick={resetBadge} className="text-sm text-red-400">✕ Remove badge</button>
                </div>
              )}
              <button type="button" onClick={() => { resetBadge(); setField('noBadge', true) }} className="mt-3 text-sm text-gray-300 underline">Continue without badge →</button>
            </section>

            {form.badgePreview && (
              <section>
                <label className="mb-2 block text-sm font-medium text-gray-300">Size</label>
                <input type="range" min={50} max={200} value={form.scale} onChange={(e) => setField('scale', Number(e.target.value))} className="w-full" />
                <button type="button" className="mt-2 text-sm text-gray-400" onClick={() => setForm((prev) => ({ ...prev, scale: 100, offsetX: 0, offsetY: 0 }))}>Reset position & size</button>
              </section>
            )}

            <section className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Primary Colour</label>
                <div className="flex gap-2"><input type="color" value={form.primaryColour} onChange={(e) => setForm((prev) => ({ ...prev, primaryColour: e.target.value, primarySwatches: pushSwatch(prev.primarySwatches, e.target.value) }))} /><button type="button" onClick={() => eyedrop('primary')} className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-200">Pick from badge 🎨</button></div>
                <div className="mt-2 flex gap-2">{form.primarySwatches.map((swatch) => <button key={`p-${swatch}`} type="button" onClick={() => setField('primaryColour', swatch)} className="h-6 w-6 rounded border border-gray-600" style={{ backgroundColor: swatch }} aria-label={`Use ${swatch}`} />)}</div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Secondary Colour</label>
                <div className="flex gap-2"><input type="color" value={form.secondaryColour} onChange={(e) => setForm((prev) => ({ ...prev, secondaryColour: e.target.value, secondarySwatches: pushSwatch(prev.secondarySwatches, e.target.value) }))} /><button type="button" onClick={() => eyedrop('secondary')} className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-200">Pick from badge 🎨</button></div>
                <div className="mt-2 flex gap-2">{form.secondarySwatches.map((swatch) => <button key={`s-${swatch}`} type="button" onClick={() => setField('secondaryColour', swatch)} className="h-6 w-6 rounded border border-gray-600" style={{ backgroundColor: swatch }} aria-label={`Use ${swatch}`} />)}</div>
              </div>
              {typeof window !== 'undefined' && !window.EyeDropper && <p className="text-xs text-gray-400">Use Chrome for eyedropper support</p>}
            </section>

            <section>
              <label className="mb-2 block text-sm font-medium text-gray-300">Welcome Message (optional)</label>
              <textarea maxLength={300} value={form.welcomeMessage} onChange={(e) => setField('welcomeMessage', e.target.value)} placeholder="Write a welcome message for coaches and parents..." className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white" />
              <p className="mt-2 text-right text-xs text-gray-400">{welcomeCount}/300</p>
            </section>

            <section>
              <label className="mb-2 block text-sm font-medium text-gray-300">Club Ethos (optional)</label>
              <textarea maxLength={500} value={form.ethos} onChange={(e) => setField('ethos', e.target.value)} placeholder="What does your club stand for?" className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white" />
              <p className="mt-2 text-right text-xs text-gray-400">{ethosCount}/500</p>
            </section>

            {form.error && <p className="rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-300">{form.error}</p>}
            <button disabled={form.loading} className="w-full rounded-xl py-4 text-lg font-bold text-white" style={{ backgroundColor: form.primaryColour }}>
              {form.loading ? '⏳ Launching...' : 'Launch My Club →'}
            </button>
          </form>

          <aside className="rounded-2xl border border-gray-800 bg-gray-900 p-6 lg:sticky lg:top-8 lg:h-fit">
            <h2 className="text-white">Live Preview</h2>
            <p className="mb-4 text-sm text-gray-400">This is how your club will appear to coaches and parents</p>
            <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
              {form.badgePreview ? (
                <div ref={badgeFrameRef} className="relative mx-auto h-[280px] w-[280px] overflow-hidden rounded-xl border border-gray-700" onMouseDown={(e: MouseEvent<HTMLDivElement>) => handleDragStart(e.clientX, e.clientY)} onMouseMove={(e: MouseEvent<HTMLDivElement>) => handleDragMove(e.clientX, e.clientY)} onMouseUp={() => setDrag(null)} onMouseLeave={() => setDrag(null)} onTouchStart={(e: TouchEvent<HTMLDivElement>) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY)} onTouchMove={(e: TouchEvent<HTMLDivElement>) => handleDragMove(e.touches[0].clientX, e.touches[0].clientY)} onTouchEnd={() => setDrag(null)}>
                  <img src={form.badgePreview} alt="Club badge" className="absolute left-1/2 top-1/2 h-full w-full object-contain" draggable={false} style={{ transform: `translate(calc(-50% + ${form.offsetX}px), calc(-50% + ${form.offsetY}px)) scale(${form.scale / 100})` }} />
                </div>
              ) : form.noBadge ? (
                <div className="mx-auto flex h-[280px] w-[280px] items-center justify-center rounded-xl p-4 text-center text-3xl font-bold" style={{ color: form.primaryColour, backgroundColor: form.secondaryColour }}>
                  {form.clubName || 'Your Club'}
                </div>
              ) : (
                <div className="mx-auto flex h-[280px] w-[280px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-700 text-center text-gray-400">
                  <p className="text-3xl">🛡️</p>
                  <p>Your club identity will appear here</p>
                </div>
              )}
            </div>
            <p className="mt-4 text-xl font-bold" style={{ color: form.primaryColour }}>{form.clubName || 'Your Club Name'}</p>
            <p className="mt-2 text-sm text-gray-300">{form.welcomeMessage.slice(0, 100) || 'Welcome message preview will appear here.'}</p>
          </aside>
        </div>
      </div>
    </main>
  )
}

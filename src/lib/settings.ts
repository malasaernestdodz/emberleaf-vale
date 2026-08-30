import { LITE } from './flags'

export type Quality = 'low' | 'medium' | 'high'

export type Settings = {
  master: number
  music: number
  sfx: number
  muted: boolean
  quality: Quality
  showFps: boolean
}

const KEY = 'emberleaf.settings.v1'

const defaults: Settings = {
  master: 0.8,
  music: 0.55,
  sfx: 0.9,
  muted: false,
  quality: LITE ? 'low' : 'high',
  showFps: LITE,
}

let current: Settings = { ...defaults }
const listeners = new Set<() => void>()

function clamp01(v: unknown) {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : 0
  return Math.min(1, Math.max(0, n))
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Partial<Settings>
    current = {
      master: clamp01(parsed.master ?? defaults.master),
      music: clamp01(parsed.music ?? defaults.music),
      sfx: clamp01(parsed.sfx ?? defaults.sfx),
      muted: !!parsed.muted,
      quality: (['low', 'medium', 'high'] as const).includes(parsed.quality as Quality)
        ? (parsed.quality as Quality)
        : defaults.quality,
      showFps: !!parsed.showFps,
    }
  } catch {
    current = { ...defaults }
  }
  if (LITE) {
    current.quality = 'low'
    current.showFps = true
  }
}

load()

export const settings = {
  get(): Settings {
    return current
  },
  set(patch: Partial<Settings>) {
    current = { ...current, ...patch }
    if (LITE) current.quality = 'low'
    try {
      localStorage.setItem(KEY, JSON.stringify(current))
    } catch {
      void 0
    }
    for (const fn of listeners) fn()
  },
  subscribe(fn: () => void) {
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  },
}

export const QUALITY_MAP: Record<Quality, { dpr: number; shadows: boolean; shadowSize: number; bloom: boolean; msaa: number }> = {
  low: { dpr: 1, shadows: false, shadowSize: 512, bloom: false, msaa: 0 },
  medium: { dpr: 1.25, shadows: true, shadowSize: 1024, bloom: true, msaa: 2 },
  high: { dpr: 1.75, shadows: true, shadowSize: 2048, bloom: true, msaa: 4 },
}

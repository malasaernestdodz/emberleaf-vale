import { useSyncExternalStore } from 'react'
import { LITE } from './flags'

export type Quality = 'low' | 'medium' | 'high'

export type Settings = {
  master: number
  music: number
  sfx: number
  muted: boolean
  quality: Quality
  showFps: boolean
  renderDistance: number
  fov: number
  sensitivity: number
  invertY: boolean
  showGrass: boolean
  showFog: boolean
}

const KEY = 'emberleaf.settings.v1'

const defaults: Settings = {
  master: 0.8,
  music: 0.55,
  sfx: 0.9,
  muted: false,
  quality: LITE ? 'low' : 'high',
  showFps: LITE,
  renderDistance: LITE ? 70 : 170,
  fov: 55,
  sensitivity: 1,
  invertY: false,
  showGrass: true,
  showFog: true,
}

let current: Settings = { ...defaults }
const listeners = new Set<() => void>()

function clamp01(v: unknown) {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : 0
  return Math.min(1, Math.max(0, n))
}

function clampRange(v: unknown, lo: number, hi: number, fallback: number) {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : fallback
  return Math.min(hi, Math.max(lo, n))
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
      renderDistance: clampRange(parsed.renderDistance, 40, 220, defaults.renderDistance),
      fov: clampRange(parsed.fov, 40, 90, defaults.fov),
      sensitivity: clampRange(parsed.sensitivity, 0.3, 2, defaults.sensitivity),
      invertY: !!parsed.invertY,
      showGrass: parsed.showGrass === undefined ? defaults.showGrass : !!parsed.showGrass,
      showFog: parsed.showFog === undefined ? defaults.showFog : !!parsed.showFog,
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

export function useSettings(): Settings {
  return useSyncExternalStore(settings.subscribe, settings.get)
}

export const QUALITY_MAP: Record<Quality, { dpr: number; shadows: boolean; shadowSize: number; bloom: boolean; msaa: number }> = {
  low: { dpr: 1, shadows: false, shadowSize: 512, bloom: false, msaa: 0 },
  medium: { dpr: 1.25, shadows: true, shadowSize: 1024, bloom: true, msaa: 2 },
  high: { dpr: 1.75, shadows: true, shadowSize: 2048, bloom: true, msaa: 4 },
}

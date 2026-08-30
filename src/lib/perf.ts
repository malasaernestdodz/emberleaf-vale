import { useSyncExternalStore } from 'react'
import { LITE } from './flags'

// Adaptive quality store. The governor walks TIERS when fps dips and climbs
// back when there is headroom. Manual mode (auto=false) freezes the tier.

export type PerfState = {
  auto: boolean
  tier: number
  dprScale: number
  bloom: boolean
  grassScale: number
}

export type Tier = { dprScale: number; bloom: boolean; grassScale: number }

export const TIERS: Tier[] = [
  { dprScale: 1, bloom: true, grassScale: 1 },
  { dprScale: 0.85, bloom: true, grassScale: 0.85 },
  { dprScale: 0.7, bloom: false, grassScale: 0.7 },
  { dprScale: 0.6, bloom: false, grassScale: 0.5 },
  { dprScale: 0.5, bloom: false, grassScale: 0.35 },
]

let state: PerfState = {
  auto: !LITE,
  tier: 0,
  dprScale: TIERS[0].dprScale,
  bloom: TIERS[0].bloom,
  grassScale: TIERS[0].grassScale,
}

const listeners = new Set<() => void>()

export const perfStore = {
  get(): PerfState {
    return state
  },
  set(patch: Partial<PerfState>) {
    const next = { ...state, ...patch }
    if (next.tier === state.tier && next.dprScale === state.dprScale && next.bloom === state.bloom && next.grassScale === state.grassScale && next.auto === state.auto) return
    state = next
    for (const fn of listeners) fn()
  },
  subscribe(fn: () => void) {
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  },
}

export function applyTier(tier: number) {
  const t = TIERS[Math.max(0, Math.min(TIERS.length - 1, tier))]
  perfStore.set({ tier, dprScale: t.dprScale, bloom: t.bloom, grassScale: t.grassScale })
}

export function usePerf(): PerfState {
  return useSyncExternalStore(perfStore.subscribe, perfStore.get)
}

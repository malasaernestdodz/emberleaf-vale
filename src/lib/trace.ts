// Observability core: ring-buffer trace events, per-system frame timers and
// frame-time percentiles. Everything is mirrored to window.__emberTrace so
// probes (HUD panel, Playwright, devtools) can pinpoint what makes a frame slow.

export type TraceKind = 'info' | 'frame' | 'watchdog' | 'governor' | 'error'

export type TraceEvent = {
  t: number
  kind: TraceKind
  msg: string
  fps: number
  draws: number
  tier: number
}

const MAX_EVENTS = 300
const events: TraceEvent[] = []

// Set by Perf scene component each frame so trace rows carry context.
export const traceCtx = { fps: 0, draws: 0, tier: 0 }

export function trace(kind: TraceKind, msg: string) {
  const e: TraceEvent = { t: performance.now(), kind, msg, fps: Math.round(traceCtx.fps), draws: traceCtx.draws, tier: traceCtx.tier }
  events.push(e)
  if (events.length > MAX_EVENTS) events.shift()
  return e
}

export function getEvents() {
  return events
}

// ---- per-system CPU timers -------------------------------------------------

export type SysStat = { name: string; ema: number; max: number; frames: number; ms: number }

const systems = new Map<string, SysStat>()

function sys(name: string): SysStat {
  let s = systems.get(name)
  if (!s) {
    s = { name, ema: 0, max: 0, frames: 0, ms: 0 }
    systems.set(name, s)
  }
  return s
}

export function endSys(name: string, t0: number) {
  const s = sys(name)
  const ms = performance.now() - t0
  s.ms += ms
  s.frames++
  if (ms > s.max) s.max = ms
}

// Fold raw accumulators into a smoothed per-frame self-time once per second.
export function sysTick() {
  for (const s of systems.values()) {
    const avg = s.frames > 0 ? s.ms / s.frames : 0
    s.ema = s.ema * 0.5 + avg * 0.5
    s.ms = 0
    s.frames = 0
  }
}

export function sysList(): SysStat[] {
  return [...systems.values()].sort((a, b) => b.ema - a.ema)
}

export function resetSysMax() {
  for (const s of systems.values()) s.max = 0
}

// ---- frame-time percentiles ------------------------------------------------

const FRAME_RING = 240
const frameRing = new Float32Array(FRAME_RING)
let frameHead = 0
let frameFill = 0

export function pushFrameMs(ms: number) {
  frameRing[frameHead] = ms
  frameHead = (frameHead + 1) % FRAME_RING
  if (frameFill < FRAME_RING) frameFill++
}

const sorted = new Float32Array(FRAME_RING)

export function frameStats() {
  const n = frameFill
  if (n === 0) return { p50: 0, p95: 0, max: 0, avg: 0 }
  sorted.set(frameRing.subarray(0, n))
  sorted.subarray(0, n).sort()
  const at = (p: number) => sorted[Math.min(n - 1, Math.floor(p * n))]
  let sum = 0
  for (let i = 0; i < n; i++) sum += sorted[i]
  return { p50: at(0.5), p95: at(0.95), max: at(0.999), avg: sum / n }
}

// ---- global probe ----------------------------------------------------------

export function installTraceProbe() {
  if (typeof window === 'undefined') return
  const w = window as unknown as { __emberTrace?: unknown }
  if (w.__emberTrace) return
  w.__emberTrace = {
    events: (n = 40) => events.slice(-n),
    systems: () => sysList().map((s) => ({ name: s.name, ema: +s.ema.toFixed(3), max: +s.max.toFixed(3) })),
    frame: frameStats,
    mark: trace,
    clear: () => {
      events.length = 0
      resetSysMax()
    },
  }
  window.addEventListener('error', (e) => {
    trace('error', `window.onerror: ${e.message} @ ${e.filename}:${e.lineno}`)
  })
  window.addEventListener('unhandledrejection', (e) => {
    trace('error', `unhandledrejection: ${String((e as PromiseRejectionEvent).reason)}`)
  })
}

installTraceProbe()

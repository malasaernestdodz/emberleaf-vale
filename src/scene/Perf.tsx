import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { consumeEdge } from '../lib/input'
import { LITE } from '../lib/flags'
import { QUALITY_MAP, settings, useSettings } from '../lib/settings'
import { TIERS, applyTier, perfStore } from '../lib/perf'
import { endSys, frameStats, pushFrameMs, sysList, sysTick, trace, traceCtx } from '../lib/trace'
import { game } from '../lib/world'

const LOW_FPS = 45
const HIGH_FPS = 57
const LOW_SECS_TO_STEP = 3
const HIGH_SECS_TO_RECOVER = 10

function topSystems(n = 3) {
  const hot = sysList()
    .filter((s) => s.ema > 0.1)
    .slice(0, n)
  return hot.length > 0 ? ` · hot: ${hot.map((s) => `${s.name} ${s.ema.toFixed(2)}ms`).join(', ')}` : ''
}

export function Perf() {
  const setDpr = useThree((s) => s.setDpr)
  const st = useSettings()
  const lowSecs = useRef(0)
  const highSecs = useRef(0)
  const secAcc = useRef(0)
  const sampleAcc = useRef(0)

  // Re-apply resolution whenever quality, governor tier or manual mode changes.
  useEffect(() => {
    if (LITE) {
      setDpr(1)
      return
    }
    const q = QUALITY_MAP[settings.get().quality]
    const base = q.dpr
    const perf = perfStore.get()
    setDpr(Math.max(0.4, base * (perf.auto ? perf.dprScale : 1)))
  }, [st, setDpr])

  useFrame((_, delta) => {
    const t0 = performance.now()
    pushFrameMs(delta * 1000)
    traceCtx.fps = game.fps
    traceCtx.draws = game.drawCalls

    if (consumeEdge('KeyP')) {
      game.showPerf = !game.showPerf
      trace('info', `perf panel ${game.showPerf ? 'opened' : 'closed'}`)
    }

    secAcc.current += delta
    if (secAcc.current >= 1) {
      secAcc.current -= 1
      sysTick()
      const f = frameStats()
      traceCtx.tier = perfStore.get().tier

      if (perfStore.get().auto && !LITE && game.ready) {
        if (game.fps < LOW_FPS) {
          lowSecs.current++
          highSecs.current = 0
          if (lowSecs.current >= LOW_SECS_TO_STEP) {
            lowSecs.current = 0
            const next = Math.min(TIERS.length - 1, perfStore.get().tier + 1)
            if (next !== perfStore.get().tier) {
              applyTier(next)
              traceCtx.tier = next
              trace('governor', `fps ${Math.round(game.fps)} · frame p95 ${f.p95.toFixed(1)}ms · tier -> ${next}${topSystems()}`)
            }
          } else {
            trace('watchdog', `fps ${Math.round(game.fps)} low · p95 ${f.p95.toFixed(1)}ms · draws ${game.drawCalls} · tris ${game.tris}${topSystems()}`)
          }
        } else if (game.fps > HIGH_FPS) {
          highSecs.current++
          lowSecs.current = 0
          if (highSecs.current >= HIGH_SECS_TO_RECOVER) {
            highSecs.current = 0
            const next = Math.max(0, perfStore.get().tier - 1)
            if (next !== perfStore.get().tier) {
              applyTier(next)
              traceCtx.tier = next
              trace('governor', `headroom (fps ${Math.round(game.fps)}) · tier -> ${next}`)
            }
          }
        } else {
          lowSecs.current = 0
          highSecs.current = 0
        }
      }
    }

    sampleAcc.current += delta
    if (sampleAcc.current >= 5) {
      sampleAcc.current = 0
      const f = frameStats()
      const p = perfStore.get()
      trace('frame', `fps ${Math.round(game.fps)} · p50 ${f.p50.toFixed(1)} / p95 ${f.p95.toFixed(1)}ms · draws ${game.drawCalls} · tris ${game.tris} · tier ${p.tier}${p.auto ? '' : ' (manual)'} · grass ${(p.grassScale * 100) | 0}%`)
    }

    endSys('perf', t0)
  })

  return null
}

import { Canvas } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import { initInput, onFirstInput } from './lib/input'
import { SLOT_LABELS, SLOT_TYPES, inv, selected } from './lib/items'
import { game } from './lib/world'
import { World } from './scene/World'

type Stats = {
  fps: number
  drawCalls: number
  x: number
  z: number
  inside: boolean
  nearLabel: string
  veil: number
  book: boolean
  toast: string
  toastT: number
  slot: number
  locked: boolean
  fishing: boolean
  bite: boolean
}

export default function App() {
  const [started, setStarted] = useState(false)
  const [stats, setStats] = useState<Stats>({
    fps: 0,
    drawCalls: 0,
    x: 0,
    z: 0,
    inside: false,
    nearLabel: '',
    veil: 0,
    book: false,
    toast: '',
    toastT: 0,
    slot: 0,
    locked: false,
    fishing: false,
    bite: false,
  })
  const [, tick] = useState(0)

  useEffect(() => {
    initInput()
    onFirstInput(() => setStarted(true))
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      setStats({
        fps: Math.round(game.fps),
        drawCalls: game.drawCalls,
        x: game.x,
        z: game.z,
        inside: game.inside,
        nearLabel: game.nearLabel,
        veil: game.sleepVeil,
        book: game.book,
        toast: game.toast,
        toastT: game.toastT,
        slot: selected.slot,
        locked: !!document.pointerLockElement,
        fishing: game.fishing,
        bite: game.bite,
      })
      tick((n) => (n + 1) % 1000)
    }, 150)
    return () => window.clearInterval(id)
  }, [])

  return (
    <>
      <Canvas
        shadows
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ fov: 55, near: 0.1, far: 420, position: [8, 7, 26] }}
      >
        <World />
      </Canvas>
      <div className="hud">
        <h1>EMBERLEAF VALE</h1>
        <div className="row">
          x {stats.x.toFixed(1)} · z {stats.z.toFixed(1)} · {stats.fps} fps · {stats.drawCalls} draws
        </div>
        {stats.inside && <span className="badge">HOME SWEET HOME</span>}
      </div>
      <div className={started ? 'intro hide' : 'intro'}>
        <div className="card">
          Click the world to look with the mouse (Esc frees it) · <kbd>WASD</kbd> walk ·{' '}
          <kbd>Ctrl</kbd>/<kbd>Shift</kbd> sprint · <kbd>Space</kbd> jump · <kbd>E</kbd> interact ·{' '}
          <kbd>G</kbd> throw · <kbd>1-4</kbd> items · scroll to zoom
        </div>
      </div>
      {stats.locked && <div className="crosshair" />}
      {stats.nearLabel && !stats.veil && !stats.book && (
        <div className="prompt">
          {stats.fishing ? (stats.bite ? '[E] Reel it in!' : 'Fishing…') : `[E] ${stats.nearLabel}`}
        </div>
      )}
      <div className="veil" style={{ opacity: stats.veil }}>
        {stats.veil > 0.95 && <div className="veil-text">Sleeping…</div>}
      </div>
      {stats.book && (
        <div className="book">
          <h2>The Keeper's Ledger</h2>
          <p>
            Day 1,204 — The windmill turns because the valley breathes. Feed the lamp, thank the
            well, and the sand path will always find its way home.
          </p>
          <p>
            The fountain grants nothing and that is its kindness: throw a coin, lose a coin, keep
            the wish.
          </p>
          <p className="sign">— E.</p>
          <p className="hint">[E] close</p>
        </div>
      )}
      <div className="toast" style={{ opacity: stats.toastT > 0 ? 1 : 0 }}>
        {stats.toast}
      </div>
      <div className="hotbar">
        {SLOT_TYPES.map((t, i) => (
          <div key={t} className={i === stats.slot ? 'slot active' : 'slot'}>
            <span className="slot-name">{SLOT_LABELS[t]}</span>
            <span className="slot-count">{inv[t]}</span>
            <span className="slot-key">{i + 1}</span>
          </div>
        ))}
      </div>
    </>
  )
}

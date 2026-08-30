import { Canvas } from '@react-three/fiber'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { initInput, onFirstInput } from './lib/input'
import { audio, playSfx, setAmbience, setMaster, setSfx, unlockAudio } from './lib/audio'
import { LITE } from './lib/flags'
import { QUALITY_MAP, settings } from './lib/settings'
import { colliderBlocks, colliderDims } from './lib/collide'
import { SLOT_LABELS, SLOT_TYPES, inv, selected, type Item } from './lib/items'
import { quests, questsDone } from './lib/quests'
import { COLLIDERS, game, groundHeight } from './lib/world'
import { World } from './scene/World'

type NearCol = {
  i: number
  txt: string
  d: number
  y0: number
  top: number
  blocks: boolean
}

type Stats = {
  fps: number
  drawCalls: number
  x: number
  y: number
  z: number
  gh: number
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
  showCol: boolean
  colCount: number
  nearCol: NearCol | null
}

type QuestView = { id: string; title: string; desc: string; progress: number; target: number; done: boolean }

function ItemIcon({ t }: { t: Item }) {
  switch (t) {
    case 'rock':
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <polygon points="12,3.5 19.5,8 21,15.5 14,20.5 5.5,17.5 4,9" fill="#9a958c" stroke="#6f6a62" strokeWidth="1.2" strokeLinejoin="round" />
          <polygon points="12,3.5 19.5,8 13.5,10.5 8.5,7.5" fill="#b5b0a6" stroke="none" />
        </svg>
      )
    case 'flower':
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M12 21 C12 16 12 14 12 10.5" stroke="#5d8f3a" strokeWidth="2" fill="none" strokeLinecap="round" />
          <ellipse cx="14.6" cy="15.5" rx="3" ry="1.5" fill="#5d8f3a" transform="rotate(-28 14.6 15.5)" />
          <circle cx="12" cy="5.4" r="2.5" fill="#f0a8c0" />
          <circle cx="16" cy="8.2" r="2.5" fill="#f0a8c0" />
          <circle cx="14.5" cy="12.8" r="2.5" fill="#f0a8c0" />
          <circle cx="9.5" cy="12.8" r="2.5" fill="#f0a8c0" />
          <circle cx="8" cy="8.2" r="2.5" fill="#f0a8c0" />
          <circle cx="12" cy="9.2" r="2.4" fill="#ffd27a" />
        </svg>
      )
    case 'wood':
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <rect x="3" y="8.5" width="17" height="7" rx="3" fill="#8a6a48" />
          <ellipse cx="19" cy="12" rx="2.1" ry="3.5" fill="#c9b08a" />
          <ellipse cx="19" cy="12" rx="0.9" ry="1.6" fill="#a5855e" />
          <path d="M6 10.5 h9 M6 13.5 h9" stroke="#6f5236" strokeWidth="0.9" />
        </svg>
      )
    case 'fish':
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <polygon points="16,12 22,7.5 22,16.5" fill="#4aa3b4" />
          <ellipse cx="10" cy="12" rx="7.2" ry="4.6" fill="#5fb8c9" />
          <path d="M9 7.6 q2 2.4 0 4.8" fill="#4aa3b4" />
          <circle cx="5.8" cy="10.9" r="1.15" fill="#22343c" />
        </svg>
      )
    case 'food':
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M4.5 14.5 a7.5 6.5 0 0 1 15 0 z" fill="#e0aa62" />
          <rect x="4.5" y="13.5" width="15" height="4.5" rx="2.2" fill="#c98f4e" />
          <circle cx="9" cy="10.5" r="0.8" fill="#f5e3c0" />
          <circle cx="13" cy="9.6" r="0.8" fill="#f5e3c0" />
          <circle cx="16" cy="11.2" r="0.8" fill="#f5e3c0" />
        </svg>
      )
    case 'gel':
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M4.5 17.5 a7.5 7 0 0 1 15 0 z" fill="#86e08a" opacity="0.92" />
          <circle cx="9" cy="12.5" r="1.7" fill="#eaffea" opacity="0.9" />
          <circle cx="12" cy="8.8" r="0.9" fill="#5cc464" />
        </svg>
      )
  }
}

export default function App() {
  const [started, setStarted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [masterPct, setMasterPct] = useState(Math.round(audio.master * 100))
  const [sfxOn, setSfxOn] = useState(audio.sfx)
  const [ambOn, setAmbOn] = useState(audio.ambience)
  const cfg = useSyncExternalStore(settings.subscribe, settings.get)
  const [questView, setQuestView] = useState<QuestView[]>([])
  const [doneCount, setDoneCount] = useState(0)
  const [questFx, setQuestFx] = useState<{ bump: Record<string, boolean>; done: Record<string, boolean> }>({
    bump: {},
    done: {},
  })
  const prevQuests = useRef<Record<string, { progress: number; done: boolean }>>({})
  const fxTimer = useRef(0)
  const [stats, setStats] = useState<Stats>({
    fps: 0,
    drawCalls: 0,
    x: 0,
    y: 0,
    z: 0,
    gh: 0,
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
    showCol: false,
    colCount: COLLIDERS.length,
    nearCol: null,
  })
  const [, tick] = useState(0)

  useEffect(() => {
    initInput()
    onFirstInput(() => {
      unlockAudio()
      if (LITE) setStarted(true)
    })
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'Escape') {
        if (game.book || game.sleeping || game.fishing) return
        const open = !game.menu
        game.menu = open
        setMenuOpen(open)
        if (open) {
          document.exitPointerLock()
          setMasterPct(Math.round(audio.master * 100))
          setSfxOn(audio.sfx)
          setAmbOn(audio.ambience)
          playSfx('menu')
        } else {
          playSfx('click')
        }
      } else if (e.code === 'KeyP' && !game.book && !game.sleeping && !game.fishing) {
        const open = !game.menu
        game.menu = open
        setMenuOpen(open)
        if (open) {
          document.exitPointerLock()
          playSfx('menu')
        } else {
          playSfx('click')
        }
      } else if (e.code === 'KeyM') {
        const mute = audio.master > 0
        setMaster(mute ? 0 : audio.prev || 0.8)
        setMasterPct(Math.round(audio.master * 100))
        game.toast = mute ? 'Sound muted' : 'Sound on'
        game.toastT = 1.4
        playSfx(mute ? 'back' : 'click')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      let nearCol: NearCol | null = null
      let nearestAny: NearCol | null = null
      if (game.showColliders) {
        for (let i = 0; i < COLLIDERS.length; i++) {
          const c = COLLIDERS[i]
          const rec: NearCol = {
            i,
            txt: colliderDims(c),
            d: Math.hypot(game.x - c.x, game.z - c.z),
            y0: c.y0 ?? 0,
            top: c.top ?? Infinity,
            blocks: colliderBlocks(c, game.y),
          }
          if (rec.blocks && (nearCol === null || rec.d < nearCol.d)) nearCol = rec
          if (nearestAny === null || rec.d < nearestAny.d) nearestAny = rec
        }
        nearCol = nearCol ?? nearestAny
      }
      setStats({
        fps: Math.round(game.fps),
        drawCalls: game.drawCalls,
        x: game.x,
        y: game.y,
        z: game.z,
        gh: groundHeight(game.x, game.z, game.y),
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
        showCol: game.showColliders,
        colCount: COLLIDERS.length,
        nearCol,
      })
      setMasterPct(Math.round(audio.master * 100))
      setQuestView(quests.map((q) => ({ id: q.id, title: q.title, desc: q.desc, progress: q.progress, target: q.target, done: q.done })))
      setDoneCount(questsDone())
      const bump: Record<string, boolean> = {}
      const doneFx: Record<string, boolean> = {}
      for (const q of quests) {
        const p = prevQuests.current[q.id]
        if (p) {
          if (q.progress > p.progress) bump[q.id] = true
          if (q.done && !p.done) doneFx[q.id] = true
        }
        prevQuests.current[q.id] = { progress: q.progress, done: q.done }
      }
      if (Object.keys(bump).length > 0 || Object.keys(doneFx).length > 0) {
        setQuestFx({ bump, done: doneFx })
        window.clearTimeout(fxTimer.current)
        fxTimer.current = window.setTimeout(() => setQuestFx({ bump: {}, done: {} }), 900)
      }
      tick((n) => (n + 1) % 1000)
    }, 150)
    return () => window.clearInterval(id)
  }, [])

  const openMenu = () => {
    if (game.menu) return
    game.menu = true
    setMenuOpen(true)
    document.exitPointerLock()
    setMasterPct(Math.round(audio.master * 100))
    setSfxOn(audio.sfx)
    setAmbOn(audio.ambience)
    playSfx('menu')
  }

  const closeMenu = () => {
    game.menu = false
    setMenuOpen(false)
    playSfx('click')
  }

  const qm = QUALITY_MAP[cfg.quality]
  const active = questView.filter((q) => !q.done).slice(0, 3)
  const hudHidden = stats.veil > 0.4 || menuOpen
  const muted = audio.master <= 0
  const volBars = muted ? 0 : Math.max(audio.master > 0 ? 1 : 0, Math.round(audio.master * 5))
  const zone = stats.inside ? 'HEARTH COTTAGE' : game.insideMansion ? 'VALE MANOR' : stats.fishing ? 'STILLWATER POND' : 'EMBERLEAF VALE'

  return (
    <>
      <Canvas
        key={cfg.quality}
        shadows={!LITE && qm.shadows}
        dpr={LITE ? 1 : qm.dpr}
        gl={{ antialias: !LITE, powerPreference: 'high-performance' }}
        camera={{ fov: 55, near: 0.1, far: 420, position: [8, 7, 26] }}
      >
        <World />
      </Canvas>
      <div className="hud">
        <div className="hud-tl">
          <div className="hud-kicker">A POCKET WORLD OF QUIET SEASONS</div>
          <h1>EMBERLEAF VALE</h1>
          <div className="zone-chip">{zone}</div>
          {cfg.showFps && (
            <div className="perf-row">
              {stats.fps} FPS · {stats.drawCalls} DRAWS · X {stats.x.toFixed(0)} · Z {stats.z.toFixed(0)}
            </div>
          )}
        </div>
        {stats.inside && <span className="badge">HOME SWEET HOME</span>}
        <div>
          <button
            className={stats.showCol ? 'collider-badge on' : 'collider-badge'}
            onClick={() => (game.showColliders = !game.showColliders)}
          >
            [C] collider debug {stats.showCol ? 'on' : 'off'}
          </button>
        </div>
      </div>
      <div className="hud-tr">
        <button className="vol-chip clickable-ui" onClick={openMenu} aria-label="Sound settings" data-testid="vol-chip">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
            {!muted && <path d="M16.5 8.5a5 5 0 0 1 0 7" stroke="currentColor" fill="none" strokeWidth="1.7" strokeLinecap="round" />}
            {muted && <path d="M16 9.5l5 5M21 9.5l-5 5" stroke="currentColor" fill="none" strokeWidth="1.7" strokeLinecap="round" />}
          </svg>
          <span className="vol-bars">
            {[0, 1, 2, 3, 4].map((i) => (
              <i key={i} className={i < volBars ? 'on' : ''} />
            ))}
          </span>
          <span className="vol-pct">{muted ? 'MUTE' : `${masterPct}`}</span>
        </button>
        <button className="gear clickable-ui" data-testid="gear" onClick={openMenu} aria-label="Open menu">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6zm8.9 3.8c0-.5-.05-1-.13-1.45l2.03-1.58-1.9-3.3-2.4.98a8.9 8.9 0 0 0-2.5-1.45L15.6 2.6h-3.8l-.4 2.6a8.9 8.9 0 0 0-2.5 1.45l-2.4-.98-1.9 3.3 2.03 1.58a8.4 8.4 0 0 0 0 2.9l-2.03 1.58 1.9 3.3 2.4-.98a8.9 8.9 0 0 0 2.5 1.45l.4 2.6h3.8l.4-2.6a8.9 8.9 0 0 0 2.5-1.45l2.4.98 1.9-3.3-2.03-1.58c.08-.45.13-.95.13-1.45z" fill="currentColor" />
          </svg>
        </button>
      </div>
      {stats.showCol && !menuOpen && (
        <div className="debug-panel">
          <div className="dp-title">
            COLLIDER DEBUG
            <button className="dp-btn" onClick={() => (game.showColliders = false)}>
              hide [C]
            </button>
          </div>
          <div className="dp-row">
            player x {stats.x.toFixed(2)} · z {stats.z.toFixed(2)} · feet y {stats.y.toFixed(2)} ·
            ground {stats.gh.toFixed(2)}
          </div>
          {stats.nearCol && (
            <div className={stats.nearCol.blocks ? 'dp-row blocking' : 'dp-row'}>
              nearest {stats.nearCol.blocks ? 'BLOCKING' : 'pass-through'} #{stats.nearCol.i}{' '}
              {stats.nearCol.txt} · dist {stats.nearCol.d.toFixed(2)}
              {stats.nearCol.y0 > 0 && (
                <>
                  {' '}
                  · y0 {stats.nearCol.y0.toFixed(2)}→
                  {stats.nearCol.top === Infinity ? '∞' : stats.nearCol.top.toFixed(2)}
                </>
              )}
            </div>
          )}
          <div className="dp-row dim">
            {stats.colCount} colliders · labels within 6 m · white = your capsule (r 0.32 h 1.55) ·
            bright = blocks you now · pink = raised (y0 &gt; 0) · dim = pass-through
          </div>
        </div>
      )}
      {LITE && (
        <div className={started ? 'intro hide' : 'intro'}>
          <div className="card">
            Click the world to look with the mouse (Esc frees it) · <kbd>WASD</kbd> walk ·{' '}
            <kbd>Ctrl</kbd>/<kbd>Shift</kbd> sprint · <kbd>Space</kbd> jump · <kbd>E</kbd> interact ·{' '}
            <kbd>G</kbd> throw · <kbd>1-6</kbd> items · left-click attack · <kbd>Esc</kbd> menu ·{' '}
            <kbd>C</kbd> collider debug · scroll to zoom
          </div>
        </div>
      )}
      {!LITE && !started && (
        <div className="title" data-testid="title-screen">
          <div className="title-top">A POCKET WORLD OF QUIET SEASONS</div>
          <h1 className="title-logo">
            EMBERLEAF <span>VALE</span>
          </h1>
          <div className="title-rule" />
          <div className="title-sub">Gather. Chop. Fish. Rest — the valley keeps score.</div>
          <div className="title-actions">
            <button
              className="t-btn primary"
              data-testid="start"
              onClick={() => {
                unlockAudio()
                setStarted(true)
                playSfx('quest')
              }}
            >
              ENTER THE VALE
            </button>
            <button
              className="t-btn"
              data-testid="title-settings"
              onClick={() => {
                unlockAudio()
                openMenu()
              }}
            >
              SETTINGS
            </button>
          </div>
          <div className="title-keys">
            <kbd>WASD</kbd> walk <kbd>E</kbd> interact <kbd>Space</kbd> jump <kbd>G</kbd> throw{' '}
            <kbd>Esc</kbd> menu <kbd>M</kbd> mute
          </div>
          <div className="title-ver">v0.3 · sound · seasons · quests</div>
        </div>
      )}
      {stats.locked && !menuOpen && <div className="crosshair" />}
      {stats.nearLabel && !hudHidden && !stats.book && (
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
      {!hudHidden && (
        <div className="quests" data-testid="quest-hud">
          <div className="quests-head">
            QUESTS <span className="quests-count">{doneCount}/{quests.length}</span>
          </div>
          {active.length === 0 && <div className="quest done-all">All quests complete!</div>}
          {active.map((q) => (
            <div
              key={q.id}
              className={
                'quest' +
                (q.done ? ' complete' : '') +
                (questFx.bump[q.id] ? ' bump' : '') +
                (questFx.done[q.id] ? ' pulse' : '')
              }
            >
              <span className="quest-title">{q.title}</span>
              <span className="quest-count" data-testid={`quest-${q.id}`}>
                {q.progress}/{q.target}
              </span>
              <span className="quest-desc">{q.desc}</span>
            </div>
          ))}
        </div>
      )}
      {menuOpen && (
        <div className="menu">
          <div className="menu-card">
            <h2>Emberleaf Vale</h2>
            <div className="menu-section">Sound</div>
            <label className="menu-row">
              <span>Master volume</span>
              <input
                className="menu-slider"
                data-testid="master-volume"
                type="range"
                min={0}
                max={100}
                value={masterPct}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setMasterPct(v)
                  unlockAudio()
                  setMaster(v / 100)
                }}
              />
              <span className="menu-pct" data-testid="master-pct">{masterPct}</span>
            </label>
            <div className="vol-meter" aria-hidden>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <i key={i} className={masterPct > i * 10 ? 'on' : ''} />
              ))}
            </div>
            <label className="menu-row">
              <span>Sound effects</span>
              <input
                className="menu-check"
                data-testid="sfx-toggle"
                type="checkbox"
                checked={sfxOn}
                onChange={(e) => {
                  setSfxOn(e.target.checked)
                  setSfx(e.target.checked)
                  playSfx('click')
                }}
              />
            </label>
            <label className="menu-row">
              <span>Ambience &amp; music</span>
              <input
                className="menu-check"
                data-testid="amb-toggle"
                type="checkbox"
                checked={ambOn}
                onChange={(e) => {
                  setAmbOn(e.target.checked)
                  unlockAudio()
                  setAmbience(e.target.checked)
                  playSfx('click')
                }}
              />
            </label>
            <button
              className="menu-btn"
              data-testid="test-sound"
              onClick={() => {
                unlockAudio()
                playSfx('test')
              }}
            >
              Test sound
            </button>
            <div className="menu-section">Display</div>
            <div className="menu-row quality-row">
              <span>Quality</span>
              <div className="seg">
                {(['low', 'medium', 'high'] as const).map((qOpt) => (
                  <button
                    key={qOpt}
                    className={cfg.quality === qOpt ? 'seg-btn on' : 'seg-btn'}
                    disabled={LITE}
                    data-testid={`quality-${qOpt}`}
                    onClick={() => {
                      settings.set({ quality: qOpt })
                      playSfx('click')
                    }}
                  >
                    {qOpt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <label className="menu-row">
              <span>FPS &amp; draw counter</span>
              <input
                className="menu-check"
                data-testid="fps-toggle"
                type="checkbox"
                checked={cfg.showFps}
                onChange={(e) => {
                  settings.set({ showFps: e.target.checked })
                  playSfx('click')
                }}
              />
            </label>
            {LITE && <div className="menu-note">Quality is pinned to LOW in lite mode.</div>}
            <button className="menu-btn primary" data-testid="resume" onClick={closeMenu}>
              Back to the vale
            </button>
            <p className="menu-hint">[Esc] close · [M] mute · [P] menu</p>
          </div>
        </div>
      )}
      <div className="toast" style={{ opacity: stats.toastT > 0 ? 1 : 0 }}>
        {stats.toast}
      </div>
      <div className="hotbar">
        {SLOT_TYPES.map((t, i) => (
          <div key={t} className={i === stats.slot ? 'slot active' : 'slot'}>
            <span className="slot-icon">
              <ItemIcon t={t} />
            </span>
            <span className="slot-count">{inv[t]}</span>
            <span className="slot-name">{SLOT_LABELS[t]}</span>
            <span className="slot-key">{i + 1}</span>
          </div>
        ))}
      </div>
    </>
  )
}

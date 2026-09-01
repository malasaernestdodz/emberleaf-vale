import { Canvas } from '@react-three/fiber'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { initInput, onFirstInput } from './lib/input'
import { audio, playSfx, setAmbience, setMaster, setSfx, unlockAudio } from './lib/audio'
import { LITE } from './lib/flags'
import { QUALITY_MAP, settings, useSettings } from './lib/settings'
import { perfStore, usePerf } from './lib/perf'
import { colliderBlocks, colliderDims } from './lib/collide'
import { SLOT_LABELS, SLOT_TYPES, inv, selected, type Item } from './lib/items'
import { quests, questsDone } from './lib/quests'
import { COLLIDERS, game, groundHeight } from './lib/world'
import { health } from './lib/health'
import { SLIME_MAX_HP, slimeHud } from './lib/slime'
import { frameStats, getEvents, metricsList, sysList } from './lib/trace'
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
  colSolid: boolean
  showPerf: boolean
  showFps: boolean
  cullVisible: number
  cullTotal: number
  tier: number
  autoTune: boolean
  dpr: number
  colCount: number
  nearCol: NearCol | null
  hp: number
  maxHp: number
  hurt: number
  fainted: boolean
  faintVeil: number
  slimeShown: boolean
  slimeFrac: number
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

function PerfPanel() {
  const f = frameStats()
  const events = getEvents()
    .slice(-9)
    .reverse()
  return (
    <div className="debug-panel perf" data-testid="perf-panel">
      <div className="dp-title">
        PERF TRACE
        <button className="dp-btn" onClick={() => (game.showPerf = false)}>
          hide [P]
        </button>
      </div>
      <div className="dp-row">
        fps {Math.round(game.fps)} (wall {Math.round(game.wallFps)}) · draws {game.drawCalls} · tris{' '}
        {game.tris} · dpr {perfStore.get().dprScale.toFixed(2)}×
      </div>
      <div className="dp-row">
        culled {game.cullTotal - game.cullVisible}/{game.cullTotal} beyond render distance
      </div>
      <div className="dp-row">
        frame ms p50 {f.p50.toFixed(1)} · p95 {f.p95.toFixed(1)} · max {f.max.toFixed(1)}
      </div>
      <div className="dp-row dim">
        tier {perfStore.get().tier} · {perfStore.get().auto ? 'auto-tune on' : 'manual'} · grass{' '}
        {(perfStore.get().grassScale * 100) | 0}%
      </div>
      {sysList()
        .filter((s) => s.ema > 0.05)
        .slice(0, 6)
        .map((s) => (
          <div className="dp-row" key={s.name}>
            {s.name.padEnd(11, '\u00a0')} {s.ema.toFixed(2)}ms (max {s.max.toFixed(1)})
          </div>
        ))}
      <div className="dp-title" style={{ marginTop: 6 }}>
        METRICS
      </div>
      {metricsList().length === 0 && <div className="dp-row dim">no counters yet</div>}
      {metricsList()
        .slice(0, 12)
        .map((m) => (
          <div className="dp-row" key={m.name} data-testid={`metric-${m.name.replace(/[^a-z0-9.]/gi, '-')}`}>
            {m.name.padEnd(14, '\u00a0')} {m.perSec > 0 ? `${m.perSec.toFixed(1)}/s · ` : ''}
            {Math.round(m.total)}
          </div>
        ))}
      <div className="dp-title" style={{ marginTop: 6 }}>
        EVENTS
      </div>
      {events.length === 0 && <div className="dp-row dim">none yet</div>}
      {events.map((e, i) => (
        <div className={`dp-row trace-${e.kind}`} key={`${e.t}-${i}`}>
          [{e.kind}] {e.msg}
        </div>
      ))}
    </div>
  )
}

function Hud({ started, menuOpen, onOpenMenu }: { started: boolean; menuOpen: boolean; onOpenMenu: () => void }) {
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
    colSolid: false,
    showPerf: false,
    showFps: LITE,
    cullVisible: 0,
    cullTotal: 0,
    tier: 0,
    autoTune: !LITE,
    dpr: 1,
    colCount: COLLIDERS.length,
    nearCol: null,
    hp: 5,
    maxHp: 5,
    hurt: 0,
    fainted: false,
    faintVeil: 0,
    slimeShown: true,
    slimeFrac: 1,
  })
  const [questView, setQuestView] = useState<QuestView[]>([])
  const [doneCount, setDoneCount] = useState(0)
  const [questFx, setQuestFx] = useState<{ bump: Record<string, boolean>; done: Record<string, boolean> }>({
    bump: {},
    done: {},
  })
  const prevQuests = useRef<Record<string, { progress: number; done: boolean }>>({})
  const fxTimer = useRef(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      let nearCol: NearCol | null = null
      let nearestAny: NearCol | null = null
      if (game.showColliders || game.colliderSolid) {
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
      const perf = perfStore.get()
      setStats({
        fps: Math.round(game.fps),
        drawCalls: game.drawCalls,
        x: game.x,
        y: game.y,
        z: game.z,
        gh: game.showColliders || game.colliderSolid ? groundHeight(game.x, game.z, game.y) : 0,
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
        colSolid: game.colliderSolid,
        showPerf: game.showPerf,
        showFps: settings.get().showFps,
        cullVisible: game.cullVisible,
        cullTotal: game.cullTotal,
        tier: perf.tier,
        autoTune: perf.auto,
        dpr: perf.dprScale,
        colCount: COLLIDERS.length,
        nearCol,
        hp: health.hp,
        maxHp: health.maxHp,
        hurt: health.hurtT,
        fainted: health.fainted,
        faintVeil: health.faintVeil,
        slimeShown: slimeHud.shown,
        slimeFrac: slimeHud.frac,
      })
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
    }, 150)
    return () => window.clearInterval(id)
  }, [])

  const active = questView.filter((q) => !q.done).slice(0, 3)
  const hudHidden = stats.veil > 0.4 || menuOpen || stats.book

  return (
    <>
      <div className="hud">
        <h1>EMBERLEAF VALE</h1>
        <div className="row">
          x {stats.x.toFixed(1)} · y {stats.y.toFixed(2)} · z {stats.z.toFixed(1)}
          {stats.showFps && (
            <>
              {' '}· {stats.fps} fps · {stats.drawCalls} draws · {stats.cullVisible}/{stats.cullTotal} drawn
            </>
          )}
        </div>
        {stats.inside && <span className="badge">HOME SWEET HOME</span>}
        <div>
          <button
            className={stats.showCol ? 'collider-badge on' : 'collider-badge'}
            onClick={() => (game.showColliders = !game.showColliders)}
          >
            [C] collider debug {stats.showCol ? 'on' : 'off'}
          </button>{' '}
          <button
            className={stats.colSolid ? 'collider-badge on' : 'collider-badge'}
            onClick={() => (game.colliderSolid = !game.colliderSolid)}
          >
            [V] solid shapes {stats.colSolid ? 'on' : 'off'}
          </button>
        </div>
      </div>
      {stats.showPerf && !menuOpen && <PerfPanel />}
      {(stats.showCol || stats.colSolid) && !menuOpen && (
        <div className="debug-panel">
          <div className="dp-title">
            COLLIDER DEBUG
            <button className="dp-btn" onClick={() => {
              game.showColliders = false
              game.colliderSolid = false
            }}>
              hide [C]/[V]
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
            bright = blocks you now · pink = raised (y0 &gt; 0) · dim = pass-through ·{' '}
            {stats.colSolid ? 'solid shape overlays on ([V])' : 'press [V] for solid shape overlays'}
          </div>
        </div>
      )}
      <div className={started ? 'intro hide' : 'intro'}>
        <div className="card">
          Click the world to look with the mouse (Esc frees it) · <kbd>WASD</kbd> walk ·{' '}
          <kbd>Ctrl</kbd>/<kbd>Shift</kbd> sprint · <kbd>Space</kbd> jump · <kbd>E</kbd> interact ·{' '}
          <kbd>G</kbd> throw · <kbd>1-6</kbd> items · click (either button) fast slash combo ·{' '}
          <kbd>Esc</kbd> menu · <kbd>C</kbd> collider debug · <kbd>V</kbd> solid collider
          shapes · <kbd>P</kbd> perf trace · scroll to zoom
        </div>
      </div>
      {stats.locked && !hudHidden && <div className="crosshair" />}
      {stats.nearLabel && !hudHidden && (
        <div className="prompt">
          {stats.fishing ? (stats.bite ? '[E] Reel it in!' : 'Fishing…') : `[E] ${stats.nearLabel}`}
        </div>
      )}
      <div className="veil" style={{ opacity: stats.veil }}>
        {stats.veil > 0.95 && <div className="veil-text">Sleeping…</div>}
      </div>
      <div className="veil faint" style={{ opacity: stats.faintVeil }}>
        {stats.faintVeil > 0.95 && <div className="veil-text">You fainted…</div>}
      </div>
      <div className="hurt-veil" style={{ opacity: Math.min(stats.hurt, 1) * 0.85 }} />
      {!hudHidden && !stats.fainted && (
        <div className={stats.hurt > 0.05 ? 'hearts hurt' : 'hearts'} data-testid="player-hearts">
          <span className="hearts-label">VITALITY</span>
          <span className="hearts-row">
            {Array.from({ length: stats.maxHp }, (_, i) => (
              <svg
                key={i}
                className={i < stats.hp ? 'heart' : 'heart empty'}
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path d="M12 20.6 C7.2 16.4 3.6 13 3.6 9.3 A4.7 4.7 0 0 1 12 6.5 A4.7 4.7 0 0 1 20.4 9.3 C20.4 13 16.8 16.4 12 20.6 Z" />
              </svg>
            ))}
          </span>
          <span className="hearts-count" data-testid="player-hp">
            {stats.hp}/{stats.maxHp}
          </span>
        </div>
      )}
      <div className="slime-health" data-testid="slime-health">
        <span className="slime-health-label">SLIME</span>
        <span className="slime-health-track">
          <span
            className="slime-health-fill"
            data-testid="slime-health-fill"
            style={{ width: `${stats.slimeFrac * 100}%` }}
          />
        </span>
        <span className="slime-health-count" data-testid="slime-hp">
          {Math.round(stats.slimeFrac * SLIME_MAX_HP)}/{SLIME_MAX_HP}
        </span>
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
      <button className="gear clickable-ui" data-testid="gear" onClick={onOpenMenu} aria-label="Open menu">
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6zm8.9 3.8c0-.5-.05-1-.13-1.45l2.03-1.58-1.9-3.3-2.4.98a8.9 8.9 0 0 0-2.5-1.45L15.6 2.6h-3.8l-.4 2.6a8.9 8.9 0 0 0-2.5 1.45l-2.4-.98-1.9 3.3 2.03 1.58a8.4 8.4 0 0 0 0 2.9l-2.03 1.58 1.9 3.3 2.4-.98a8.9 8.9 0 0 0 2.5 1.45l.4 2.6h3.8l.4-2.6a8.9 8.9 0 0 0 2.5-1.45l2.4.98 1.9-3.3-2.03-1.58c.08-.45.13-.95.13-1.45z" fill="currentColor" />
        </svg>
      </button>
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

const MemoHud = memo(Hud)

function MenuCard({ onClose }: { onClose: () => void }) {
  const [masterPct, setMasterPct] = useState(Math.round(audio.master * 100))
  const [sfxOn, setSfxOn] = useState(audio.sfx)
  const [ambOn, setAmbOn] = useState(audio.ambience)
  const st = useSettings()
  const perf = usePerf()

  return (
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
          <span>Ambience</span>
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
        <div className="menu-section">World</div>
        <label className="menu-row">
          <span>Render distance</span>
          <input
            className="menu-slider"
            data-testid="render-distance"
            type="range"
            min={40}
            max={220}
            step={10}
            value={st.renderDistance}
            onChange={(e) => {
              settings.set({ renderDistance: Number(e.target.value) })
            }}
          />
          <span className="menu-pct" data-testid="render-distance-value">
            {st.renderDistance} m
          </span>
        </label>
        <label className="menu-row">
          <span>Distance fog</span>
          <input
            className="menu-check"
            data-testid="fog-toggle"
            type="checkbox"
            checked={st.showFog}
            onChange={(e) => {
              settings.set({ showFog: e.target.checked })
              playSfx('click')
            }}
          />
        </label>
        <label className="menu-row">
          <span>Grass</span>
          <input
            className="menu-check"
            data-testid="grass-toggle"
            type="checkbox"
            checked={st.showGrass}
            onChange={(e) => {
              settings.set({ showGrass: e.target.checked })
              playSfx('click')
            }}
          />
        </label>
        <div className="menu-section">Graphics</div>
        <label className="menu-row">
          <span>Quality</span>
          <span className="seg">
            {(['low', 'medium', 'high'] as const).map((lvl) => (
              <button
                key={lvl}
                className={st.quality === lvl ? 'seg-btn on' : 'seg-btn'}
                data-testid={`quality-${lvl}`}
                disabled={LITE}
                onClick={() => {
                  settings.set({ quality: lvl })
                  playSfx('click')
                }}
              >
                {lvl.toUpperCase()}
              </button>
            ))}
          </span>
        </label>
        <label className="menu-row">
          <span>Auto-tune (watch fps)</span>
          <input
            className="menu-check"
            data-testid="auto-tune"
            type="checkbox"
            checked={perf.auto && !LITE}
            disabled={LITE}
            onChange={(e) => {
              perfStore.set({ auto: e.target.checked })
              playSfx('click')
            }}
          />
        </label>
        <p className="menu-note">
          Auto-tune drops resolution, bloom and grass density when fps dips, and restores them when
          there is headroom. [P] opens the perf trace.
        </p>
        <label className="menu-row">
          <span>Field of view</span>
          <input
            className="menu-slider"
            data-testid="fov"
            type="range"
            min={40}
            max={90}
            value={st.fov}
            onChange={(e) => {
              settings.set({ fov: Number(e.target.value) })
            }}
          />
          <span className="menu-pct" data-testid="fov-value">
            {st.fov}°
          </span>
        </label>
        <label className="menu-row">
          <span>Show FPS</span>
          <input
            className="menu-check"
            data-testid="show-fps"
            type="checkbox"
            checked={st.showFps}
            onChange={(e) => {
              settings.set({ showFps: e.target.checked })
              playSfx('click')
            }}
          />
        </label>
        <div className="menu-section">Controls</div>
        <label className="menu-row">
          <span>Look sensitivity</span>
          <input
            className="menu-slider"
            data-testid="sensitivity"
            type="range"
            min={0.3}
            max={2}
            step={0.1}
            value={st.sensitivity}
            onChange={(e) => {
              settings.set({ sensitivity: Number(e.target.value) })
            }}
          />
          <span className="menu-pct" data-testid="sensitivity-value">
            {st.sensitivity.toFixed(1)}×
          </span>
        </label>
        <label className="menu-row">
          <span>Invert look Y</span>
          <input
            className="menu-check"
            data-testid="invert-y"
            type="checkbox"
            checked={st.invertY}
            onChange={(e) => {
              settings.set({ invertY: e.target.checked })
              playSfx('click')
            }}
          />
        </label>
        <button className="menu-btn primary" data-testid="resume" onClick={onClose}>
          Back to the vale
        </button>
        <p className="menu-hint">[Esc] close</p>
      </div>
    </div>
  )
}

export default function App() {
  const [started, setStarted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const st = useSettings()
  const perf = usePerf()

  useEffect(() => {
    initInput()
    onFirstInput(() => {
      setStarted(true)
      unlockAudio()
    })
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Escape' || e.repeat) return
      if (game.book || game.sleeping || game.fishing) return
      const open = !game.menu
      game.menu = open
      setMenuOpen(open)
      if (open) {
        document.exitPointerLock()
        playSfx('menu')
      } else {
        playSfx('click')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const openMenu = useCallback(() => {
    if (game.menu) return
    game.menu = true
    setMenuOpen(true)
    document.exitPointerLock()
    playSfx('menu')
  }, [])

  const closeMenu = useCallback(() => {
    game.menu = false
    setMenuOpen(false)
    playSfx('click')
  }, [])

  // The world element is created once: HUD/menu re-renders never reconcile the scene.
  const world = useMemo(() => <World />, [])

  const baseDpr = LITE ? 1 : Math.min(window.devicePixelRatio || 1, QUALITY_MAP[st.quality].dpr)
  const dpr = LITE ? 1 : Math.max(0.4, baseDpr * (perf.auto ? perf.dprScale : 1))

  return (
    <>
      <Canvas
        shadows={!LITE}
        dpr={dpr}
        gl={{ antialias: !LITE, powerPreference: 'high-performance', preserveDrawingBuffer: LITE }}
        camera={{ fov: 55, near: 0.1, far: 420, position: [8, 7, 26] }}
      >
        {world}
      </Canvas>
      <MemoHud started={started} menuOpen={menuOpen} onOpenMenu={openMenu} />
      {menuOpen && <MenuCard onClose={closeMenu} />}
    </>
  )
}

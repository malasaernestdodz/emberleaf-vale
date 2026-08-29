import * as THREE from 'three'
import { clamp, fbm, mulberry32, smoothstep, lerp } from './math'

export const WORLD_R = 90

export const HOUSE = { x: 12, z: -10, w: 7, d: 6, h: 2.9, yaw: -1.107, doorLX: 0.6, doorW: 1.3 }
export const PLAZA = { x: -6, z: -1, r: 6 }
export const FOUNTAIN = { x: -6, z: -1 }
export const WELL = { x: -13, z: 5 }
export const POND = { x: -17, z: 12, r: 5.6 }
export const WINDMILL = { x: 24, z: -20 }
export const SPAWN = { x: 0, z: 12 }

const cosH = Math.cos(HOUSE.yaw)
const sinH = Math.sin(HOUSE.yaw)

export function houseWorld(lx: number, lz: number) {
  return { x: HOUSE.x + lx * cosH + lz * sinH, z: HOUSE.z - lx * sinH + lz * cosH }
}

export function houseLocal(x: number, z: number) {
  const dx = x - HOUSE.x
  const dz = z - HOUSE.z
  return { lx: cosH * dx - sinH * dz, lz: sinH * dx + cosH * dz }
}

export const DOOR = (() => {
  const p = houseWorld(HOUSE.doorLX, HOUSE.d / 2)
  return { x: p.x, z: p.z, nx: sinH, nz: cosH }
})()

const mainPath: [number, number][] = [
  [0, 16],
  [0, 8],
  [-1, 3],
  [-6, -1],
  [-2, -8],
  [5, -9.5],
]
const doorEnd = houseWorld(HOUSE.doorLX, HOUSE.d / 2 + 1.6)
mainPath.push([doorEnd.x, doorEnd.z])

const PATH_POINTS: [number, number][][] = [
  mainPath,
  [
    [-6, -1],
    [-9, 2],
    [-13, 5],
  ],
  [
    [-6, -1],
    [-11, 5],
    [-14.5, 8.2],
  ],
  [
    [-6, -1],
    [-11, -6],
    [-15.6, -10.2],
  ],
]

const SEGS: number[] = []
for (const pts of PATH_POINTS) {
  const curve = new THREE.CatmullRomCurve3(
    pts.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    false,
    'catmullrom',
    0.5
  )
  const sm = curve.getPoints(140)
  for (let i = 0; i < sm.length - 1; i++) {
    SEGS.push(sm[i].x, sm[i].z, sm[i + 1].x, sm[i + 1].z)
  }
}

export function pathDistance(x: number, z: number) {
  let best = Infinity
  for (let i = 0; i < SEGS.length; i += 4) {
    const ax = SEGS[i]
    const az = SEGS[i + 1]
    const abx = SEGS[i + 2] - ax
    const abz = SEGS[i + 3] - az
    const l2 = abx * abx + abz * abz || 1e-9
    let t = ((x - ax) * abx + (z - az) * abz) / l2
    t = t < 0 ? 0 : t > 1 ? 1 : t
    const dx = x - (ax + abx * t)
    const dz = z - (az + abz * t)
    const d2 = dx * dx + dz * dz
    if (d2 < best) best = d2
  }
  return Math.sqrt(best)
}

function moundHeight(x: number, z: number) {
  const dx = x - WINDMILL.x
  const dz = z - WINDMILL.z
  return 3.4 * Math.exp(-(dx * dx + dz * dz) / (2 * 7 * 7))
}

function terrainRaw(x: number, z: number) {
  let h = (fbm(x * 0.02 + 7.3, z * 0.02 + 2.9, 3) - 0.5) * 2.6
  h += (fbm(x * 0.075 + 3.1, z * 0.075 + 8.7, 2) - 0.5) * 0.5
  h += moundHeight(x, z)
  return h
}

export const WINDMILL_Y = terrainRaw(WINDMILL.x, WINDMILL.z)

type Feature = { x: number; z: number; r: number; f: number; target: number }

const FEATURES: Feature[] = [
  { x: HOUSE.x, z: HOUSE.z, r: 8.5, f: 5, target: 0 },
  { x: PLAZA.x, z: PLAZA.z, r: 6.5, f: 4, target: 0 },
  { x: WELL.x, z: WELL.z, r: 2.6, f: 2, target: 0 },
  { x: WINDMILL.x, z: WINDMILL.z, r: 6.5, f: 4, target: WINDMILL_Y },
  { x: -20, z: -14, r: 9, f: 4, target: 0 },
]

export function terrainHeight(x: number, z: number) {
  let h = terrainRaw(x, z)
  for (const ft of FEATURES) {
    const d = Math.hypot(x - ft.x, z - ft.z)
    h = lerp(h, ft.target, 1 - smoothstep(ft.r, ft.r + ft.f, d))
  }
  const pd = pathDistance(x, z)
  h = lerp(h, 0, (1 - smoothstep(1.7, 3.6, pd)) * 0.92)
  const dp = Math.hypot(x - POND.x, z - POND.z)
  h = lerp(h, -0.62, 1 - smoothstep(4.4, 6.4, dp))
  return h
}

export type Tree = { x: number; z: number; y: number; s: number; yaw: number; variant: number }
export type Rock = { x: number; z: number; y: number; s: number; yaw: number; sq: number }

const rng = mulberry32(20260829)

export const TREES: Tree[] = []
{
  let attempts = 6000
  while (TREES.length < 18 && attempts-- > 0) {
    const a = rng() * Math.PI * 2
    const r = 18 + rng() * 58
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    if (pathDistance(x, z) < 3) continue
    if (Math.hypot(x - HOUSE.x, z - HOUSE.z) < 11) continue
    if (Math.hypot(x + 20, z + 14) < 12) continue
    if (Math.hypot(x - PLAZA.x, z - PLAZA.z) < 9.5) continue
    if (Math.hypot(x - POND.x, z - POND.z) < 10) continue
    if (Math.hypot(x - WINDMILL.x, z - WINDMILL.z) < 10) continue
    if (Math.hypot(x - WELL.x, z - WELL.z) < 4) continue
    if (Math.hypot(x - SPAWN.x, z - SPAWN.z) < 6) continue
    if (TREES.some((t) => Math.hypot(t.x - x, t.z - z) < 6.5)) continue
    TREES.push({
      x,
      z,
      y: terrainHeight(x, z),
      s: 0.8 + rng() * 0.6,
      yaw: rng() * Math.PI * 2,
      variant: Math.floor(rng() * 3),
    })
  }
}

export const ROCKS: Rock[] = []
{
  const ringAngles = [0.4, 1.1, 2.0, 3.0, 4.0]
  for (const a of ringAngles) {
    const x = POND.x + Math.cos(a) * (POND.r + 1.1)
    const z = POND.z + Math.sin(a) * (POND.r + 1.1)
    const s = 0.6 + rng() * 0.5
    ROCKS.push({ x, z, y: terrainHeight(x, z) - s * 0.2, s, yaw: rng() * Math.PI * 2, sq: 0.7 + rng() * 0.5 })
  }
  let attempts = 3000
  while (ROCKS.length < 17 && attempts-- > 0) {
    const a = rng() * Math.PI * 2
    const r = 4 + rng() * 54
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    if (pathDistance(x, z) < 2) continue
    if (Math.hypot(x - HOUSE.x, z - HOUSE.z) < 7.5) continue
    if (Math.hypot(x + 20, z + 14) < 8.5) continue
    if (Math.hypot(x - PLAZA.x, z - PLAZA.z) < 7.5) continue
    if (Math.hypot(x - POND.x, z - POND.z) < POND.r + 2.5) continue
    if (Math.hypot(x - WINDMILL.x, z - WINDMILL.z) < 7) continue
    if (Math.hypot(x - WELL.x, z - WELL.z) < 2.5) continue
    if (TREES.some((t) => Math.hypot(t.x - x, t.z - z) < 2.5)) continue
    if (ROCKS.some((k) => Math.hypot(k.x - x, k.z - z) < 3)) continue
    const s = 0.4 + rng() * 1.1
    ROCKS.push({ x, z, y: terrainHeight(x, z) - s * 0.2, s, yaw: rng() * Math.PI * 2, sq: 0.7 + rng() * 0.5 })
  }
}

export type Collider =
  | { t: 'c'; x: number; z: number; r: number; top?: number; y0?: number }
  | { t: 'b'; x: number; z: number; hw: number; hd: number; yaw: number; top?: number; y0?: number }

export const COLLIDERS: Collider[] = []

function addBox(lx: number, lz: number, hw: number, hd: number, top?: number) {
  const w = houseWorld(lx, lz)
  COLLIDERS.push({ t: 'b', x: w.x, z: w.z, hw, hd, yaw: HOUSE.yaw, top })
}

{
  const dw = HOUSE.doorW / 2
  const lx = HOUSE.doorLX
  const leftSegW = lx - dw + HOUSE.w / 2
  addBox(-HOUSE.w / 2 + leftSegW / 2, HOUSE.d / 2, leftSegW / 2, 0.09)
  const rightSegW = HOUSE.w / 2 - (lx + dw)
  addBox(lx + dw + rightSegW / 2, HOUSE.d / 2, rightSegW / 2, 0.09)
  addBox(0, -HOUSE.d / 2, HOUSE.w / 2, 0.09)
  addBox(-HOUSE.w / 2, 0, 0.09, HOUSE.d / 2)
  addBox(HOUSE.w / 2, 0, 0.09, HOUSE.d / 2)

  COLLIDERS.push({ t: 'c', x: houseWorld(1.9, 0.8).x, z: houseWorld(1.9, 0.8).z, r: 0.85, top: 0.61 })
  addBox(-2.4, -1.5, 0.75, 1.15, 0.5)
  addBox(3.05, -1.0, 0.4, 0.95)
  COLLIDERS.push({ t: 'c', x: houseWorld(2.6, 0.2).x, z: houseWorld(2.6, 0.2).z, r: 0.28, top: 0.43 })
  COLLIDERS.push({ t: 'c', x: houseWorld(2.5, 1.4).x, z: houseWorld(2.5, 1.4).z, r: 0.28, top: 0.43 })

  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2
    COLLIDERS.push({
      t: 'b',
      x: FOUNTAIN.x + Math.sin(a) * 1.95,
      z: FOUNTAIN.z + Math.cos(a) * 1.95,
      hw: 0.6,
      hd: 0.14,
      yaw: a,
      top: 0.56,
    })
  }
  COLLIDERS.push({ t: 'c', x: FOUNTAIN.x, z: FOUNTAIN.z, r: 0.75 })
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    COLLIDERS.push({
      t: 'b',
      x: WELL.x + Math.sin(a) * 1.0,
      z: WELL.z + Math.cos(a) * 1.0,
      hw: 0.42,
      hd: 0.13,
      yaw: a,
      top: 0.78,
    })
  }
  COLLIDERS.push({ t: 'c', x: WELL.x - 0.75, z: WELL.z, r: 0.18 })
  COLLIDERS.push({ t: 'c', x: WELL.x + 0.75, z: WELL.z, r: 0.18 })
  for (const t of TREES) COLLIDERS.push({ t: 'c', x: t.x, z: t.z, r: 0.5 * t.s })
  for (const k of ROCKS) {
    COLLIDERS.push({ t: 'c', x: k.x, z: k.z, r: 0.85 * k.s, top: k.y + k.s * k.sq * 0.6 })
  }
}

export const MILL = {
  x: WINDMILL.x,
  z: WINDMILL.z,
  yaw: -0.6435,
  base: WINDMILL_Y,
  top: 3.6,
  rWall: 2.9,
  rIn: 2.55,
  rCenter: 1.5,
}
const mc = Math.cos(MILL.yaw)
const ms = Math.sin(MILL.yaw)

export function millWorld(lx: number, lz: number) {
  return { x: MILL.x + lx * mc + lz * ms, z: MILL.z - lx * ms + lz * mc }
}

export function millLocal(x: number, z: number) {
  const dx = x - MILL.x
  const dz = z - MILL.z
  return { lx: mc * dx - ms * dz, lz: ms * dx + mc * dz }
}

export const MANSION = { x: -20, z: -14, w: 10, d: 8, yaw: 0.82, floorY: 0.22, floor2: 2.95 }
const wc = Math.cos(MANSION.yaw)
const ws = Math.sin(MANSION.yaw)

export function mansionWorld(lx: number, lz: number) {
  return { x: MANSION.x + lx * wc + lz * ws, z: MANSION.z - lx * ws + lz * wc }
}

export function mansionLocal(x: number, z: number) {
  const dx = x - MANSION.x
  const dz = z - MANSION.z
  return { lx: wc * dx - ws * dz, lz: ws * dx + wc * dz }
}

type Walkable = { x: number; z: number; inner?: number; r: number; h: number }
const WALKABLES: Walkable[] = [
  { x: FOUNTAIN.x, z: FOUNTAIN.z, r: 1.7, h: 0.48 },
  { x: FOUNTAIN.x, z: FOUNTAIN.z, inner: 1.7, r: 2.0, h: 0.56 },
  { x: WELL.x, z: WELL.z, inner: 0.7, r: 1.1, h: 0.78 },
  { x: millWorld(0, 0).x, z: millWorld(0, 0).z, r: 0.72, h: MILL.base + 0.38 },
]
for (const k of ROCKS) {
  WALKABLES.push({ x: k.x, z: k.z, r: k.s * 0.72, h: k.y + k.s * k.sq * 0.6 })
}

export function groundHeight(x: number, z: number) {
  let h = terrainHeight(x, z)
  const hl = houseLocal(x, z)
  const fm = 1 - smoothstep(3.3, 3.7, Math.max(Math.abs(hl.lx), Math.abs(hl.lz)))
  h = lerp(h, 0.19, fm)
  const ml = millLocal(x, z)
  const d = Math.hypot(ml.lx, ml.lz)
  if (d < MILL.rIn) {
    if (d < MILL.rCenter) {
      h = Math.max(h, MILL.base + 0.02)
    } else {
      const phi0 = Math.atan2(-ml.lx, ml.lz)
      const phi = phi0 < 0 ? phi0 + Math.PI * 2 : phi0
      if (phi > 0.35 && phi < Math.PI * 2 - 0.35) {
        h = Math.max(h, MILL.base + 0.02 + ((phi - 0.35) / (Math.PI * 2 - 0.7)) * (MILL.top - 0.02))
      } else if (phi >= Math.PI * 2 - 0.35) {
        h = Math.max(h, MILL.base + MILL.top)
      } else {
        h = Math.max(h, MILL.base + 0.02)
      }
    }
  }
  const mn = mansionLocal(x, z)
  if (Math.abs(mn.lx) < MANSION.w / 2 && Math.abs(mn.lz) < MANSION.d / 2) {
    if (mn.lx > 2.25 && mn.lx < 3.55 && mn.lz > -0.3 && mn.lz < 3.5) {
      const t = clamp((3.5 - mn.lz) / 3.8, 0, 1)
      h = Math.max(h, MANSION.floorY + t * (MANSION.floor2 - MANSION.floorY))
    } else if (mn.lz < -0.4) {
      h = Math.max(h, MANSION.floor2)
    } else {
      h = Math.max(h, MANSION.floorY)
    }
  }
  for (const w of WALKABLES) {
    const wd = Math.hypot(x - w.x, z - w.z)
    if (wd < w.r && wd >= (w.inner ?? 0)) h = Math.max(h, w.h)
  }
  return h
}

{
  const md = MANSION.d / 2
  const mw = MANSION.w / 2
  const addMBox = (lx: number, lz: number, hw: number, hd: number, top?: number, y0?: number) => {
    const w = mansionWorld(lx, lz)
    COLLIDERS.push({ t: 'b', x: w.x, z: w.z, hw, hd, yaw: MANSION.yaw, top, y0 })
  }
  addMBox(-mw / 2 - 0.35, md, 2.15, 0.12)
  addMBox(mw / 2 + 0.35, md, 2.15, 0.12)
  addMBox(0, -md, mw, 0.12)
  addMBox(-mw, 0, 0.12, md)
  addMBox(mw, 0, 0.12, md)
  COLLIDERS.push({ t: 'c', x: mansionWorld(0, 1.5).x, z: mansionWorld(0, 1.5).z, r: 1.0, top: 0.69 })
  for (const [px, pz] of [
    [-1.5, 2.7],
    [1.5, 2.7],
    [0, 0.1],
  ]) {
    const s = mansionWorld(px, pz)
    COLLIDERS.push({ t: 'c', x: s.x, z: s.z, r: 0.3, top: 0.44 })
  }
  addMBox(-4.55, -2, 0.3, 1.4)
  {
    const s = mansionWorld(4.3, 2.0)
    COLLIDERS.push({ t: 'c', x: s.x, z: s.z, r: 0.3 })
  }
  {
    const s = mansionWorld(-3.9, 3.2)
    COLLIDERS.push({ t: 'c', x: s.x, z: s.z, r: 0.3 })
  }
  addMBox(-2.8, -2.6, 0.8, 1.2, MANSION.floor2 + 0.5, MANSION.floor2)
  addMBox(2.9, -2.9, 0.9, 0.4, MANSION.floor2 + 0.78, MANSION.floor2)
  addMBox(-4.55, 0.8, 0.3, 1.2, undefined, MANSION.floor2)
}

const bedW = houseWorld(-2.4, -1.5)
const tableW = houseWorld(1.9, 0.8)
const bed2W = mansionWorld(-2.8, -2.6)
export const INTERACTABLES = [
  { id: 'bed', x: bedW.x, z: bedW.z, label: 'Sleep in the bed', r: 1.35 },
  { id: 'book', x: tableW.x, z: tableW.z, label: 'Read the book', r: 1.15 },
  { id: 'bed2', x: bed2W.x, z: bed2W.z, label: 'Sleep in the grand bed', r: 1.35 },
]

{
  for (let i = 0; i < 20; i++) {
    const theta = (i / 20) * Math.PI * 2
    const wrapped = theta > Math.PI ? theta - Math.PI * 2 : theta
    if (Math.abs(wrapped) < 0.42) continue
    const p = millWorld(Math.sin(theta) * 2.9, Math.cos(theta) * 2.9)
    COLLIDERS.push({ t: 'b', x: p.x, z: p.z, hw: 0.48, hd: 0.14, yaw: wrapped })
  }
  const pole = millWorld(0, 0)
  COLLIDERS.push({ t: 'c', x: pole.x, z: pole.z, r: 0.22 })
  const stone = millWorld(0, 0)
  COLLIDERS.push({ t: 'c', x: stone.x, z: stone.z, r: 0.78, top: MILL.base + 0.38 })
}

export const game = {
  ready: false,
  time: 0,
  x: SPAWN.x,
  y: terrainHeight(SPAWN.x, SPAWN.z),
  z: SPAWN.z,
  vx: 0,
  vz: 0,
  vy: 0,
  grounded: true,
  sprint: 0,
  mode: 'walk',
  near: '',
  nearLabel: '',
  fishing: false,
  bite: false,
  insideMansion: false,
  interior2: 0,
  interior3: 0,
  tool: '',
  chop: 0,
  sleepVeil: 0,
  sleepT: 0,
  sleeping: false,
  book: false,
  toast: '',
  toastT: 0,
  heading: Math.atan2(PLAZA.x - SPAWN.x, PLAZA.z - SPAWN.z),
  camYaw: 0.43,
  camPitch: 0.46,
  camDist: 6.5,
  camX: 0,
  camY: 0,
  camZ: 0,
  inside: false,
  interior: 0,
  windmill: 0,
  fps: 60,
  grass: 0,
  drawCalls: 0,
  tris: 0,
  trees: TREES.length,
  rocks: ROCKS.length,
  teleport(x: number, z: number) {
    this.x = x
    this.z = z
    this.vx = 0
    this.vz = 0
    this.vy = 0
    this.y = groundHeight(x, z)
    this.grounded = true
    this.mode = 'walk'
  },
}

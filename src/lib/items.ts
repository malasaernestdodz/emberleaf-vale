import { ROCKS, TREES, groundHeight } from './world'
import { mulberry32 } from './math'

export type PickupType = 'rock' | 'flower' | 'wood'
export type Item = PickupType | 'fish'

export type Pickup = {
  id: number
  type: Item
  x: number
  y: number
  z: number
  vx: number
  vz: number
  vy: number
  flying: boolean
  alive: boolean
}

export const pickups: Pickup[] = []
export const inv: Record<Item, number> = { rock: 0, flower: 0, wood: 0, fish: 0 }
export const SLOT_TYPES: Item[] = ['rock', 'flower', 'wood', 'fish']
export const SLOT_LABELS: Record<Item, string> = {
  rock: 'Rock',
  flower: 'Flower',
  wood: 'Wood',
  fish: 'Fish',
}
export const selected = { slot: 0 }

let nextId = 1

export function spawnPickup(type: PickupType, x: number, z: number) {
  pickups.push({
    id: nextId++,
    type,
    x,
    z,
    y: groundHeight(x, z) + 0.14,
    vx: 0,
    vz: 0,
    vy: 0,
    flying: false,
    alive: true,
  })
}

export function nearestPickup(x: number, z: number) {
  let best: Pickup | null = null
  let bd = 1.25
  for (const p of pickups) {
    if (!p.alive || p.flying) continue
    const d = Math.hypot(p.x - x, p.z - z)
    if (d < bd) {
      bd = d
      best = p
    }
  }
  return best
}

export function throwPickup(type: Item, x: number, y: number, z: number, dx: number, dz: number) {
  pickups.push({
    id: nextId++,
    type,
    x,
    y,
    z,
    vx: dx * 7,
    vz: dz * 7,
    vy: 3.2,
    flying: true,
    alive: true,
  })
}

export function aliveCount() {
  let n = 0
  for (const p of pickups) if (p.alive) n++
  return n
}

{
  const rng = mulberry32(4242)
  for (let i = 0; i < 7 && i < ROCKS.length; i++) {
    const k = ROCKS[i]
    spawnPickup('rock', k.x + 1.3 + rng() * 0.6, k.z + 0.9 + rng() * 0.6)
  }
  for (let i = 0; i < 6 && i < TREES.length; i++) {
    const t = TREES[i]
    spawnPickup('wood', t.x + 1.5 + rng() * 0.5, t.z - 1.2 - rng() * 0.5)
  }
  const spots: [number, number][] = [
    [2, 4],
    [-1, 5.5],
    [3.5, 1],
    [-4, 3],
    [1, -4],
    [-3, -3],
    [5, -2],
    [-5.5, 0.5],
  ]
  for (const [x, z] of spots) spawnPickup('flower', x + rng() * 0.4, z + rng() * 0.4)
}

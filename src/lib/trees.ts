import { spawnPickup } from './items'
import { clamp, smoothstep } from './math'
import { TREE_COLLIDERS, TREES } from './world'

export type TreePhase = 'up' | 'fall' | 'down' | 'grow'

export type TreeLife = {
  hits: number
  phase: TreePhase
  t: number
  dir: number
  shake: number
}

export const CHOPS_TO_FALL = 3
export const FALL_TIME = 1.4
export const DOWN_TIME = 40
export const GROW_TIME = 2.5
const MAX_ANGLE = 1.535

export const treeLife: TreeLife[] = TREES.map(() => ({
  hits: 0,
  phase: 'up' as TreePhase,
  t: 0,
  dir: 0,
  shake: 0,
}))

export function fallAngle(progress: number) {
  const p = clamp(progress, 0, 1)
  return p * p * p * MAX_ANGLE
}

export function restBounce(t: number) {
  if (t > 0.6) return 0
  return Math.sin(t * 16) * 0.05 * Math.exp(-t * 7)
}

export function growScale(t: number) {
  return 0.25 + 0.75 * smoothstep(0, 1, clamp(t / GROW_TIME, 0, 1))
}

export function hitTree(index: number, px: number, pz: number) {
  const life = treeLife[index]
  if (life.phase !== 'up') return false
  life.hits++
  life.shake = 1
  if (life.hits >= CHOPS_TO_FALL) {
    const t = TREES[index]
    life.phase = 'fall'
    life.t = 0
    life.dir = Math.atan2(t.x - px, t.z - pz)
    return true
  }
  return false
}

export function updateTrees(dt: number) {
  for (let i = 0; i < TREES.length; i++) {
    const life = treeLife[i]
    if (life.shake > 0) life.shake = Math.max(0, life.shake - dt * 3)
    if (life.phase === 'fall') {
      life.t += dt
      if (life.t >= FALL_TIME) {
        life.phase = 'down'
        life.t = 0
        const t = TREES[i]
        const sx = Math.sin(life.dir)
        const sz = Math.cos(life.dir)
        const tip = 1.1 * t.s
        const px = -sz
        const pz = sx
        spawnPickup('wood', t.x + sx * tip + px * 0.6, t.z + sz * tip + pz * 0.6)
        spawnPickup('wood', t.x + sx * (tip + 0.9) - px * 0.5, t.z + sz * (tip + 0.9) - pz * 0.5)
        TREE_COLLIDERS[i].r = 0.06
      }
    } else if (life.phase === 'down') {
      life.t += dt
      if (life.t >= DOWN_TIME) {
        life.phase = 'grow'
        life.t = 0
      }
    } else if (life.phase === 'grow') {
      life.t += dt
      if (life.t >= GROW_TIME) {
        life.phase = 'up'
        life.t = 0
        life.hits = 0
        life.dir = 0
        TREE_COLLIDERS[i].r = 0.5 * TREES[i].s
      }
    }
  }
}

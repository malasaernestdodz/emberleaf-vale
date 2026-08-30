import { playSfx } from './audio'
import { mulberry32 } from './math'
import { spawnPickup } from './items'
import { damagePlayer } from './health'
import { inc } from './trace'
import { COLLIDERS, FOUNTAIN, HOUSE, MANSION, POND, WELL, WINDMILL, WORLD_R, game, groundHeight, pathDistance } from './world'

export const SLIME_SPAWN = { x: 2.6, z: 6.4 }
export const SLIME_R = 0.45
export const SLIME_MAX_HP = 3

export type SlimeState = 'idle' | 'windup' | 'air' | 'hidden'

export const slime = {
  x: SLIME_SPAWN.x,
  z: SLIME_SPAWN.z,
  y: groundHeight(SLIME_SPAWN.x, SLIME_SPAWN.z),
  vx: 0,
  vz: 0,
  vy: 0,
  state: 'idle' as SlimeState,
  maxHp: SLIME_MAX_HP,
  hp: SLIME_MAX_HP,
  hits: 0,
  squish: 0,
  yaw: 0,
  idleT: 0.9,
  windT: 0,
  respawnT: 0,
}

export const slimeHud = { shown: true, frac: 1 }

function syncSlimeHud() {
  slimeHud.shown = slime.state !== 'hidden'
  slimeHud.frac = slimeHud.shown
    ? Math.round(Math.max(0, slime.hp / slime.maxHp) * 1000) / 1000
    : 0
}

export const slimeCollider = { t: 'c' as const, x: slime.x, z: slime.z, r: SLIME_R }
COLLIDERS.push(slimeCollider)

const rng = mulberry32(31337)

function keepOut(x: number, z: number) {
  if (pathDistance(x, z) < 1.5) return true
  if (Math.hypot(x - HOUSE.x, z - HOUSE.z) < 5.5) return true
  if (Math.hypot(x - MANSION.x, z - MANSION.z) < 12.5) return true
  if (Math.hypot(x - WINDMILL.x, z - WINDMILL.z) < 8.5) return true
  if (Math.hypot(x - POND.x, z - POND.z) < POND.r + 1.2) return true
  if (Math.hypot(x - WELL.x, z - WELL.z) < 2.4) return true
  if (Math.hypot(x - FOUNTAIN.x, z - FOUNTAIN.z) < 3.4) return true
  if (Math.hypot(x, z) > WORLD_R - 8) return true
  return false
}

function wanderTarget() {
  for (let i = 0; i < 12; i++) {
    const a = rng() * Math.PI * 2
    const d = 1.1 + rng() * 1.5
    const x = slime.x + Math.cos(a) * d
    const z = slime.z + Math.sin(a) * d
    if (!keepOut(x, z)) return { x, z }
  }
  return null
}

export function updateSlime(dt: number) {
  slime.squish = Math.max(0, slime.squish - dt * 3.2)
  if (slime.state === 'hidden') {
    slime.respawnT -= dt
    slimeCollider.r = 0
    if (slime.respawnT <= 0) {
      slime.x = SLIME_SPAWN.x
      slime.z = SLIME_SPAWN.z
      slime.y = groundHeight(slime.x, slime.z)
      slime.maxHp = SLIME_MAX_HP
      slime.hp = SLIME_MAX_HP
      slime.hits = 0
      slime.vx = 0
      slime.vz = 0
      slime.vy = 0
      slime.state = 'idle'
      slime.idleT = 0.6 + rng() * 0.8
      slimeCollider.r = SLIME_R
    }
    slimeCollider.x = slime.x
    slimeCollider.z = slime.z
    syncSlimeHud()
    return
  }

  slime.x += slime.vx * dt
  slime.z += slime.vz * dt
  const dmp = Math.exp(-6 * dt)
  slime.vx *= dmp
  slime.vz *= dmp

  const pdx = slime.x - game.x
  const pdz = slime.z - game.z
  const pd = Math.hypot(pdx, pdz)
  const minD = SLIME_R + 0.34
  if (pd < minD && pd > 1e-4) {
    const push = minD - pd
    slime.x += (pdx / pd) * push
    slime.z += (pdz / pd) * push
    slime.squish = Math.max(slime.squish, 0.35)
    damagePlayer(1, slime.x, slime.z)
  }

  if (slime.state === 'air') {
    slime.vy -= 12 * dt
    slime.y += slime.vy * dt
    const gh = groundHeight(slime.x, slime.z, slime.y + 0.5)
    if (slime.y <= gh && slime.vy < 0) {
      slime.y = gh
      slime.vy = 0
      slime.state = 'idle'
      slime.squish = 1
      slime.idleT = 1.4 + rng() * 1.2
      if (Math.hypot(game.x - slime.x, game.z - slime.z) < 1.35) {
        damagePlayer(1, slime.x, slime.z, 4.2)
      }
    }
  } else if (slime.state === 'windup') {
    slime.windT -= dt
    if (slime.windT <= 0) {
      const t = wanderTarget()
      if (t) {
        const dx = t.x - slime.x
        const dz = t.z - slime.z
        const flightT = 2 * 3.2 / 12
        slime.vx = dx / flightT
        slime.vz = dz / flightT
        slime.vy = 3.2
        slime.yaw = Math.atan2(dx, dz)
        slime.state = 'air'
        playSfx('hop')
      } else {
        slime.state = 'idle'
        slime.idleT = 1 + rng()
      }
    }
  } else {
    slime.y = groundHeight(slime.x, slime.z, slime.y)
    slime.idleT -= dt
    if (slime.idleT <= 0) {
      slime.state = 'windup'
      slime.windT = 0.28
    }
  }

  slimeCollider.x = slime.x
  slimeCollider.z = slime.z
  slimeCollider.r = SLIME_R
  syncSlimeHud()
}

export function applySlimeHit(px: number, pz: number, fx: number, fz: number): 'hit' | 'pop' | null {
  if (slime.state === 'hidden') return null
  const dx = slime.x - px
  const dz = slime.z - pz
  const dist = Math.hypot(dx, dz)
  if (dist > 1.45) return null
  const dot = (fx * dx + fz * dz) / (dist || 1)
  if (dot <= 0.5) return null
  slime.hits++
  slime.hp = Math.max(0, slime.maxHp - slime.hits)
  slime.squish = 1
  inc('slime.hit')
  const nx = dx / (dist || 1)
  const nz = dz / (dist || 1)
  slime.vx = nx * 4.5
  slime.vz = nz * 4.5
  if (slime.state === 'air') {
    slime.vy = Math.max(slime.vy, 1.2)
  }
  if (slime.hp <= 0) {
    inc('slime.pop')
    const n = 1 + Math.floor(rng() * 2)
    for (let i = 0; i < n; i++) {
      const a = rng() * Math.PI * 2
      const d = 0.25 + rng() * 0.55
      spawnPickup('gel', slime.x + Math.cos(a) * d, slime.z + Math.sin(a) * d, slime.y + 0.3)
    }
    slime.state = 'hidden'
    slime.respawnT = 20
    slime.vx = 0
    slime.vz = 0
    slime.vy = 0
    syncSlimeHud()
    return 'pop'
  }
  syncSlimeHud()
  return 'hit'
}

export function skipSlimeRespawn() {
  if (slime.state === 'hidden') slime.respawnT = 0.4
}

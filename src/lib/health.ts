import { playSfx } from './audio'
import { inc } from './trace'
import { SPAWN, game } from './world'

export const MAX_HP = 5
const REGEN_DELAY = 10
const REGEN_INTERVAL = 4
const INVULN_TIME = 1.2
const FAINT_TIME = 3.2

export const health = {
  hp: MAX_HP,
  maxHp: MAX_HP,
  hurtT: 0,
  invulnT: 0,
  regenWait: 0,
  regenT: 0,
  fainted: false,
  faintT: 0,
  faintVeil: 0,
}

export function healPlayer(n: number) {
  if (health.fainted) return
  health.hp = Math.min(health.maxHp, health.hp + n)
  inc('hp.heal', n)
}

export function fullHeal() {
  health.hp = health.maxHp
  health.regenWait = 0
  health.regenT = 0
}

export function damagePlayer(n: number, fromX: number, fromZ: number, knock = 3.4): boolean {
  if (health.fainted || health.invulnT > 0) return false
  health.hp = Math.max(0, health.hp - n)
  health.invulnT = INVULN_TIME
  health.hurtT = 1
  health.regenWait = REGEN_DELAY
  health.regenT = 0
  inc('health.damage', n)
  playSfx('hurt')
  inc('hp.damage', n)
  const dx = game.x - fromX
  const dz = game.z - fromZ
  const d = Math.hypot(dx, dz) || 1
  game.vx += (dx / d) * knock
  game.vz += (dz / d) * knock
  if (health.hp <= 0) {
    health.fainted = true
    health.faintT = 0
    inc('hp.faint')
  }
  return true
}

export function updateHealth(dt: number): boolean {
  if (health.invulnT > 0) health.invulnT = Math.max(0, health.invulnT - dt)
  if (health.hurtT > 0) health.hurtT = Math.max(0, health.hurtT - dt * 1.8)
  if (health.fainted) {
    health.faintT += dt
    health.faintVeil =
      health.faintT < 0.7
        ? health.faintT / 0.7
        : health.faintT < FAINT_TIME - 0.9
          ? 1
          : Math.max(0, (FAINT_TIME - health.faintT) / 0.9)
    if (health.faintT >= FAINT_TIME) {
      health.fainted = false
      health.faintVeil = 0
      fullHeal()
      health.invulnT = 1.5
      game.teleport(SPAWN.x, SPAWN.z)
    }
    return true
  }
  if (health.hp < health.maxHp) {
    health.regenWait -= dt
    if (health.regenWait <= 0) {
      health.regenT += dt
      if (health.regenT >= REGEN_INTERVAL) {
        health.regenT = 0
        health.hp++
        inc('hp.regen')
      }
    }
  } else {
    health.regenWait = 0
    health.regenT = 0
  }
  return false
}

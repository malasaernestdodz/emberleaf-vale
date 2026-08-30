import { COLLIDERS, type Collider } from './world'
import { inc } from './trace'

export const PLAYER_H = 1.55

export function colliderBlocks(c: Collider, feetY: number): boolean {
  const y0 = c.y0 ?? 0
  const top = c.top ?? Infinity
  return feetY <= top - 0.05 && feetY + PLAYER_H >= y0 + 0.05
}

export function colliderDims(c: Collider): string {
  const y0 = c.y0 ?? 0
  const top = c.top
  const h = top === undefined ? '∞' : (top - y0).toFixed(2)
  if (c.t === 'c') return `CYL r${c.r.toFixed(2)} h${h}`
  return `BOX ${(c.hw * 2).toFixed(2)}×${(c.hd * 2).toFixed(2)} h${h}`
}

let pushes = 0

export function resolveCollisions(px: number, pz: number, r: number, feetY: number): [number, number] {
  let x = px
  let z = pz
  pushes = 0
  for (let pass = 0; pass < 3; pass++) {
    for (const c of COLLIDERS) {
      const y0 = c.y0 ?? 0
      const y1 = c.top ?? Infinity
      if (feetY > y1 - 0.05) continue
      if (feetY + PLAYER_H < y0 + 0.05) continue
      if (c.t === 'c') {
        const dx = x - c.x
        const dz = z - c.z
        const d = Math.hypot(dx, dz)
        const m = r + c.r
        if (d < m) {
          if (d < 1e-6) {
            x = c.x + m
            pushes++
            continue
          }
          x = c.x + (dx / d) * m
          z = c.z + (dz / d) * m
          pushes++
        }
      } else {
        const cos = Math.cos(c.yaw)
        const sin = Math.sin(c.yaw)
        const dx = x - c.x
        const dz = z - c.z
        const lx = cos * dx - sin * dz
        const lz = sin * dx + cos * dz
        const ox = c.hw + r - Math.abs(lx)
        const oz = c.hd + r - Math.abs(lz)
        if (ox > 0 && oz > 0) {
          let nlx = lx
          let nlz = lz
          if (ox < oz) nlx = lx + Math.sign(lx || 1) * ox
          else nlz = lz + Math.sign(lz || 1) * oz
          x = c.x + nlx * cos + nlz * sin
          z = c.z - nlx * sin + nlz * cos
          pushes++
        }
      }
    }
  }
  if (pushes > 0) inc('collide.push', pushes)
  return [x, z]
}

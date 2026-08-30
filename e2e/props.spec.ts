import { expect, test } from '@playwright/test'
import {
  HOUSE,
  HOUSE_DOOR,
  MANSION,
  MANSION_DOOR,
  groundHeight,
  houseWorld,
  mansionWorld,
  terrainHeight,
} from '../src/lib/world'

type P2 = { x: number; z: number }

const dist2 = (ax: number, az: number, bx: number, bz: number) => Math.hypot(ax - bx, az - bz)

const circleClearOfSegment = (ax: number, az: number, bx: number, bz: number, c: P2, r: number) => {
  const abx = bx - ax
  const abz = bz - az
  const l2 = abx * abx + abz * abz || 1e-9
  let t = ((c.x - ax) * abx + (c.z - az) * abz) / l2
  t = Math.max(0, Math.min(1, t))
  return dist2(ax + abx * t, az + abz * t, c.x, c.z) - r
}

const leafPose = (d: typeof HOUSE_DOOR) => ({
  ax: d.hingeLX,
  az: d.leafZ,
  bx: d.hingeLX + Math.cos(d.swing) * d.openW,
  bz: d.leafZ - Math.sin(d.swing) * d.openW,
})

test.describe('house door assembly', () => {
  const d = HOUSE_DOOR

  test('leaf fills the wall opening edge to edge', () => {
    expect(d.openW).toBe(HOUSE.doorW)
    expect(d.openH).toBeCloseTo(2.1, 6)
    expect(d.hingeLX).toBeCloseTo(HOUSE.doorLX - HOUSE.doorW / 2, 6)
    expect(d.hingeLX + d.openW).toBeCloseTo(HOUSE.doorLX + HOUSE.doorW / 2, 6)
    expect(d.openH).toBeLessThanOrEqual(2.1 + 1e-9)
  })

  test('open leaf lies flat inside, clear of wall, frame, walk corridor and furniture', () => {
    expect(d.swing).toBeGreaterThan(2.5)
    expect(d.swing).toBeLessThanOrEqual(Math.PI)
    const p = leafPose(d)
    expect(p.bz).toBeLessThan(p.az)
    expect(p.bz).toBeLessThan(HOUSE.d / 2 - 0.32)
    expect(d.leafZ + d.leafT / 2).toBeLessThanOrEqual(HOUSE.d / 2 - 0.11)
    expect(d.frameZ - (d.leafZ + d.leafT / 2)).toBeGreaterThanOrEqual(0.02)
    const walk: P2 = { x: HOUSE.doorLX, z: HOUSE.d / 2 - 0.6 }
    expect(circleClearOfSegment(p.ax, p.az, p.bx, p.bz, walk, 0.37)).toBeGreaterThan(0)
    const obstacles: (P2 & { r: number })[] = [
      { x: 1.9, z: 0.8, r: 0.85 },
      { x: 2.6, z: 0.2, r: 0.28 },
      { x: 2.5, z: 1.4, r: 0.28 },
      { x: -2.4, z: -1.5, r: 1.45 },
      { x: 0.3, z: 0.4, r: 1.6 },
    ]
    for (const o of obstacles) {
      expect(circleClearOfSegment(p.ax, p.az, p.bx, p.bz, o, o.r + 0.05)).toBeGreaterThan(0)
    }
  })
})

test.describe('mansion door assembly', () => {
  const d = MANSION_DOOR

  test('leaf fills the wall opening edge to edge', () => {
    expect(d.openW).toBeCloseTo(1.8, 6)
    expect(d.openH).toBeCloseTo(2.6, 6)
    expect(d.hingeLX).toBeCloseTo(-1.8, 6)
    expect(d.hingeLX + d.openW).toBeCloseTo(0, 6)
  })

  test('jamb posts flank the opening instead of standing in it', () => {
    expect(d.jambPosts[0] + d.jambPostHalfW).toBeLessThanOrEqual(d.hingeLX + 1e-9)
    expect(d.jambPosts[1] - d.jambPostHalfW).toBeGreaterThanOrEqual(d.hingeLX + d.openW - 1e-9)
  })

  test('open leaf lies flat inside, clear of wall, frame, walk corridor and furniture', () => {
    expect(d.swing).toBeGreaterThan(2.5)
    expect(d.swing).toBeLessThanOrEqual(Math.PI)
    const p = leafPose(d)
    expect(p.bz).toBeLessThan(p.az)
    expect(p.bz).toBeLessThan(MANSION.d / 2 - 0.32)
    expect(d.leafZ + d.leafT / 2).toBeLessThanOrEqual(MANSION.d / 2 - 0.11)
    expect(d.frameZ - (d.leafZ + d.leafT / 2)).toBeGreaterThanOrEqual(0.02)
    expect(d.lintelY).toBeGreaterThanOrEqual(d.openH + 0.05)
    const walk: P2 = { x: d.hingeLX + d.openW / 2, z: MANSION.d / 2 - 0.6 }
    expect(circleClearOfSegment(p.ax, p.az, p.bx, p.bz, walk, 0.37)).toBeGreaterThan(0)
    const obstacles: (P2 & { r: number })[] = [
      { x: -1.9, z: 0.95, r: 0.3 },
      { x: -1.9, z: 2.05, r: 0.3 },
      { x: 1.9, z: 0.95, r: 0.3 },
      { x: 1.9, z: 2.05, r: 0.3 },
      { x: 0, z: 1.5, r: 2.0 },
      { x: 3.5, z: -3.0, r: 1.3 },
      { x: -7.05, z: 0.5, r: 1.6 },
      { x: -6.8, z: 5.2, r: 0.4 },
      { x: -6.8, z: -0.8, r: 0.4 },
    ]
    for (const o of obstacles) {
      expect(circleClearOfSegment(p.ax, p.az, p.bx, p.bz, o, o.r + 0.05)).toBeGreaterThan(0)
    }
  })
})

test.describe('terrain fits the buildings', () => {
  test('grade stays below the house floor across the whole footprint', () => {
    for (let ix = 0; ix <= 13; ix++) {
      for (let iz = 0; iz <= 11; iz++) {
        const lx = -3.4 + (ix / 13) * 6.8
        const lz = -2.9 + (iz / 11) * 5.8
        const w = houseWorld(lx, lz)
        expect(terrainHeight(w.x, w.z)).toBeLessThanOrEqual(0.13)
        expect(groundHeight(w.x, w.z)).toBeGreaterThanOrEqual(0.18)
      }
    }
  })

  test('grade stays below the mansion floor across the whole footprint', () => {
    for (let ix = 0; ix <= 15; ix++) {
      for (let iz = 0; iz <= 13; iz++) {
        const lx = -7.3 + (ix / 15) * 14.6
        const lz = -5.8 + (iz / 13) * 11.6
        const w = mansionWorld(lx, lz)
        expect(terrainHeight(w.x, w.z)).toBeLessThanOrEqual(0.2)
        expect(groundHeight(w.x, w.z)).toBeGreaterThanOrEqual(MANSION.floorY - 0.001)
      }
    }
  })

  test('grade hugs the walls so bases are neither buried nor floating', () => {
    for (const s of [-1, 1]) {
      const w1 = houseWorld(s * (HOUSE.w / 2 - 0.3), HOUSE.d / 2 + 0.6)
      const w2 = houseWorld(s * (HOUSE.w / 2 - 0.3), -HOUSE.d / 2 - 0.6)
      const w3 = houseWorld(HOUSE.w / 2 + 0.6, s * (HOUSE.d / 2 - 0.3))
      for (const w of [w1, w2, w3]) {
        expect(terrainHeight(w.x, w.z)).toBeLessThanOrEqual(0.18)
      }
      const m1 = mansionWorld(s * (MANSION.w / 2 - 0.4), MANSION.d / 2 + 0.6)
      const m2 = mansionWorld(s * (MANSION.w / 2 - 0.4), -MANSION.d / 2 - 0.6)
      const m3 = mansionWorld(MANSION.w / 2 + 0.6, s * (MANSION.d / 2 - 0.4))
      for (const m of [m1, m2, m3]) {
        expect(terrainHeight(m.x, m.z)).toBeLessThanOrEqual(MANSION.floorY)
      }
    }
  })

  test('door thresholds are walkable with no collider in the opening', () => {
    for (const frac of [-0.35, 0, 0.35]) {
      const h = houseWorld(HOUSE.doorLX + frac * HOUSE.doorW, HOUSE.d / 2)
      expect(groundHeight(h.x, h.z, 0.2)).toBeLessThan(0.2)
      const m = mansionWorld(MANSION_DOOR.hingeLX + MANSION_DOOR.openW / 2 + frac * MANSION_DOOR.openW, MANSION.d / 2)
      const g = groundHeight(m.x, m.z, MANSION.floorY)
      expect(g).toBeGreaterThanOrEqual(MANSION.floorY - 0.35)
      expect(g).toBeLessThan(0.6)
    }
  })

  test('door thresholds stay walkable end to end', () => {
    for (const frac of [-0.35, 0, 0.35]) {
      const h = houseWorld(HOUSE.doorLX + frac * HOUSE.doorW, HOUSE.d / 2)
      expect(groundHeight(h.x, h.z, 0.2)).toBeLessThan(0.2)
      const m = mansionWorld(MANSION_DOOR.hingeLX + MANSION_DOOR.openW / 2 + frac * MANSION_DOOR.openW, MANSION.d / 2)
      const g = groundHeight(m.x, m.z, MANSION.floorY)
      expect(g).toBeGreaterThanOrEqual(MANSION.floorY - 0.35)
      expect(g).toBeLessThan(0.6)
    }
  })
})

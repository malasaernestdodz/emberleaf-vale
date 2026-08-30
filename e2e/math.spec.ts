import { test, expect } from '@playwright/test'
import {
  FOUNTAIN,
  HOUSE,
  MANSION,
  MANSION_STAIR,
  MILL,
  MILL_ARC,
  WELL,
  WORLD_R,
  groundHeight,
  houseWorld,
  mansionWorld,
  millWorld,
  terrainHeight,
} from '../src/lib/world'

const TAU = Math.PI * 2

test('house floor height applies inside the footprint', () => {
  const c = houseWorld(0, 0)
  expect(groundHeight(c.x, c.z)).toBeCloseTo(0.19, 2)
  const outside = houseWorld(HOUSE.w, 0)
  expect(groundHeight(outside.x, outside.z)).toBeLessThan(0.19)
})

test('mansion has two distinct floor heights and a continuous stair', () => {
  const hall = mansionWorld(-3, 2)
  expect(groundHeight(hall.x, hall.z)).toBeCloseTo(MANSION.floorY, 2)
  const slab = mansionWorld(0, -4)
  expect(groundHeight(slab.x, slab.z, MANSION.floor2)).toBeCloseTo(MANSION.floor2, 2)
  expect(groundHeight(slab.x, slab.z, 0.3)).toBeCloseTo(MANSION.floorY, 2)
  const st = MANSION_STAIR
  let prev = MANSION.floorY
  for (let i = 1; i <= 12; i++) {
    const lx = st.lx0 + 0.2 + (i / 12) * (st.lx1 - st.lx0 - 0.4)
    const p = mansionWorld(lx, (st.lz0 + st.lz1) / 2)
    const h = groundHeight(p.x, p.z, MANSION.floor2)
    expect(h).toBeGreaterThanOrEqual(prev - 0.01)
    expect(h).toBeLessThanOrEqual(MANSION.floor2 + 0.01)
    prev = h
  }
  expect(prev).toBeGreaterThan(MANSION.floor2 - 0.25)
})

test('windmill spiral rises monotonically with no seams above step height', () => {
  let prev = MILL.base
  for (let i = 0; i <= 60; i++) {
    const phi = MILL.doorPhi + 0.05 + (i / 60) * (MILL_ARC - 0.1)
    const p = millWorld(-Math.sin(phi) * 2.05, Math.cos(phi) * 2.05)
    const h = groundHeight(p.x, p.z)
    expect(h).toBeGreaterThanOrEqual(prev - 0.01)
    expect(h).toBeLessThanOrEqual(MILL.base + MILL.top + 0.01)
    prev = h
  }
  expect(prev).toBeGreaterThan(MILL.base + MILL.top - 0.3)
  const center = millWorld(0, 0)
  expect(groundHeight(center.x, center.z)).toBeCloseTo(MILL.base + 0.5, 1)
  const doorWedge = millWorld(-Math.sin(0.1) * 2.0, Math.cos(0.1) * 2.0)
  expect(groundHeight(doorWedge.x, doorWedge.z)).toBeLessThan(MILL.base + 0.2)
  const landingPhi = TAU - MILL.doorPhi - MILL.topPhi / 2
  const landing = millWorld(-Math.sin(landingPhi) * 2.05, Math.cos(landingPhi) * 2.05)
  expect(groundHeight(landing.x, landing.z)).toBeCloseTo(MILL.base + MILL.top, 2)
  const gap = Math.abs(MILL.top - 0.02 - ((MILL_ARC - MILL.topPhi) / MILL_ARC) * (MILL.top - 0.02))
  expect(gap).toBeLessThan(0.55)
})

test('fountain rim and water heights match the mesh', () => {
  const rim = { x: FOUNTAIN.x + 1.9, z: FOUNTAIN.z }
  expect(groundHeight(rim.x, rim.z)).toBeCloseTo(0.56, 2)
  const water = { x: FOUNTAIN.x + 0.9, z: FOUNTAIN.z }
  expect(groundHeight(water.x, water.z)).toBeCloseTo(0.48, 2)
  const outside = { x: FOUNTAIN.x + 2.4, z: FOUNTAIN.z }
  expect(groundHeight(outside.x, outside.z)).toBeLessThan(0.1)
})

test('well rim is standable and the inside drops to the bottom', () => {
  const rim = { x: WELL.x + 0.9, z: WELL.z }
  expect(groundHeight(rim.x, rim.z)).toBeCloseTo(0.78, 2)
  const inside = { x: WELL.x, z: WELL.z }
  expect(groundHeight(inside.x, inside.z)).toBeLessThan(0.2)
})

test('every walkable height is reachable or intentional (no NaN, sane bounds)', () => {
  for (let x = -60; x <= 60; x += 7) {
    for (let z = -60; z <= 60; z += 7) {
      const h = groundHeight(x, z)
      expect(Number.isFinite(h)).toBe(true)
      expect(h).toBeGreaterThan(-3)
      expect(h).toBeLessThan(14)
    }
  }
})

test('terrain stays inside the world radius', () => {
  for (let a = 0; a < TAU; a += 0.4) {
    const h = terrainHeight(Math.cos(a) * WORLD_R, Math.sin(a) * WORLD_R)
    expect(Number.isFinite(h)).toBe(true)
    expect(Math.abs(h)).toBeLessThan(6)
  }
})

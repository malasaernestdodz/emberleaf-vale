import { test, expect } from '@playwright/test'
import {
  FOUNTAIN,
  HOUSE,
  MANSION,
  MILL,
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
  const f1 = mansionWorld(0, 2)
  expect(groundHeight(f1.x, f1.z)).toBeCloseTo(MANSION.floorY, 2)
  const f2 = mansionWorld(0, -3)
  expect(groundHeight(f2.x, f2.z)).toBeCloseTo(MANSION.floor2, 2)
  let prev = MANSION.floorY
  for (let i = 1; i <= 10; i++) {
    const lz = 3.4 - (i / 10) * 3.6
    const p = mansionWorld(2.9, lz)
    const h = groundHeight(p.x, p.z)
    expect(h).toBeGreaterThanOrEqual(prev - 0.01)
    expect(h).toBeLessThanOrEqual(MANSION.floor2 + 0.01)
    prev = h
  }
  expect(prev).toBeGreaterThan(MANSION.floor2 - 0.2)
})

test('windmill spiral rises monotonically with no seams above step height', () => {
  let prev = MILL.base
  for (let i = 0; i <= 60; i++) {
    const phi = 0.4 + (i / 60) * (TAU - 0.8)
    const p = millWorld(-Math.sin(phi) * 2.0, Math.cos(phi) * 2.0)
    const h = groundHeight(p.x, p.z)
    expect(h).toBeGreaterThanOrEqual(prev - 0.01)
    expect(h).toBeLessThanOrEqual(MILL.base + MILL.top + 0.01)
    prev = h
  }
  expect(prev).toBeGreaterThan(MILL.base + MILL.top - 0.3)
  const center = millWorld(0, 0)
  expect(groundHeight(center.x, center.z)).toBeCloseTo(MILL.base + 0.38, 2)
  const besideStone = millWorld(1.1, 0)
  expect(groundHeight(besideStone.x, besideStone.z)).toBeCloseTo(MILL.base + 0.02, 2)
  const doorWedge = millWorld(-Math.sin(0.1) * 2.0, Math.cos(0.1) * 2.0)
  expect(groundHeight(doorWedge.x, doorWedge.z)).toBeLessThan(MILL.base + 0.2)
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
      expect(h).toBeLessThan(12)
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

import { test, expect } from '@playwright/test'
import {
  FOUNTAIN,
  HOUSE,
  HOUSE_ROOF_PROFILE,
  MANSION,
  MANSION_STAIR,
  MANSION_STAIRWELL,
  MILL,
  MILL_ARC,
  WELL,
  WORLD_R,
  groundHeight,
  houseRoofY,
  houseWorld,
  mansionWorld,
  millWorld,
  terrainHeight,
} from '../src/lib/world'

const TAU = Math.PI * 2

test('house floor height applies inside the footprint', () => {
  const c = houseWorld(0, 0)
  expect(groundHeight(c.x, c.z, 0.19)).toBeCloseTo(0.19, 2)
  const roof = groundHeight(c.x, c.z, 5.0)
  expect(roof).toBeGreaterThan(3)
  const outside = houseWorld(HOUSE.w, 0)
  expect(groundHeight(outside.x, outside.z)).toBeLessThan(0.19)
})

test('mansion has two distinct floor heights and a continuous stair', () => {
  const hall = mansionWorld(-3, 2)
  expect(groundHeight(hall.x, hall.z)).toBeCloseTo(MANSION.floorY, 2)
  const slab = mansionWorld(4.5, -4)
  expect(groundHeight(slab.x, slab.z, MANSION.floor2)).toBeCloseTo(MANSION.floor2, 2)
  expect(groundHeight(slab.x, slab.z, 0.3)).toBeCloseTo(MANSION.floorY, 2)
  const well = mansionWorld(-0.2, -5)
  const wellH = groundHeight(well.x, well.z, MANSION.floor2)
  expect(wellH).toBeGreaterThan(MANSION.floorY)
  expect(wellH).toBeLessThan(MANSION.floor2 - 0.3)
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
  const holeEdge = mansionWorld(MANSION_STAIRWELL.lx1 - 0.05, -5)
  expect(groundHeight(holeEdge.x, holeEdge.z, MANSION.floor2)).toBeCloseTo(MANSION.floor2, 2)
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
  expect(groundHeight(center.x, center.z)).toBeCloseTo(MILL.base + MILL.floorH, 1)
  const doorWedge = millWorld(-Math.sin(0.1) * 2.0, Math.cos(0.1) * 2.0)
  expect(groundHeight(doorWedge.x, doorWedge.z)).toBeCloseTo(MILL.base + MILL.floorH, 1)
  const underSpiral = millWorld(-Math.sin(Math.PI) * 1.5, Math.cos(Math.PI) * 1.5)
  expect(groundHeight(underSpiral.x, underSpiral.z)).toBeCloseTo(MILL.base + MILL.floorH, 1)
  const rampMid = millWorld(-Math.sin(Math.PI) * 2.5, Math.cos(Math.PI) * 2.5)
  const midRamp = groundHeight(rampMid.x, rampMid.z)
  expect(midRamp).toBeGreaterThan(MILL.base + MILL.floorH + 2)
  expect(groundHeight(rampMid.x, rampMid.z, MILL.base + 0.2)).toBeCloseTo(MILL.base + MILL.floorH, 1)
  const landingPhi = TAU - MILL.doorPhi - MILL.topPhi / 2
  const landing = millWorld(-Math.sin(landingPhi) * 2.05, Math.cos(landingPhi) * 2.05)
  expect(groundHeight(landing.x, landing.z)).toBeCloseTo(MILL.base + MILL.top, 2)
  const gap = Math.abs(
    MILL.top - MILL.floorH - ((MILL_ARC - MILL.topPhi) / MILL_ARC) * (MILL.top - MILL.floorH)
  )
  expect(gap).toBeLessThan(0.55)
})

test('windmill porch, skirt and entry steps match the plinth mesh', () => {
  const porch = millWorld(0, MILL.porchR - 0.2)
  expect(groundHeight(porch.x, porch.z)).toBeCloseTo(MILL.base + MILL.floorH, 2)
  const skirt = millWorld(2, Math.sqrt((MILL.porchR + MILL.skirtR) ** 2 / 4 - 4))
  expect(groundHeight(skirt.x, skirt.z)).toBeCloseTo(MILL.base + MILL.floorH / 2, 2)
  const skirtEdge = millWorld(0, MILL.skirtR - 0.02)
  expect(groundHeight(skirtEdge.x, skirtEdge.z)).toBeLessThan(MILL.base + 0.1)
  const step1 = millWorld(0, 6.0)
  expect(groundHeight(step1.x, step1.z)).toBeCloseTo(MILL.base + MILL.step1Top, 2)
  const step2 = millWorld(0, 6.6)
  expect(groundHeight(step2.x, step2.z)).toBeCloseTo(MILL.base + MILL.step2Top, 2)
  const ground = millWorld(0, 7.4)
  expect(groundHeight(ground.x, ground.z)).toBeLessThan(MILL.base + 0.05)
  const porchSide = millWorld(2.6, 4.0)
  expect(groundHeight(porchSide.x, porchSide.z)).toBeCloseTo(MILL.base + MILL.floorH, 2)
})

test('cottage roof walkable equals the shared profile', () => {
  expect(houseRoofY(0)).toBeCloseTo(5.6, 2)
  expect(houseRoofY(6.16)).toBeCloseTo(3.0, 2)
  for (const [i, p] of HOUSE_ROOF_PROFILE.entries()) {
    if (i === 0) continue
    expect(houseRoofY(p.r - 1e-6)).toBeCloseTo(p.y, 2)
  }
  const under = houseWorld(5.5, 0)
  expect(groundHeight(under.x, under.z, 0.2)).toBeLessThan(0.3)
  const onTop = houseWorld(5.5, 0)
  expect(groundHeight(onTop.x, onTop.z, 5.2)).toBeCloseTo(houseRoofY(5.5), 2)
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

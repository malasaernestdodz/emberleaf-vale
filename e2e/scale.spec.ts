import { expect, test } from '@playwright/test'
import {
  HOUSE,
  MANSION,
  MANSION_SLAB_LZ,
  MANSION_STAIR,
  MILL,
  MILL_ARC,
  MILL_DOOR_CLEAR,
  MILL_TOWER,
  MILL_WALL_HW,
  PLAZA,
  PLAYER,
  WELL,
  groundHeight,
  mansionWorld,
  millWorld,
} from '../src/lib/world'

const dist = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z)

test('windmill is grand-mill scaled against the player', () => {
  expect(MILL_TOWER.h).toBeGreaterThanOrEqual(8 * PLAYER.h)
  expect(MILL.rWall).toBeGreaterThanOrEqual(3 * PLAYER.h)
  expect(MILL_TOWER.sailR).toBeGreaterThanOrEqual(0.4 * MILL_TOWER.h)
  const doorClear = 2 * MILL_DOOR_CLEAR * MILL.rWall
  expect(doorClear).toBeGreaterThanOrEqual(2.5 * 2 * PLAYER.r)
  expect(doorClear).toBeLessThan(0.5 * MILL.rWall)
})

test('windmill wall tiling is sealed around the door', () => {
  const hw = MILL_WALL_HW
  const halfA = Math.atan2(hw, MILL.rWall)
  expect(2 * hw).toBeGreaterThanOrEqual(2 * halfA * MILL.rWall)
  const first = MILL_DOOR_CLEAR + halfA
  const last = Math.PI * 2 - MILL_DOOR_CLEAR - halfA
  const count = Math.max(1, Math.ceil((last - first) / (2 * halfA)))
  expect(count).toBeGreaterThanOrEqual(20)
  const step = count > 1 ? (last - first) / (count - 1) : 0
  expect(step).toBeLessThanOrEqual(2 * halfA + 1e-9)
  const farEdge = first + (count - 1) * step + halfA
  expect(farEdge).toBeGreaterThanOrEqual(Math.PI * 2 - MILL_DOOR_CLEAR - 1e-9)
})

test('windmill interior keeps every sector single-valued and walkable', () => {
  const wedge = millWorld(0, MILL.rIn - 0.2)
  expect(groundHeight(wedge.x, wedge.z)).toBeLessThan(MILL.base + 0.2)
  const landingPhi = Math.PI * 2 - MILL.doorPhi - MILL.topPhi / 2
  const landing = millWorld(-Math.sin(landingPhi) * 2.625, Math.cos(landingPhi) * 2.625)
  expect(groundHeight(landing.x, landing.z)).toBeCloseTo(MILL.base + MILL.top, 2)
  const rampStepAtLanding = MILL.top - 0.02 - ((MILL_ARC - MILL.topPhi) / MILL_ARC) * (MILL.top - 0.02)
  expect(rampStepAtLanding).toBeLessThanOrEqual(PLAYER.step)
  const spiralGrade = (MILL.top - 0.02) / (MILL_ARC * (MILL.rCenter + MILL.rIn) / 2)
  expect(spiralGrade).toBeGreaterThan(0.15)
  expect(spiralGrade).toBeLessThan(0.55)
})

test('mansion staircase sits deep in the plan, far from the well and entrance', () => {
  const bottom = mansionWorld(MANSION_STAIR.lx0 + 0.4, (MANSION_STAIR.lz0 + MANSION_STAIR.lz1) / 2)
  expect(dist(bottom, WELL)).toBeGreaterThanOrEqual(18)
  const frontDoor = mansionWorld(-0.9, MANSION.d / 2)
  expect(dist(bottom, frontDoor)).toBeGreaterThanOrEqual(4)
  expect(MANSION_STAIR.lz1).toBeLessThan(-3.5)
  const slope = (MANSION.floor2 - MANSION.floorY) / (MANSION_STAIR.lx1 - MANSION_STAIR.lx0)
  expect(slope).toBeGreaterThan(0.3)
  expect(slope).toBeLessThan(0.5)
  const visualRise = (MANSION.floor2 - MANSION.floorY) / MANSION_STAIR.steps
  expect(visualRise).toBeGreaterThanOrEqual(0.15)
  expect(visualRise).toBeLessThanOrEqual(0.21)
})

test('building openings and storeys clear the player', () => {
  expect(2.6).toBeGreaterThanOrEqual(1.5 * PLAYER.h)
  expect(MANSION.floor2 - MANSION.floorY).toBeGreaterThanOrEqual(1.8 * PLAYER.h)
  expect(MANSION.floor2 + 1).toBeGreaterThan(MANSION.floor2 + PLAYER.jumpApex)
  const stairFrontRail = MANSION_STAIR.lz1
  expect(stairFrontRail).toBeLessThan(MANSION_SLAB_LZ - 0.5)
})

test('landmarks keep their spacing from each other', () => {
  const mansionFront = mansionWorld(-0.9, MANSION.d / 2)
  expect(dist(mansionFront, WELL)).toBeGreaterThanOrEqual(12)
  expect(dist({ x: HOUSE.x, z: HOUSE.z }, WELL)).toBeGreaterThanOrEqual(8)
  expect(dist({ x: MILL.x, z: MILL.z }, PLAZA)).toBeGreaterThanOrEqual(30)
  expect(dist({ x: MILL.x, z: MILL.z }, { x: MANSION.x, z: MANSION.z })).toBeGreaterThanOrEqual(45)
})

test('visual scale records: player at the windmill door and on the mansion stair', async ({ page }) => {
  const api = () => page.evaluateHandle(() => (window as unknown as { __Ghibli: { snapshot: () => { ready: boolean }; teleport: (x: number, z: number) => void; setCamYaw: (y: number) => void } }).__Ghibli)
  await page.goto('/?lite')
  await page.waitForFunction(
    () => (window as unknown as { __Ghibli?: { snapshot?: () => { ready: boolean } } }).__Ghibli?.snapshot?.()?.ready === true,
    null,
    { timeout: 120_000 }
  )
  const h = await api()
  const doorOutside = millWorld(0, MILL.rWall + 2.2)
  await page.evaluate(
    ({ a, x, z, yaw }) => {
      a.teleport(x, z)
      a.setCamYaw(yaw)
    },
    { a: h, x: doorOutside.x, z: doorOutside.z, yaw: MILL.yaw + Math.PI }
  )
  await page.waitForTimeout(600)
  await page.screenshot({ path: 'test-results/scale-windmill-door.png' })
  const s1 = await page.evaluate(() => (window as unknown as { __Ghibli: { snapshot: () => { x: number; z: number } } }).__Ghibli.snapshot())
  expect(Math.hypot(s1.x - MILL.x, s1.z - MILL.z)).toBeGreaterThan(MILL.rWall)

  const stairBottom = mansionWorld(MANSION_STAIR.lx0 + 0.6, (MANSION_STAIR.lz0 + MANSION_STAIR.lz1) / 2)
  await page.evaluate(
    ({ a, x, z, yaw }) => {
      a.teleport(x, z)
      a.setCamYaw(yaw)
    },
    { a: h, x: stairBottom.x, z: stairBottom.z, yaw: -MANSION.yaw - 0.6 }
  )
  await page.waitForTimeout(600)
  await page.screenshot({ path: 'test-results/scale-mansion-stair.png' })
  const s2 = await page.evaluate(() => (window as unknown as { __Ghibli: { snapshot: () => { y: number } } }).__Ghibli.snapshot())
  expect(s2.y).toBeLessThan(MANSION.floorY + 0.4)
})

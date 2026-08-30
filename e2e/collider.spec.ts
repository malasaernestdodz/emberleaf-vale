import { expect, test, type Page } from '@playwright/test'
import { COLLIDERS, FOUNTAIN, HOUSE, MILL, MILL_TOWER, TREES, millWorld } from '../src/lib/world'

const FOUNTAIN_TOP = 2.6

const pressUntil = async (page: Page, keys: string[], check: (s: Snap) => boolean) => {
  for (let i = 0; i < 6; i++) {
    for (const k of keys) await page.keyboard.press(k)
    for (let j = 0; j < 8; j++) {
      if (check(await snap(page))) return true
      await page.waitForTimeout(250)
    }
  }
  return false
}

type Snap = {
  ready: boolean
  x: number
  y: number
  z: number
  colliders: boolean
  colSolid: boolean
  drawCalls: number
  fps: number
}

type Api = {
  snapshot: () => Snap
  teleport: (x: number, z: number, high?: boolean) => void
  setCamYaw: (y: number) => void
}

const snap = (page: Page) => page.evaluate(() => (window as unknown as { __Ghibli: Api }).__Ghibli.snapshot())

const lookAt = (from: { x: number; z: number }, to: { x: number; z: number }) =>
  Math.atan2(-(to.x - from.x), -(to.z - from.z))

test.beforeEach(async ({ page }) => {
  await page.goto('/?lite')
  await page.waitForFunction(
    () => (window as unknown as { __Ghibli?: { snapshot?: () => { ready: boolean } } }).__Ghibli?.snapshot?.()?.ready === true,
    null,
    { timeout: 120_000 }
  )
})

test('every collider has finite, positive vertical bounds', () => {
  for (const c of COLLIDERS) {
    const y0 = c.y0 ?? 0
    expect(c.top, `collider at ${c.x.toFixed(1)},${c.z.toFixed(1)} needs a top`).toBeDefined()
    expect(c.top!).toBeLessThan(40)
    if (c.top! >= 0) expect(c.top!).toBeGreaterThan(y0)
  }
})

test('tree colliders hug the trunk instead of towering over the canopy', () => {
  expect(TREES.length).toBeGreaterThan(3)
  for (const t of TREES) {
    const c = COLLIDERS.find((k) => k.t === 'c' && Math.hypot(k.x - t.x, k.z - t.z) < 0.3)
    expect(c).toBeTruthy()
    expect(c!.top! - t.y).toBeGreaterThan(1.8)
    expect(c!.top! - t.y).toBeLessThan(4.6 * t.s + 0.6)
  }
})

test('C toggles the wire overlay and V toggles the solid shapes end to end', async ({ page }) => {
  expect((await snap(page)).colliders).toBe(false)
  expect((await snap(page)).colSolid).toBe(false)
  await page.keyboard.press('KeyC')
  let wire = false
  for (let i = 0; i < 12 && !wire; i++) {
    wire = (await snap(page)).colliders
    if (!wire) await page.waitForTimeout(250)
  }
  expect(wire).toBe(true)
  await page.keyboard.press('KeyV')
  let solid = false
  for (let i = 0; i < 12 && !solid; i++) {
    solid = (await snap(page)).colSolid
    if (!solid) await page.waitForTimeout(250)
  }
  expect(solid).toBe(true)
  const s = await snap(page)
  expect(s.drawCalls).toBeLessThan(420)
  expect(s.fps).toBeGreaterThan(2)
  await page.keyboard.press('KeyC')
  await page.keyboard.press('KeyV')
  let bothOff = false
  for (let i = 0; i < 12 && !bothOff; i++) {
    const n = await snap(page)
    bothOff = !n.colliders && !n.colSolid
    if (!bothOff) await page.waitForTimeout(250)
  }
  expect(bothOff).toBe(true)
})

test('collider debug renders end to end at the house, windmill and trees', async ({ page }) => {
  const h = await page.evaluateHandle(() => (window as unknown as { __Ghibli: Api }).__Ghibli)
  const houseSpot = { x: 7, z: -3.5 }
  await page.evaluate(
    ({ a, x, z, yaw }) => {
      a.teleport(x, z)
      a.setCamYaw(yaw)
    },
    { a: h, x: houseSpot.x, z: houseSpot.z, yaw: lookAt(houseSpot, HOUSE) }
  )
  await page.waitForTimeout(500)
  await page.keyboard.press('KeyC')
  await page.waitForTimeout(600)
  await page.screenshot({ path: 'test-results/collider-wire-house.png' })

  await page.keyboard.press('KeyV')
  await page.waitForTimeout(600)
  await page.screenshot({ path: 'test-results/collider-solid-house.png' })
  let s = await snap(page)
  expect(s.colliders).toBe(true)
  expect(s.colSolid).toBe(true)

  const millSpot = millWorld(0, MILL.skirtR + 5)
  await page.evaluate(
    ({ a, x, z, yaw }) => {
      a.teleport(x, z)
      a.setCamYaw(yaw)
    },
    { a: h, x: millSpot.x, z: millSpot.z, yaw: lookAt(millSpot, MILL) }
  )
  await page.waitForTimeout(700)
  await page.screenshot({ path: 'test-results/collider-solid-windmill.png' })

  const t = TREES[0]
  const treeSpot = { x: t.x, z: t.z + 5.5 }
  await page.evaluate(
    ({ a, x, z, yaw }) => {
      a.teleport(x, z)
      a.setCamYaw(yaw)
    },
    { a: h, x: treeSpot.x, z: treeSpot.z, yaw: lookAt(treeSpot, t) }
  )
  await page.waitForTimeout(700)
  await page.screenshot({ path: 'test-results/collider-solid-tree.png' })

  const off = await pressUntil(page, ['KeyC', 'KeyV'], (n) => !n.colliders && !n.colSolid)
  expect(off).toBe(true)
  s = await snap(page)
  expect(s.colliders).toBe(false)
  expect(s.colSolid).toBe(false)
})

test('solid shapes match the visible meshes at the fountain, windmill wall and trees', async ({ page }) => {
  const h = await page.evaluateHandle(() => (window as unknown as { __Ghibli: Api }).__Ghibli)
  const raycast = (x: number, z: number, fromY: number) =>
    page.evaluate(
      ({ x, z, fromY }) => {
        const g = (window as unknown as { __Ghibli: Api & { raycastDown: (x: number, z: number, y: number) => number | null } }).__Ghibli
        return g.raycastDown(x, z, fromY)
      },
      { x, z, fromY }
    )

  const finial = await raycast(FOUNTAIN.x, FOUNTAIN.z, 6)
  expect(finial).not.toBeNull()
  expect(Math.abs(finial! - FOUNTAIN_TOP)).toBeLessThan(0.2)

  const millWall = millWorld(MILL.rWall, 0)
  const millMeshY = await raycast(millWall.x, millWall.z, MILL.base + 20)
  expect(millMeshY).not.toBeNull()
  const millTop = MILL.base + 0.6 + MILL_TOWER.h
  const ring = COLLIDERS.filter(
    (c) => c.t === 'b' && Math.abs(c.x - millWall.x) < 1.2 && Math.abs(c.z - millWall.z) < 1.2
  )
  expect(ring.length).toBeGreaterThan(0)
  for (const c of ring) {
    expect(c.y0!).toBeCloseTo(MILL.base + MILL.floorH, 1)
    expect(c.top!).toBeCloseTo(millTop, 1)
  }
  expect(millMeshY!).toBeLessThanOrEqual(millTop + 0.35)
  expect(millMeshY!).toBeGreaterThan(MILL.base + MILL.floorH)

  const t = TREES[0]
  const canopy = await raycast(t.x, t.z, t.y + 12)
  expect(canopy).not.toBeNull()
  const tree = COLLIDERS.find((k) => k.t === 'c' && Math.hypot(k.x - t.x, k.z - t.z) < 0.3)
  expect(tree).toBeTruthy()
  expect(tree!.top!).toBeGreaterThan(t.y + 1.2)
  expect(tree!.top!).toBeLessThan(canopy! + 0.2)
  await page.evaluate((a) => a.teleport(0, 8), h)
})

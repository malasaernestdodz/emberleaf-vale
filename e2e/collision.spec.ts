import { expect, test, type Page } from '@playwright/test'
import {
  COLLIDERS,
  HOUSE,
  MANSION,
  MANSION_BALCONY,
  MANSION_STAIR,
  MANSION_STAIRWELL,
  MILL,
  MILL_BALCONY,
  MILL_TOWER,
  MILL_WALL_HW,
  houseRoofY,
  houseWorld,
  mansionWorld,
  millWorld,
  type Collider,
} from '../src/lib/world'

type Snap = {
  ready: boolean
  t: number
  x: number
  y: number
  z: number
  lx: number
  lz: number
  mlx: number
  mlz: number
  mllx: number
  mllz: number
  grounded: boolean
  mode: string
  drawCalls: number
  fps: number
  near: string
  quests: { ver: number; done: number; list: { id: string; progress: number; target: number; done: boolean }[] }
}

type Api = {
  snapshot: () => Snap
  teleport: (x: number, z: number, high?: boolean) => void
  setCamYaw: (y: number) => void
  raycastDown: (x: number, z: number, fromY: number) => number | null
}

const api = (page: Page) => page.evaluateHandle(() => (window as unknown as { __Ghibli: Api }).__Ghibli)

const snap = (page: Page) => page.evaluate(() => (window as unknown as { __Ghibli: Api }).__Ghibli.snapshot())

test.beforeEach(async ({ page }) => {
  await page.goto('/?lite')
  await page.waitForFunction(
    () => (window as unknown as { __Ghibli?: { snapshot?: () => { ready: boolean } } }).__Ghibli?.snapshot?.()?.ready === true,
    null,
    { timeout: 240_000 }
  )
})

const steerTo = (page: Page, h: Awaited<ReturnType<typeof api>>, tx: number, tz: number, yaw: number) =>
  page.evaluate(
    ({ g, tx, tz, yaw }) => {
      const st = g.snapshot()
      const dx = tx - st.x
      const dz = tz - st.z
      const n = Math.hypot(dx, dz) || 1
      const wx = (dx / n) * Math.cos(yaw) + (dz / n) * Math.sin(yaw)
      const wz = -(dx / n) * Math.sin(yaw) + (dz / n) * Math.cos(yaw)
      g.setCamYaw(Math.atan2(-wx, -wz))
    },
    { g: h, tx, tz, yaw }
  )

test('windmill door walk-in stands on the porch threshold, not buried in stone', async ({ page }) => {
  const h = await api(page)
  const start = millWorld(0, 7.4)
  const onSteps = millWorld(0, 6.0)
  const throughDoor = millWorld(0, 4.4)
  await page.evaluate(
    ({ a, x, z }) => a.teleport(x, z),
    { a: h, x: start.x, z: start.z }
  )
  await page.waitForTimeout(400)
  const s0 = await snap(page)
  expect(s0.y).toBeLessThan(MILL.base + 0.6)
  await page.keyboard.down('ArrowUp')
  let crossed = false
  let maxLift = 0
  const t0 = (await snap(page)).t
  for (let i = 0; i < 200; i++) {
    const s = await snap(page)
    maxLift = Math.max(maxLift, s.y - MILL.base)
    if (s.mllz < 5.0 && Math.abs(s.mllx) < 1.2) {
      crossed = true
      break
    }
    if (s.t - t0 > 30) break
    const target = s.mllz > 6.3 ? onSteps : throughDoor
    await steerTo(page, h, target.x, target.z, 0)
    await page.waitForTimeout(200)
  }
  await page.keyboard.up('ArrowUp')
  expect(crossed).toBe(true)
  const s = await snap(page)
  expect(Math.abs(s.y - (MILL.base + MILL.floorH))).toBeLessThanOrEqual(0.2)
  expect(maxLift).toBeLessThan(1.45)
  await page.screenshot({ path: 'test-results/collision-windmill-door.png' })
})

test('windmill spiral climbs with held keys and steps match the mesh', async ({ page }) => {
  const h = await api(page)
  const start = millWorld(0, 7.4)
  const onSteps = millWorld(0, 6.0)
  const throughDoor = millWorld(0, 4.4)
  const center = millWorld(0, 1.4)
  await page.evaluate(
    ({ a, x, z }) => a.teleport(x, z),
    { a: h, x: start.x, z: start.z }
  )
  await page.waitForTimeout(400)
  await page.keyboard.down('ArrowUp')
  let entered = false
  const tEnter = (await snap(page)).t
  for (let i = 0; i < 200; i++) {
    const s = await snap(page)
    const r = Math.hypot(s.mllx, s.mllz)
    if (r < 1.6) {
      entered = true
      break
    }
    if (s.t - tEnter > 30) break
    const target = s.mllz > 6.3 ? onSteps : s.mllz > 4.6 ? throughDoor : center
    await steerTo(page, h, target.x, target.z, 0)
    await page.waitForTimeout(200)
  }
  expect(entered).toBe(true)
  let top = false
  const tClimb = (await snap(page)).t
  for (let i = 0; i < 400; i++) {
    const s = await snap(page)
    if (s.y > MILL.base + MILL.top - 0.3) {
      top = true
      break
    }
    if (s.t - tClimb > 60) break
    const phi0 = Math.atan2(-s.mllx, s.mllz)
    const phi = phi0 < 0 ? phi0 + Math.PI * 2 : phi0
    const target = phi + 0.4 > Math.PI * 2 ? phi + 0.4 - Math.PI * 2 : phi + 0.4
    const gx = -Math.sin(target) * 2.625
    const gz = Math.cos(target) * 2.625
    const w = millWorld(gx, gz)
    await steerTo(page, h, w.x, w.z, 0)
    await page.waitForTimeout(200)
  }
  await page.keyboard.up('ArrowUp')
  expect(top).toBe(true)
  let topStable = false
  for (let i = 0; i < 12; i++) {
    const s = await snap(page)
    if (s.grounded && Math.abs(s.y - (MILL.base + MILL.top)) < 0.4) {
      topStable = true
      break
    }
    await page.waitForTimeout(300)
  }
  expect(topStable).toBe(true)
  await page.screenshot({ path: 'test-results/collision-windmill-top.png' })
  const millCenter = millWorld(0, 1.2)
  for (const phi of [Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
    const p = millWorld(-Math.sin(phi) * 2.625, Math.cos(phi) * 2.625)
    await page.evaluate(
      ({ a, x, z }) => a.teleport(x, z, true),
      { a: h, x: p.x, z: p.z }
    )
    let settled = false
    for (let i = 0; i < 16; i++) {
      const s = await snap(page)
      if (s.grounded) {
        settled = true
        break
      }
      await page.waitForTimeout(300)
    }
    expect(settled).toBe(true)
    const s = await snap(page)
    const rampH =
      MILL.base + MILL.floorH + ((phi - MILL.doorPhi) / (Math.PI * 2 - 2 * MILL.doorPhi - MILL.topPhi)) * (MILL.top - MILL.floorH)
    expect(Math.abs(s.y - rampH)).toBeLessThanOrEqual(0.2)
    await page.evaluate(
      ({ a, x, z }) => a.teleport(x, z),
      { a: h, x: millCenter.x, z: millCenter.z }
    )
    await page.waitForTimeout(400)
    const hit = await page.evaluate(
      ({ a, x, z, fromY }) => a.raycastDown(x, z, fromY),
      { a: h, x: p.x, z: p.z, fromY: rampH + 1.2 }
    )
    expect(hit).not.toBeNull()
    expect(Math.abs(hit! - rampH)).toBeLessThanOrEqual(0.3)
  }
})

test('mansion stairwell is open on floor two and falls onto the stairs', async ({ page }) => {
  const h = await api(page)
  const bottom = mansionWorld(MANSION_STAIR.lx0 + 0.25, (MANSION_STAIR.lz0 + MANSION_STAIR.lz1) / 2)
  await page.evaluate(
    ({ a, x, z, yaw }) => {
      a.teleport(x, z)
      a.setCamYaw(yaw)
    },
    { a: h, x: bottom.x, z: bottom.z, yaw: -MANSION.yaw }
  )
  await page.waitForTimeout(300)
  await page.keyboard.down('ArrowUp')
  let up = false
  const tUp = (await snap(page)).t
  for (let i = 0; i < 200; i++) {
    const s = await snap(page)
    if (s.y > MANSION.floor2 - 0.2 && s.mlx > MANSION_STAIR.lx1 - 0.5) {
      up = true
      break
    }
    if (s.t - tUp > 30) break
    await page.waitForTimeout(250)
  }
  expect(up).toBe(true)
  const holeCenter = mansionWorld(-0.2, -5)
  const slabHit = await page.evaluate(
    ({ a, x, z, fromY }) => a.raycastDown(x, z, fromY),
    { a: h, x: holeCenter.x, z: holeCenter.z, fromY: MANSION.floor2 + 1.2 }
  )
  expect(slabHit).not.toBeNull()
  expect(slabHit!).toBeLessThan(MANSION.floor2 - 0.2)
  expect(slabHit!).toBeGreaterThan(MANSION.floorY + 0.5)
  await steerTo(page, h, holeCenter.x, holeCenter.z, 0)
  let down = false
  const tDown = (await snap(page)).t
  for (let i = 0; i < 200; i++) {
    const s = await snap(page)
    if (s.y < MANSION.floor2 - 0.5 && s.grounded) {
      down = true
      break
    }
    if (s.t - tDown > 30) break
    await steerTo(page, h, holeCenter.x, holeCenter.z, 0)
    await page.waitForTimeout(200)
  }
  await page.keyboard.up('ArrowUp')
  expect(down).toBe(true)
  const s = await snap(page)
  expect(s.y).toBeGreaterThan(MANSION.floorY)
  expect(s.mlx).toBeGreaterThan(MANSION_STAIRWELL.lx0 - 0.5)
  expect(s.mlx).toBeLessThan(MANSION_STAIRWELL.lx1)
  expect(s.mlz).toBeLessThan(MANSION_STAIRWELL.lz1)
  await page.screenshot({ path: 'test-results/collision-mansion-stairwell.png' })
})

test('cottage roof walkable tracks the visible silhouette', async ({ page }) => {
  const h = await api(page)
  const apex = houseWorld(0, 0)
  await page.evaluate(
    ({ a, x, z }) => a.teleport(x, z, true),
    { a: h, x: apex.x, z: apex.z }
  )
  await page.waitForTimeout(500)
  const s0 = await snap(page)
  expect(Math.abs(s0.y - houseRoofY(0))).toBeLessThan(0.25)
  expect(s0.grounded).toBe(true)
  for (const lz of [1.5, 3.0, 4.5]) {
    const p = houseWorld(0, lz)
    const profileY = houseRoofY(lz)
    const hit = await page.evaluate(
      ({ a, x, z, fromY }) => a.raycastDown(x, z, fromY),
      { a: h, x: p.x, z: p.z, fromY: profileY + 1.0 }
    )
    expect(hit).not.toBeNull()
    expect(Math.abs(hit! - profileY)).toBeLessThanOrEqual(0.3)
    await page.evaluate(
      ({ a, x, z }) => a.teleport(x, z, true),
      { a: h, x: p.x, z: p.z }
    )
    await page.waitForTimeout(450)
    const s = await snap(page)
    expect(s.grounded).toBe(true)
    expect(Math.abs(s.y - profileY)).toBeLessThanOrEqual(0.35)
  }
  const awayYaw = HOUSE.yaw + Math.PI
  await page.keyboard.down('ArrowUp')
  let offEave = false
  const tEave = (await snap(page)).t
  for (let i = 0; i < 250; i++) {
    const s = await snap(page)
    if (s.lz > 6.4) {
      offEave = true
      break
    }
    if (s.t - tEave > 30) break
    await page.evaluate(
      ({ yaw }) => {
        ;(window as unknown as { __Ghibli: Api }).__Ghibli.setCamYaw(yaw)
      },
      { yaw: awayYaw }
    )
    await page.waitForTimeout(150)
  }
  await page.keyboard.up('ArrowUp')
  expect(offEave).toBe(true)
  let landed = false
  for (let i = 0; i < 24; i++) {
    const s = await snap(page)
    if (s.grounded && s.y < 1.2) {
      landed = true
      break
    }
    await page.waitForTimeout(300)
  }
  expect(landed).toBe(true)
  const eave = houseWorld(0, 5.9)
  const eaveHit = await page.evaluate(
    ({ a, x, z, fromY }) => a.raycastDown(x, z, fromY),
    { a: h, x: eave.x, z: eave.z, fromY: houseRoofY(5.9) + 0.6 }
  )
  expect(eaveHit).not.toBeNull()
  expect(Math.abs(eaveHit! - houseRoofY(5.9))).toBeLessThanOrEqual(0.3)
  const chimney = houseWorld(-1.7, -1.2)
  const chimneyHit = await page.evaluate(
    ({ a, x, z, fromY }) => a.raycastDown(x, z, fromY),
    { a: h, x: chimney.x, z: chimney.z, fromY: 6.5 }
  )
  expect(chimneyHit).not.toBeNull()
  expect(Math.abs(chimneyHit! - 6.04)).toBeLessThanOrEqual(0.15)
  await page.screenshot({ path: 'test-results/collision-house-roof.png' })
})

test('mansion balcony is reachable from floor two through the back doorway', async ({ page }) => {
  const h = await api(page)
  const slabSpot = mansionWorld(4.8, -3.5)
  await page.evaluate(
    ({ a, x, z }) => a.teleport(x, z, true),
    { a: h, x: slabSpot.x, z: slabSpot.z }
  )
  await page.waitForTimeout(500)
  const s0 = await snap(page)
  expect(Math.abs(s0.y - MANSION.floor2)).toBeLessThanOrEqual(0.2)
  const doorway = mansionWorld(MANSION_BALCONY.doorLX, -6.4)
  await steerTo(page, h, doorway.x, doorway.z, 0)
  await page.keyboard.down('ArrowUp')
  let crossed = false
  for (let i = 0; i < 30; i++) {
    const s = await snap(page)
    if (s.mlz < -(MANSION.d / 2 + 0.25) && Math.abs(s.mlx - MANSION_BALCONY.doorLX) < 1.1) {
      crossed = true
      break
    }
    await steerTo(page, h, doorway.x, doorway.z, 0)
    await page.waitForTimeout(280)
  }
  const balcony = mansionWorld(MANSION_BALCONY.doorLX, -6.9)
  let onBalc = false
  for (let i = 0; i < 12 && !onBalc; i++) {
    await steerTo(page, h, balcony.x, balcony.z, 0)
    await page.keyboard.down('ArrowUp')
    for (let j = 0; j < 10; j++) {
      const s = await snap(page)
      if (
        s.mlz < MANSION_BALCONY.lz1 - 0.3 &&
        s.mlz > MANSION_BALCONY.lz0 &&
        s.mlx > MANSION_BALCONY.lx0 &&
        s.mlx < MANSION_BALCONY.lx1 &&
        Math.abs(s.y - MANSION.floor2) <= 0.25 &&
        s.grounded
      ) {
        onBalc = true
        break
      }
      await page.waitForTimeout(280)
    }
    await page.keyboard.up('ArrowUp')
  }
  expect(crossed).toBe(true)
  expect(onBalc).toBe(true)
  const floorHit = await page.evaluate(
    ({ a, x, z, fromY }) => a.raycastDown(x, z, fromY),
    {
      a: h,
      x: mansionWorld(MANSION_BALCONY.doorLX, -6.75).x,
      z: mansionWorld(MANSION_BALCONY.doorLX, -6.75).z,
      fromY: MANSION.floor2 + 1.2,
    }
  )
  expect(floorHit).not.toBeNull()
  expect(Math.abs(floorHit! - MANSION.floor2)).toBeLessThanOrEqual(0.15)
  const railStop = mansionWorld(MANSION_BALCONY.doorLX, -7.8)
  await steerTo(page, h, railStop.x, railStop.z, 0)
  await page.keyboard.down('ArrowUp')
  await page.waitForTimeout(1800)
  await page.keyboard.up('ArrowUp')
  const r = await snap(page)
  expect(r.mlz).toBeGreaterThan(MANSION_BALCONY.lz0 + 0.2)
  expect(r.grounded).toBe(true)
  expect(Math.abs(r.y - MANSION.floor2)).toBeLessThanOrEqual(0.25)
  await page.screenshot({ path: 'test-results/collision-mansion-balcony.png' })
})

test('the stairwell back wall is closed on floor two', async ({ page }) => {
  const h = await api(page)
  const stairMid = mansionWorld(0.5, -4.6)
  await page.evaluate(
    ({ a, x, z }) => a.teleport(x, z, true),
    { a: h, x: stairMid.x, z: stairMid.z }
  )
  await page.waitForTimeout(500)
  const s0 = await snap(page)
  expect(s0.y).toBeGreaterThan(MANSION.floorY + 1.5)
  const target = mansionWorld(0.5, -6.9)
  await steerTo(page, h, target.x, target.z, 0)
  await page.keyboard.down('ArrowUp')
  let stopped = false
  for (let i = 0; i < 16; i++) {
    const s = await snap(page)
    if (s.mlz > MANSION_STAIRWELL.lz0 + 0.45) {
      stopped = true
      break
    }
    await steerTo(page, h, target.x, target.z, 0)
    await page.waitForTimeout(280)
  }
  await page.keyboard.up('ArrowUp')
  expect(stopped).toBe(true)
  const s = await snap(page)
  expect(s.mlz).toBeGreaterThan(MANSION_STAIRWELL.lz0 - 0.1)
  expect(s.y).toBeLessThan(MANSION.floor2 + 0.1)
  expect(s.grounded).toBe(true)
})

test('the vista balcony ends the windmill climb with a working quest', async ({ page }) => {
  const h = await api(page)
  // Walking under the deck must not lift the player.
  const balcMid = millWorld(
    -Math.sin((MILL_BALCONY.phi0 + MILL_BALCONY.phi1) / 2) * 5.9,
    Math.cos((MILL_BALCONY.phi0 + MILL_BALCONY.phi1) / 2) * 5.9
  )
  await page.evaluate(({ a, x, z }) => a.teleport(x, z), { a: h, x: balcMid.x, z: balcMid.z })
  await page.waitForTimeout(400)
  const under = await snap(page)
  expect(under.y).toBeLessThan(MILL.base + MILL.floorH + 0.1)
  // Drop onto the landing from above, then walk out across the wall opening.
  const landing = millWorld(
    -Math.sin((MILL_BALCONY.phi0 + MILL_BALCONY.phi1) / 2) * 2.4,
    Math.cos((MILL_BALCONY.phi0 + MILL_BALCONY.phi1) / 2) * 2.4
  )
  await page.evaluate(({ a, x, z }) => a.teleport(x, z, true), { a: h, x: landing.x, z: landing.z })
  await page.waitForTimeout(500)
  const s0 = await snap(page)
  expect(Math.abs(s0.y - (MILL.base + MILL.top))).toBeLessThanOrEqual(0.3)
  expect(s0.grounded).toBe(true)
  await steerTo(page, h, balcMid.x, balcMid.z, 0)
  await page.keyboard.down('ArrowUp')
  let onDeck = false
  const t0 = (await snap(page)).t
  for (let i = 0; i < 40; i++) {
    const s = await snap(page)
    const md = Math.hypot(s.mllx, s.mllz)
    if (s.grounded && md > MILL.rIn + 0.15 && Math.abs(s.y - (MILL.base + MILL.top)) < 0.35) {
      onDeck = true
      break
    }
    if (s.t - t0 > 24) break
    await steerTo(page, h, balcMid.x, balcMid.z, 0)
    await page.waitForTimeout(220)
  }
  await page.keyboard.up('ArrowUp')
  expect(onDeck).toBe(true)
  const s = await snap(page)
  expect(s.y).toBeGreaterThan(MILL.base + MILL.top - 0.3)
  // Walk the deck to the telescope and take in the view.
  const telescope = millWorld(
    -Math.sin((MILL_BALCONY.phi0 + MILL_BALCONY.phi1) / 2) * 5.9 + 0,
    Math.cos((MILL_BALCONY.phi0 + MILL_BALCONY.phi1) / 2) * 5.9
  )
  await steerTo(page, h, telescope.x, telescope.z, 0)
  await page.keyboard.down('ArrowUp')
  let nearLookout = ''
  const t1 = (await snap(page)).t
  for (let i = 0; i < 30 && nearLookout !== 'lookout'; i++) {
    nearLookout = (await snap(page)).near
    if (nearLookout === 'lookout') break
    await steerTo(page, h, telescope.x, telescope.z, 0)
    await page.waitForTimeout(220)
    if ((await snap(page)).t - t1 > 16) break
  }
  await page.keyboard.up('ArrowUp')
  expect(nearLookout).toBe('lookout')
  let lookoutProgress = 0
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('KeyE')
    for (let j = 0; j < 6; j++) {
      lookoutProgress =
        (await snap(page)).quests.list.find((q) => q.id === 'lookout')?.progress ?? 0
      if (lookoutProgress === 1) break
      await page.waitForTimeout(300)
    }
    if (lookoutProgress === 1) break
  }
  expect(lookoutProgress).toBe(1)
  const q = (await snap(page)).quests.list.find((q) => q.id === 'lookout')
  expect(q?.done).toBe(true)
  await page.keyboard.press('KeyE')
  await page.waitForTimeout(300)
  expect((await snap(page)).quests.list.find((q) => q.id === 'lookout')?.progress).toBe(1)
  // The rail holds: walk outward, stay on the deck.
  const outer = millWorld(
    -Math.sin((MILL_BALCONY.phi0 + MILL_BALCONY.phi1) / 2) * 9.5,
    Math.cos((MILL_BALCONY.phi0 + MILL_BALCONY.phi1) / 2) * 9.5
  )
  await steerTo(page, h, outer.x, outer.z, 0)
  await page.keyboard.down('ArrowUp')
  await page.waitForTimeout(2200)
  await page.keyboard.up('ArrowUp')
  const r = await snap(page)
  expect(Math.hypot(r.mllx, r.mllz)).toBeLessThan(MILL_BALCONY.r1 - 0.15)
  expect(r.grounded).toBe(true)
  await page.screenshot({ path: 'test-results/collision-windmill-balcony.png' })
})

test('enclosed shell caps balcony-arc colliders at deck height and stops porch walk-ins', async ({ page }) => {
  const halfA = Math.atan2(MILL_WALL_HW, MILL.rWall)
  const arcEdge = Math.PI * 2 - MILL_BALCONY.phi0 + halfA
  const ring = COLLIDERS.filter(
    (c): c is Extract<Collider, { t: 'b' }> =>
      c.t === 'b' && Math.abs((c.y0 ?? Number.NaN) - (MILL.base + MILL.floorH)) < 0.05
  )
  expect(ring.length).toBeGreaterThan(20)
  const arc = ring.filter((c) => c.yaw < arcEdge)
  const rest = ring.filter((c) => c.yaw >= arcEdge)
  expect(arc.length).toBeGreaterThan(0)
  expect(rest.length).toBeGreaterThan(0)
  const midPhi = (MILL_BALCONY.phi0 + MILL_BALCONY.phi1) / 2
  expect(arc.some((c) => Math.abs(c.yaw - (Math.PI * 2 - midPhi)) <= halfA)).toBe(true)
  for (const c of arc) expect(Math.abs(c.top! - (MILL.base + MILL.top))).toBeLessThanOrEqual(0.1)
  for (const c of rest) expect(Math.abs(c.top! - (MILL.base + 0.6 + MILL_TOWER.h))).toBeLessThanOrEqual(0.1)
  const h = await api(page)
  const start = millWorld(-Math.sin(midPhi) * 7.0, Math.cos(midPhi) * 7.0)
  const target = millWorld(-Math.sin(midPhi) * 3.5, Math.cos(midPhi) * 3.5)
  await page.evaluate(({ a, x, z }) => a.teleport(x, z), { a: h, x: start.x, z: start.z })
  await page.waitForTimeout(400)
  await page.keyboard.down('ArrowUp')
  let minR = Number.POSITIVE_INFINITY
  const t0 = (await snap(page)).t
  for (let i = 0; i < 60; i++) {
    const s = await snap(page)
    minR = Math.min(minR, Math.hypot(s.mllx, s.mllz))
    if (s.t - t0 > 12) break
    await steerTo(page, h, target.x, target.z, 0)
    await page.waitForTimeout(200)
  }
  await page.keyboard.up('ArrowUp')
  const s = await snap(page)
  minR = Math.min(minR, Math.hypot(s.mllx, s.mllz))
  expect(minR).toBeGreaterThan(MILL.rWall)
  expect(s.y).toBeLessThan(MILL.base + MILL.floorH + 0.4)
  await page.screenshot({ path: 'test-results/collision-windmill-shell.png' })
})

test('interior tour keeps the draw-call budget', async ({ page }) => {
  const h = await api(page)
  const millStart = millWorld(0, 7.4)
  await page.evaluate(
    ({ a, x, z, yaw }) => {
      a.teleport(x, z, true)
      a.setCamYaw(yaw)
    },
    { a: h, x: millStart.x, z: millStart.z, yaw: MILL.yaw }
  )
  await page.waitForTimeout(600)
  const mansionSpot = mansionWorld(0, 2)
  await page.evaluate(
    ({ a, x, z }) => a.teleport(x, z),
    { a: h, x: mansionSpot.x, z: mansionSpot.z }
  )
  await page.waitForTimeout(600)
  const roof = houseWorld(0, 0)
  await page.evaluate(
    ({ a, x, z }) => a.teleport(x, z, true),
    { a: h, x: roof.x, z: roof.z }
  )
  await page.waitForTimeout(800)
  const s = await snap(page)
  expect(s.drawCalls).toBeLessThanOrEqual(200)
  expect(s.fps).toBeGreaterThan(2)
  const t1 = s.t
  let advanced = false
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(500)
    if ((await snap(page)).t > t1) {
      advanced = true
      break
    }
  }
  expect(advanced).toBe(true)
})

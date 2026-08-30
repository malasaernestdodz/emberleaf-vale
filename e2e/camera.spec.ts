import { expect, test, type JSHandle, type Page } from '@playwright/test'
import { circleWall, obbWall } from '../src/lib/camera'
import { HOUSE, houseLocal, houseWorld } from '../src/lib/world'

type Snap = {
  ready: boolean
  t: number
  x: number
  y: number
  z: number
  camYaw: number
  camPitch: number
  camDist: number
  camX: number
  camY: number
  camZ: number
  inside: boolean
  interior: number
  lx: number
  lz: number
  mode: string
}

type Api = {
  snapshot: () => Snap
  teleport: (x: number, z: number) => void
  setCamYaw: (y: number) => void
}

const CX = 200
const CY = 112

const snap = (page: Page) => page.evaluate(() => (window as unknown as { __Ghibli: Api }).__Ghibli.snapshot())

const api = (page: Page): Promise<JSHandle<Api>> =>
  page.evaluateHandle(() => (window as unknown as { __Ghibli: Api }).__Ghibli)

const steer = async (page: Page, h: JSHandle<Api>, target: { x: number; z: number }, s: Snap) => {
  await page.evaluate(({ a, yaw }) => a.setCamYaw(yaw), {
    a: h,
    yaw: Math.atan2(-(target.x - s.x), -(target.z - s.z)),
  })
}

const segClearOfHouse = (px: number, py: number, pz: number, cx: number, cy: number, cz: number) => {
  for (let i = 1; i < 16; i++) {
    const t = i / 16
    const sx = px + (cx - px) * t
    const sy = py + (cy - py) * t
    const sz = pz + (cz - pz) * t
    const l = houseLocal(sx, sz)
    if (Math.abs(l.lx) < 3.4 && Math.abs(l.lz) < 2.9 && sy < HOUSE.h + 0.1) return false
  }
  return true
}

test('obbWall returns the exit distance from inside a box', () => {
  expect(obbWall(0, 0, 0, 1, 0, 0, 2, 1, 0, 0)).toBeCloseTo(1, 6)
  expect(obbWall(0, 0, 1, 0, 0, 0, 2, 1, 0, 0)).toBeCloseTo(2, 6)
  expect(obbWall(1, 0, 1, 0, 0, 0, 2, 1, 0, 0.35)).toBeCloseTo(2 - 1 - 0.35, 6)
})

test('obbWall returns the entry distance from outside with the ray hitting the box', () => {
  expect(obbWall(5, 0, -1, 0, 0, 0, 2, 1, 0, 0)).toBeCloseTo(3, 6)
  expect(obbWall(0, 5, 0, -1, 0, 0, 2, 1, 0, 0)).toBeCloseTo(4, 6)
  expect(obbWall(5, 0, -1, 0, 0, 0, 2, 1, 0, 0.3)).toBeCloseTo(3.3, 6)
  expect(obbWall(0, 5, 0, -1, 0, 0, 2, 1, Math.PI / 2, 0)).toBeCloseTo(3, 6)
})

test('obbWall returns Infinity when the ray misses or points away', () => {
  expect(obbWall(5, 0, 1, 0, 0, 0, 2, 1, 0, 0)).toBe(Infinity)
  expect(obbWall(5, 0, 0, 1, 0, 0, 2, 1, 0, 0)).toBe(Infinity)
  expect(obbWall(5, 3, -1, 0, 0, 0, 2, 1, 0, 0)).toBe(Infinity)
  expect(obbWall(5, 0, -1, 0.4, 0, 0, 2, 1, 0, 0)).toBe(Infinity)
})

test('circleWall classifies inside exit, outside entry and misses', () => {
  expect(circleWall(0, 1, 0, 1, 0, 0, 2)).toBeCloseTo(1, 6)
  expect(circleWall(0, 5, 0, -1, 0, 0, 2)).toBeCloseTo(3, 6)
  expect(circleWall(0, 5, 0, 1, 0, 0, 2)).toBe(Infinity)
  expect(circleWall(0, 5, 1, 0, 0, 0, 2)).toBe(Infinity)
})

test('indoor clamp stays finite in every direction from anywhere inside the house', () => {
  for (let gx = -2.5; gx <= 2.5; gx += 1.25) {
    for (let gz = -2; gz <= 2; gz += 1) {
      const p = houseWorld(gx, gz)
      for (let a = 0; a < 16; a++) {
        const dx = Math.cos((a / 16) * Math.PI * 2)
        const dz = Math.sin((a / 16) * Math.PI * 2)
        const t = obbWall(p.x, p.z, dx, dz, HOUSE.x, HOUSE.z, HOUSE.w / 2, HOUSE.d / 2, HOUSE.yaw, 0.35)
        expect(t).toBeLessThan(Infinity)
        expect(t).toBeGreaterThan(0)
      }
    }
  }
})

test('outdoor entry clamp always leaves the camera outside the real footprint', () => {
  const c = houseWorld(0, 0)
  for (let a = 0; a < 24; a++) {
    const ang = (a / 24) * Math.PI * 2
    const px = c.x + Math.cos(ang) * 9
    const pz = c.z + Math.sin(ang) * 9
    const dx = c.x - px
    const dz = c.z - pz
    const n = Math.hypot(dx, dz)
    const entry = obbWall(px, pz, dx / n, dz / n, HOUSE.x, HOUSE.z, HOUSE.w / 2, HOUSE.d / 2, HOUSE.yaw, 0)
    expect(entry).toBeLessThan(Infinity)
    const cam = houseLocal(px + (dx / n) * (entry - 0.5), pz + (dz / n) * (entry - 0.5))
    expect(Math.abs(cam.lx) > HOUSE.w / 2 || Math.abs(cam.lz) > HOUSE.d / 2).toBe(true)
    const shrunk = obbWall(px, pz, dx / n, dz / n, HOUSE.x, HOUSE.z, HOUSE.w / 2, HOUSE.d / 2, HOUSE.yaw, 0.35)
    expect(shrunk).toBeGreaterThanOrEqual(entry - 1e-6)
  }
})

test('house zoom: in stays inside, out clears the walls with an unoccluded view', async ({ page }) => {
  await page.goto('/?lite')
  await page.waitForFunction(
    () => (window as unknown as { __Ghibli?: { snapshot?: () => { ready: boolean } } }).__Ghibli?.snapshot?.()?.ready === true,
    null,
    { timeout: 120_000 }
  )
  const h = await api(page)

  await page.evaluate((a) => {
    a.teleport(8.156, -7.408)
  }, h)
  await page.waitForTimeout(200)

  const doorIn = houseWorld(HOUSE.doorLX, HOUSE.d / 2 - 1.4)
  await page.keyboard.down('ArrowUp')
  let inSeen = false
  for (let i = 0; i < 40; i++) {
    const s = await snap(page)
    if (s.inside && Math.abs(s.lx) < 3.2 && Math.abs(s.lz) < 2.8) {
      inSeen = true
      break
    }
    await steer(page, h, doorIn, s)
    await page.waitForTimeout(280)
  }
  expect(inSeen).toBe(true)

  let settled = await snap(page)
  for (let i = 0; i < 12 && settled.interior < 0.9; i++) {
    await page.waitForTimeout(300)
    settled = await snap(page)
  }
  expect(settled.interior).toBeGreaterThan(0.9)

  const insideBounds = (s: Snap) => {
    const c = houseLocal(s.camX, s.camZ)
    return Math.abs(c.lx) <= 3.3 && Math.abs(c.lz) <= 2.8 && s.camY <= 2.75
  }
  expect(insideBounds(settled)).toBe(true)

  await page.mouse.wheel(0, -400)
  await page.waitForTimeout(500)
  const zoomedIn = await snap(page)
  expect(insideBounds(zoomedIn)).toBe(true)
  expect(
    Math.hypot(zoomedIn.camX - zoomedIn.x, zoomedIn.camZ - zoomedIn.z)
  ).toBeLessThan(Math.hypot(settled.camX - settled.x, settled.camZ - settled.z) - 0.3)

  await page.mouse.wheel(0, 900)
  await page.waitForTimeout(400)
  const zoomedOut = await snap(page)
  expect(insideBounds(zoomedOut)).toBe(true)

  await page.mouse.move(CX, CY)
  await page.mouse.down()
  await page.mouse.move(CX + 180, CY, { steps: 8 })
  await page.mouse.up()
  await page.waitForTimeout(500)
  const orbited = await snap(page)
  expect(insideBounds(orbited)).toBe(true)

  const doorFar = houseWorld(HOUSE.doorLX, HOUSE.d / 2 + 9)
  let outsideSeen = false
  let clearWalk = true
  let far = orbited
  for (let i = 0; i < 40; i++) {
    far = await snap(page)
    if (!far.inside && far.interior < 0.3) {
      outsideSeen = true
      if (!segClearOfHouse(far.x, far.y + 1.2, far.z, far.camX, far.camY, far.camZ)) clearWalk = false
      if (far.interior < 0.05 && Math.hypot(far.camX - far.x, far.camZ - far.z) > 4.5) break
    }
    await steer(page, h, doorFar, far)
    await page.waitForTimeout(280)
  }
  await page.keyboard.up('ArrowUp')
  expect(outsideSeen).toBe(true)
  expect(clearWalk).toBe(true)

  let final = far
  for (let i = 0; i < 12; i++) {
    final = await snap(page)
    if (final.interior < 0.05 && Math.hypot(final.camX - final.x, final.camZ - final.z) > 4.5) break
    await page.waitForTimeout(300)
  }
  expect(final.interior).toBeLessThan(0.05)
  expect(Math.hypot(final.camX - final.x, final.camZ - final.z)).toBeGreaterThan(4.5)
  expect(segClearOfHouse(final.x, final.y + 1.2, final.z, final.camX, final.camY, final.camZ)).toBe(true)
  const camL = houseLocal(final.camX, final.camZ)
  expect(Math.abs(camL.lx) < 3.41 && Math.abs(camL.lz) < 2.91).toBe(false)
  await page.screenshot({ path: 'test-results/camera-outdoor-zoom.png' })
})

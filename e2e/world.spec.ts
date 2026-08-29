import { expect, test, type Page } from '@playwright/test'
import { MILL, MANSION, TREES } from '../src/lib/world'
import { pickups } from '../src/lib/items'

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
  heading: number
  camYaw: number
  camPitch: number
  camDist: number
  camX: number
  camY: number
  camZ: number
  inside: boolean
  insideMansion: boolean
  mode: string
  grounded: boolean
  sprint: number
  tool: string
  chop: number
  near: string
  nearLabel: string
  fishing: boolean
  bite: boolean
  veil: number
  inv: { rock: number; flower: number; wood: number; fish: number }
  slot: number
  pickups: number
  windmill: number
  fps: number
  grass: number
  drawCalls: number
  tris: number
  trees: number
  rocks: number
}

type Api = {
  snapshot: () => Snap
  teleport: (x: number, z: number) => void
  setCamYaw: (y: number) => void
}

const CX = 200
const CY = 112

const api = (page: Page) => page.evaluateHandle(() => (window as unknown as { __Ghibli: Api }).__Ghibli)

const snap = (page: Page) => page.evaluate(() => (window as unknown as { __Ghibli: Api }).__Ghibli.snapshot())

const wrap = (d: number) => {
  if (d > Math.PI) return d - Math.PI * 2
  if (d < -Math.PI) return d + Math.PI * 2
  return d
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.waitForFunction(
    () => (window as unknown as { __Ghibli?: { snapshot?: () => { ready: boolean } } }).__Ghibli?.snapshot?.()?.ready === true,
    null,
    { timeout: 60_000 }
  )
})

test('boots with perf budgets', async ({ page }) => {
  const s = await snap(page)
  expect(s.grass).toBeGreaterThanOrEqual(40000)
  expect(s.drawCalls).toBeLessThanOrEqual(190)
  expect(s.tris).toBeGreaterThan(100000)
  expect(s.trees).toBeGreaterThanOrEqual(14)
  expect(s.rocks).toBeGreaterThanOrEqual(12)
  expect(s.pickups).toBeGreaterThanOrEqual(15)
  expect(s.fps).toBeGreaterThan(2)
  const t1 = (await snap(page)).t
  await page.waitForTimeout(500)
  expect((await snap(page)).t).toBeGreaterThan(t1)
  await page.screenshot({ path: 'test-results/scene-exterior.png' })
})

test('arrow keys move the player and camera follows', async ({ page }) => {
  const s0 = await snap(page)
  await page.keyboard.down('ArrowUp')
  await page.waitForTimeout(1600)
  await page.keyboard.up('ArrowUp')
  const s1 = await snap(page)
  expect(Math.hypot(s1.x - s0.x, s1.z - s0.z)).toBeGreaterThan(1.0)
  expect(Math.hypot(s1.camX - s0.camX, s1.camZ - s0.camZ)).toBeGreaterThan(0.3)
})

test('strafe turns heading', async ({ page }) => {
  const s0 = await snap(page)
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(700)
  await page.keyboard.up('ArrowRight')
  const s1 = await snap(page)
  expect(Math.abs(wrap(s1.heading - s0.heading))).toBeGreaterThan(0.5)
})

test('sprint covers more ground', async ({ page }) => {
  const s0 = await snap(page)
  await page.keyboard.down('ControlLeft')
  await page.keyboard.down('ArrowUp')
  await page.waitForTimeout(1400)
  await page.keyboard.up('ArrowUp')
  await page.keyboard.up('ControlLeft')
  const s1 = await snap(page)
  expect(s1.sprint).toBeGreaterThan(0.5)
  expect(Math.hypot(s1.x - s0.x, s1.z - s0.z)).toBeGreaterThan(4.0)
})

test('jump leaves the ground and lands', async ({ page }) => {
  const s0 = await snap(page)
  const base = s0.y
  let maxY = base
  await page.keyboard.press('Space')
  for (let i = 0; i < 12; i++) {
    maxY = Math.max(maxY, (await snap(page)).y)
    await page.waitForTimeout(100)
  }
  expect(maxY - base).toBeGreaterThan(0.4)
  const sEnd = await snap(page)
  expect(Math.abs(sEnd.y - base)).toBeLessThan(0.3)
  expect(sEnd.grounded).toBe(true)
})

test('drag orbits camera, pitch tilts, wheel zooms', async ({ page }) => {
  const s0 = await snap(page)
  await page.mouse.move(CX, CY)
  await page.mouse.down()
  await page.mouse.move(CX + 180, CY, { steps: 10 })
  await page.mouse.up()
  const s1 = await snap(page)
  expect(Math.abs(wrap(s1.camYaw - s0.camYaw))).toBeGreaterThan(0.4)

  await page.mouse.move(CX, CY)
  await page.mouse.down()
  await page.mouse.move(CX, CY - 50, { steps: 8 })
  await page.mouse.up()
  const s2 = await snap(page)
  expect(Math.abs(s2.camPitch - s1.camPitch)).toBeGreaterThan(0.15)

  await page.mouse.wheel(0, -400)
  await page.waitForTimeout(400)
  const d1 = (await snap(page)).camDist
  expect(d1).toBeLessThan(s2.camDist - 0.3)
})

test('walls block the player', async ({ page }) => {
  const h = await api(page)
  await page.evaluate((a) => {
    a.teleport(13.207, -7.586)
    a.setCamYaw(-2.678)
  }, h)
  await page.waitForTimeout(300)
  await page.keyboard.down('ArrowUp')
  await page.waitForTimeout(1200)
  await page.keyboard.up('ArrowUp')
  const s = await snap(page)
  expect(s.lx).toBeGreaterThan(2.2)
  expect(s.lx).toBeLessThan(3.45)
  expect(Math.abs(s.lz)).toBeLessThan(3.0)
})

test('walks in and out of the house through the door, camera stays indoors', async ({ page }) => {
  const h = await api(page)
  await page.evaluate((a) => {
    a.teleport(8.156, -7.408)
    a.setCamYaw(-1.107)
  }, h)
  await page.waitForTimeout(200)
  await page.keyboard.down('ArrowUp')
  await page.waitForTimeout(6000)
  const sIn = await snap(page)
  expect(sIn.inside).toBe(true)
  expect(Math.abs(sIn.lx)).toBeLessThan(3.4)
  for (let i = 0; i < 4; i++) {
    await page.mouse.move(CX, CY)
    await page.mouse.down()
    await page.mouse.move(CX + (i % 2 === 0 ? 180 : -180), CY - 40 + (i % 3) * 25, { steps: 8 })
    await page.mouse.up()
    await page.waitForTimeout(250)
    const c = await snap(page)
    expect(Math.abs(c.camX - 12)).toBeLessThan(4.3)
    expect(Math.abs(c.camZ + 10)).toBeLessThan(4.5)
    expect(c.camY).toBeLessThan(2.7)
  }
  await page.evaluate((a) => a.setCamYaw(2.0346), h)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: 'test-results/scene-interior.png' })
  await page.waitForTimeout(4500)
  await page.keyboard.up('ArrowUp')
  const sOut = await snap(page)
  expect(sOut.inside).toBe(false)
})

test('windmill spiral climbs to the top', async ({ page }) => {
  const h = await api(page)
  await page.evaluate((a) => {
    a.teleport(21.84, -17.12)
    a.setCamYaw(-0.6435)
  }, h)
  await page.waitForTimeout(300)
  await page.keyboard.down('ArrowUp')
  let top = false
  for (let i = 0; i < 60; i++) {
    const s = await snap(page)
    if (s.y > MILL.base + 3.0) {
      top = true
      break
    }
    await page.evaluate(() => {
      const g = (window as unknown as { __Ghibli: Api }).__Ghibli
      const st = g.snapshot()
      const phi0 = Math.atan2(-st.mlx, st.mlz)
      const phi = phi0 < 0 ? phi0 + Math.PI * 2 : phi0
      g.setCamYaw(Math.PI / 2 - phi)
    })
    await page.waitForTimeout(220)
  }
  await page.keyboard.up('ArrowUp')
  expect(top).toBe(true)
  const s = await snap(page)
  expect(s.y).toBeGreaterThan(MILL.base + 2.9)
  expect(s.y).toBeLessThan(MILL.base + 3.75)
})

test('mansion stairs reach the second floor', async ({ page }) => {
  const h = await api(page)
  await page.evaluate((a) => {
    a.teleport(-15.55, -13.79)
    a.setCamYaw(0.82)
  }, h)
  await page.waitForTimeout(300)
  await page.keyboard.down('ArrowUp')
  let up = false
  for (let i = 0; i < 30; i++) {
    const s = await snap(page)
    if (s.y > MANSION.floor2 - 0.2) {
      up = true
      break
    }
    await page.waitForTimeout(250)
  }
  await page.keyboard.up('ArrowUp')
  expect(up).toBe(true)
  const s = await snap(page)
  expect(s.y).toBeGreaterThan(MANSION.floor2 - 0.1)
  expect(s.y).toBeLessThan(MANSION.floor2 + 0.4)
  expect(s.mlz).toBeLessThan(-0.3)
  expect(s.insideMansion).toBe(true)
})

test('can walk under the mansion balcony with no invisible wall', async ({ page }) => {
  const h = await api(page)
  await page.evaluate((a) => {
    a.teleport(-16.9, -13.2)
    a.setCamYaw(0.82 + Math.PI)
  }, h)
  await page.waitForTimeout(300)
  const s0 = await snap(page)
  expect(s0.y).toBeLessThan(0.5)
  await page.keyboard.down('ArrowUp')
  await page.waitForTimeout(2500)
  await page.keyboard.up('ArrowUp')
  const s1 = await snap(page)
  expect(s1.mlz).toBeLessThan(-3.2)
  expect(s1.y).toBeLessThan(0.5)
  expect(s1.insideMansion).toBe(true)
})

test('fountain rim is solid below and standable above', async ({ page }) => {
  const h = await api(page)
  await page.evaluate((a) => {
    a.teleport(-6, 1.2)
    a.setCamYaw(0)
  }, h)
  await page.waitForTimeout(300)
  await page.keyboard.down('ArrowUp')
  await page.waitForTimeout(900)
  await page.keyboard.up('ArrowUp')
  const walked = await snap(page)
  const dWalked = Math.hypot(walked.x + 6, walked.z + 1)
  expect(dWalked).toBeGreaterThan(1.35)
  await page.keyboard.down('ArrowUp')
  await page.keyboard.press('Space')
  let maxLift = 0
  for (let i = 0; i < 14; i++) {
    const s = await snap(page)
    const d = Math.hypot(s.x + 6, s.z + 1)
    if (d < 1.7) maxLift = Math.max(maxLift, s.y)
    await page.waitForTimeout(120)
  }
  await page.keyboard.up('ArrowUp')
  expect(maxLift).toBeGreaterThan(0.4)
  const landed = await snap(page)
  expect(landed.grounded).toBe(true)
  const dEnd = Math.hypot(landed.x + 6, landed.z + 1)
  expect(landed.y).toBeGreaterThan(0.35)
  expect(dEnd).toBeLessThan(2.05)
})

test('sleeping fades the world to dark and back', async ({ page }) => {
  const h = await api(page)
  await page.evaluate((a) => {
    a.teleport(9.7, -9.6)
    a.setCamYaw(-2.6)
  }, h)
  await page.waitForTimeout(2500)
  await page.keyboard.press('KeyE')
  await page.waitForTimeout(1300)
  let veil = await page.evaluate(() => (window as unknown as { __Ghibli: Api }).__Ghibli.snapshot().veil)
  expect(veil).toBeGreaterThan(0.4)
  await page.waitForTimeout(3200)
  veil = await page.evaluate(() => (window as unknown as { __Ghibli: Api }).__Ghibli.snapshot().veil)
  expect(veil).toBeLessThan(0.1)
})

test('read the book opens and closes the ledger', async ({ page }) => {
  const h = await api(page)
  await page.evaluate((a) => {
    a.teleport(13.3, -11.0)
    a.setCamYaw(2.6)
  }, h)
  await page.waitForTimeout(2500)
  await page.keyboard.press('KeyE')
  await page.waitForTimeout(400)
  await expect(page.locator('.book')).toBeVisible()
  await page.keyboard.press('KeyE')
  await page.waitForTimeout(300)
  await expect(page.locator('.book')).toHaveCount(0)
})

test('chopping a tree yields wood with the axe', async ({ page }) => {
  const t0 = TREES[0]
  const h = await api(page)
  await page.evaluate(
    ({ a, x, z }) => {
      a.teleport(x, z)
    },
    { a: h, x: t0.x + 1.05, z: t0.z }
  )
  await page.waitForTimeout(500)
  const s0 = await snap(page)
  expect(s0.near).toBe('chop')
  expect(s0.tool).toBe('axe')
  await page.keyboard.press('KeyE')
  await page.waitForTimeout(2000)
  const s1 = await snap(page)
  expect(s1.inv.wood).toBeGreaterThanOrEqual(1)
})

test('pickup, inventory and throw', async ({ page }) => {
  const flower = pickups.find((p) => p.type === 'flower' && p.alive)
  expect(flower).toBeTruthy()
  const h = await api(page)
  await page.evaluate(
    ({ a, x, z }) => {
      a.teleport(x, z)
    },
    { a: h, x: flower!.x, z: flower!.z }
  )
  await page.waitForTimeout(500)
  const s0 = await snap(page)
  expect(s0.near).toBe('pk')
  expect(s0.pickups).toBe(21)
  await page.keyboard.press('KeyE')
  await page.waitForTimeout(400)
  const s1 = await snap(page)
  expect(s1.inv.flower).toBe(1)
  expect(s1.pickups).toBe(20)
  await page.keyboard.press('KeyG')
  await page.waitForTimeout(600)
  const s2 = await snap(page)
  expect(s2.inv.flower).toBe(0)
  expect(s2.pickups).toBe(21)
})

test('fishing catches a fish on the bite', async ({ page }) => {
  const h = await api(page)
  await page.evaluate((a) => {
    a.teleport(-11.6, 7.2)
    a.setCamYaw(2.2)
  }, h)
  await page.waitForTimeout(400)
  const s0 = await snap(page)
  expect(s0.near).toBe('fish')
  await page.keyboard.press('KeyE')
  await page.waitForTimeout(300)
  expect((await snap(page)).tool).toBe('rod')
  expect((await snap(page)).fishing).toBe(true)
  let caught = false
  for (let i = 0; i < 30; i++) {
    const s = await snap(page)
    if (!s.fishing) break
    if (s.bite) {
      await page.keyboard.press('KeyE')
      caught = true
      break
    }
    await page.waitForTimeout(300)
  }
  expect(caught).toBe(true)
  const sEnd = await snap(page)
  expect(sEnd.inv.fish).toBe(1)
})

test('windmill sails animate', async ({ page }) => {
  const s0 = await snap(page)
  await page.waitForTimeout(1200)
  const s1 = await snap(page)
  const dt = Math.max(s1.t - s0.t, 0.1)
  const rate = Math.abs(wrap(s1.windmill - s0.windmill)) / dt
  expect(rate).toBeGreaterThan(0.35)
  expect(rate).toBeLessThan(0.85)
})

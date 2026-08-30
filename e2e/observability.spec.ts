import { expect, test, type Page } from '@playwright/test'
import { mansionWorld } from '../src/lib/world'

type Metric = { name: string; total: number; perSec: number }

type Snap = {
  ready: boolean
  t: number
  x: number
  z: number
  hp: number
  slime: { x: number; z: number; visible: boolean }
}

type Api = {
  snapshot: () => Snap
  teleport: (x: number, z: number, high?: boolean) => void
  setCamYaw: (y: number) => void
  skipSlimeRespawn: () => void
}

const metrics = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as { __emberTrace: { metrics: () => Metric[] } }).__emberTrace.metrics()
  )

const snap = (page: Page) => page.evaluate(() => (window as unknown as { __Ghibli: Api }).__Ghibli.snapshot())
const api = (page: Page) => page.evaluateHandle(() => (window as unknown as { __Ghibli: Api }).__Ghibli)

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

test.beforeEach(async ({ page }) => {
  await page.goto('/?lite')
  await page.waitForFunction(
    () => (window as unknown as { __Ghibli?: { snapshot?: () => { ready: boolean } } }).__Ghibli?.snapshot?.()?.ready === true,
    null,
    { timeout: 240_000 }
  )
})

test('metrics registry exposes live numeric gauges', async ({ page }) => {
  await page.waitForTimeout(2500)
  const rows = await metrics(page)
  const byName = new Map(rows.map((r) => [r.name, r]))
  for (const g of ['fps', 'draws', 'tris', 'tier']) {
    const row = byName.get(g)
    expect(row, `gauge ${g} exists`).toBeTruthy()
    expect(Number.isFinite(row!.total)).toBe(true)
  }
  expect(byName.get('fps')!.total).toBeGreaterThan(0)
  await page.keyboard.press('KeyP')
  await expect(page.getByTestId('perf-panel')).toBeVisible()
  await expect(page.locator('[data-testid^="metric-"]').first()).toBeVisible()
})

test('walking into a wall moves the collide.push counter, not just vibes', async ({ page }) => {
  const h = await api(page)
  const spot = mansionWorld(-3, 3.2)
  await page.evaluate(
    ({ a, x, z }) => a.teleport(x, z),
    { a: h, x: spot.x, z: spot.z }
  )
  await page.waitForTimeout(400)
  const wall = mansionWorld(-3, 7.5)
  let pushed = 0
  await page.keyboard.down('ArrowUp')
  for (let i = 0; i < 30 && pushed < 3; i++) {
    await steerTo(page, h, wall.x, wall.z, 0)
    await page.waitForTimeout(400)
    pushed = Math.max(pushed, (await metrics(page)).find((m) => m.name === 'collide.push')?.total ?? 0)
  }
  await page.keyboard.up('ArrowUp')
  expect(pushed, 'collide.push totals while grinding the wall').toBeGreaterThanOrEqual(3)
  const stopAt = mansionWorld(-3, 7)
  await expect
    .poll(async () => (await snap(page)).t, { timeout: 30_000, intervals: [500] })
    .toBeGreaterThan(0.5)
  const blocked = await snap(page)
  expect(blocked.z).toBeLessThan(stopAt.z)
})

test('getting hurt leaves a damage counter trail', async ({ page }) => {
  const h = await api(page)
  for (let attempt = 0; attempt < 14; attempt++) {
    const cur = await snap(page)
    if (cur.hp <= 3) break
    if (!cur.slime.visible) {
      await page.evaluate((a) => a.skipSlimeRespawn(), h)
      await page.waitForTimeout(900)
      continue
    }
    await page.evaluate(
      ({ a, x, z }) => a.teleport(x, z),
      { a: h, x: cur.slime.x + 0.5, z: cur.slime.z }
    )
    await page.waitForTimeout(1500)
  }
  const rows = await metrics(page)
  expect(rows.find((m) => m.name === 'hp.damage')?.total ?? 0).toBeGreaterThan(0)
})

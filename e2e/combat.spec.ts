import { expect, test, type Page } from '@playwright/test'
import { POND, houseWorld } from '../src/lib/world'

type Snap = {
  ready: boolean
  t: number
  attack: number
  attackDur: number
  pickups: number
  veil: number
  fishing: boolean
  camX: number
  camY: number
  camZ: number
  slime: {
    x: number
    y: number
    z: number
    state: string
    hp: number
    maxHp: number
    hits: number
    visible: boolean
    spawnX: number
    spawnZ: number
  }
  slimeHud: { shown: boolean; frac: number }
  quests: { list: { id: string; progress: number; target: number; done: boolean }[] }
}

type Api = {
  snapshot: () => Snap
  teleport: (x: number, z: number, high?: boolean) => void
  setCamYaw: (y: number) => void
  face: (x: number, z: number) => void
  skipSlimeRespawn: () => void
}

const CX = 200
const CY = 112

const snap = (page: Page) => page.evaluate(() => (window as unknown as { __Ghibli: Api }).__Ghibli.snapshot())
const api = (page: Page) => page.evaluateHandle(() => (window as unknown as { __Ghibli: Api }).__Ghibli)

const slash = (page: Page) => page.mouse.click(CX, CY, { button: 'right' })

const standOff = async (page: Page, h: Awaited<ReturnType<typeof api>>, attempts = 30) => {
  for (let i = 0; i < attempts; i++) {
    const s = (await snap(page)).slime
    if (!s.visible) {
      await page.evaluate((a) => a.skipSlimeRespawn(), h)
      await page.waitForTimeout(700)
      continue
    }
    const dx = s.spawnX - s.x
    const dz = s.spawnZ - s.z
    const d = Math.hypot(dx, dz) || 1
    await page.evaluate(
      ({ a, x, z, fx, fz }) => {
        a.teleport(x, z)
        a.face(fx, fz)
      },
      { a: h, x: s.x + (dx / d) * 0.95, z: s.z + (dz / d) * 0.95, fx: s.x, fz: s.z }
    )
    await page.waitForTimeout(300)
    if ((await snap(page)).slime.state === 'idle') return (await snap(page)).slime
  }
  return (await snap(page)).slime
}

const faceAway = async (page: Page, h: Awaited<ReturnType<typeof api>>) => {
  const s = (await snap(page)).slime
  const px = s.x + (s.spawnX - s.x) / (Math.hypot(s.spawnX - s.x, s.spawnZ - s.z) || 1) * 0.95
  const pz = s.z + (s.spawnZ - s.z) / (Math.hypot(s.spawnX - s.x, s.spawnZ - s.z) || 1) * 0.95
  await page.evaluate(
    ({ a, x, z, fx, fz }) => {
      a.teleport(x, z)
      a.face(fx, fz)
    },
    { a: h, x: px, z: pz, fx: s.x + (s.x - px) * 10, fz: s.z + (s.z - pz) * 10 }
  )
  return (await snap(page)).slime.hp
}

const waitAlive = async (page: Page) => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const t0 = (await snap(page)).t
    await page.waitForTimeout(1_500)
    if ((await snap(page)).t > t0 + 0.2) return
    await page.goto('/?lite')
    await page.waitForFunction(
      () => (window as unknown as { __Ghibli?: { snapshot?: () => { ready: boolean } } }).__Ghibli?.snapshot?.()?.ready === true,
      null,
      { timeout: 120_000 }
    )
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/?lite')
  await page.waitForFunction(
    () => (window as unknown as { __Ghibli?: { snapshot?: () => { ready: boolean } } }).__Ghibli?.snapshot?.()?.ready === true,
    null,
    { timeout: 120_000 }
  )
  await waitAlive(page)
})

test('a right-click slash lands instantly and reports the fast duration', async ({ page }) => {
  const h = await api(page)
  const before = (await standOff(page, h)).hp
  let dur = 0
  for (let attempt = 0; attempt < 12; attempt++) {
    await standOff(page, h, 6)
    await slash(page)
    for (let i = 0; i < 16; i++) {
      const s = await snap(page)
      if (s.slime.hp < before) {
        dur = s.attackDur
        break
      }
      if (s.slime.state === 'hidden') break
      await page.waitForTimeout(250)
    }
    if (dur === 0.22) break
  }
  expect(dur).toBe(0.22)
  expect((await snap(page)).slime.hp).toBeLessThan(before)
})

test('the left button still swings the committed heavy sword', async ({ page }) => {
  const h = await api(page)
  await standOff(page, h)
  for (let i = 0; i < 8 && (await snap(page)).attackDur !== 0.22; i++) {
    await slash(page)
    await page.waitForTimeout(400)
  }
  expect((await snap(page)).attackDur).toBe(0.22)
  for (let i = 0; i < 8 && (await snap(page)).attackDur !== 0.9; i++) {
    await page.mouse.click(CX, CY)
    await page.waitForTimeout(400)
  }
  expect((await snap(page)).attackDur).toBe(0.9)
})

test('rapid right-click slashes fell the slime: slash slash slash', async ({ page }) => {
  const h = await api(page)
  await standOff(page, h)
  for (let i = 0; i < 8; i++) {
    if ((await snap(page)).slime.state === 'hidden') break
    await standOff(page, h, 6)
    await slash(page)
    await page.waitForTimeout(260)
  }
  await expect
    .poll(async () => {
      const s = await snap(page)
      return `${s.slime.state}:${s.slime.hp}`
    }, { timeout: 20_000 })
    .toBe('hidden:0')
  const end = await snap(page)
  expect(end.pickups).toBeGreaterThanOrEqual(1)
  const quest = end.quests.list.find((q) => q.id === 'slime')
  expect(quest?.progress).toBe(1)
  expect(quest?.done).toBe(true)
  await expect(page.getByTestId('slime-health')).toBeVisible()
  await expect(page.getByTestId('slime-hp')).toHaveText('0/3', { timeout: 5_000 })
  await expect(page.getByTestId('slime-health-fill')).toHaveAttribute('style', /width:\s*0%/)
})

test('the slime vitality bar is pinned to the screen, red, and never moves', async ({ page }) => {
  const bar = page.getByTestId('slime-health')
  await expect(bar).toBeVisible()
  const fill = page.getByTestId('slime-health-fill')
  await expect(fill).toHaveAttribute('style', /width:\s*100%/)
  expect(await fill.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(224, 72, 62)')
  await expect(page.getByTestId('slime-hp')).toHaveText('3/3')
  const h = await api(page)
  const s0 = (await snap(page)).slime
  const cam0 = await snap(page)
  const b1 = await bar.boundingBox()
  const spots: [number, number, number][] = [
    [4, 0, 0.4],
    [0, 4, 1.6],
    [-4, 0, 3.1],
    [0, -4, 4.7],
  ]
  const camMoved = async () => {
    const c = await snap(page)
    return Math.hypot(c.camX - cam0.camX, c.camY - cam0.camY, c.camZ - cam0.camZ) > 1
  }
  for (let round = 0; round < 12 && !(await camMoved()); round++) {
    const [dx, dz, yaw] = spots[round % spots.length]
    await page.evaluate(
      ({ a, x, z, y }) => {
        a.teleport(x, z)
        a.setCamYaw(y)
      },
      { a: h, x: s0.x + dx, z: s0.z + dz, y: yaw }
    )
    await page.waitForTimeout(1_200)
  }
  await expect.poll(camMoved, { timeout: 30_000, intervals: [500] }).toBe(true)
  const b2 = await bar.boundingBox()
  expect(b1).not.toBeNull()
  expect(b2).not.toBeNull()
  expect(Math.abs(b1!.x - b2!.x)).toBeLessThanOrEqual(1)
  expect(Math.abs(b1!.y - b2!.y)).toBeLessThanOrEqual(1)
  expect(Math.abs(b1!.width - b2!.width)).toBeLessThanOrEqual(1)
})

test('the bar stays visible while fishing, reading, sleeping, and under the menu', async ({ page }) => {
  const h = await api(page)
  const bar = page.getByTestId('slime-health')

  await page.evaluate(({ a, x, z }) => a.teleport(x, z), { a: h, x: POND.x + 6.2, z: POND.z })
  await page.waitForTimeout(500)
  for (let i = 0; i < 20 && !(await snap(page)).fishing; i++) {
    await page.keyboard.press('KeyE')
    await page.waitForTimeout(1_200)
  }
  expect((await snap(page)).fishing).toBe(true)
  await expect(bar).toBeVisible()
  for (let i = 0; i < 20 && (await snap(page)).fishing; i++) {
    await page.keyboard.press('KeyE')
    await page.waitForTimeout(1_200)
  }
  await expect.poll(async () => (await snap(page)).fishing, { timeout: 30_000 }).toBe(false)

  const bookSpot = houseWorld(0.55, 0.8)

  await page.evaluate(({ a, x, z }) => a.teleport(x, z), { a: h, x: bookSpot.x, z: bookSpot.z })
  await page.waitForTimeout(500)
  for (let i = 0; i < 20; i++) {
    if (await page.locator('.book').isVisible()) break
    await page.keyboard.press('KeyE')
    await page.waitForTimeout(1_200)
  }
  await expect(page.locator('.book')).toBeVisible()
  await expect(bar).toBeVisible()
  for (let i = 0; i < 8; i++) {
    if (!(await page.locator('.book').isVisible())) break
    await page.keyboard.press('KeyE')
    await page.waitForTimeout(800)
  }

  await page.evaluate(({ a, x, z }) => a.teleport(x, z), { a: h, x: 12.0, z: -11.6 })
  await page.waitForTimeout(500)
  for (let i = 0; i < 20 && (await snap(page)).veil < 0.5; i++) {
    await page.keyboard.press('KeyE')
    await page.waitForTimeout(1_200)
  }
  await expect.poll(async () => (await snap(page)).veil, { timeout: 30_000 }).toBeGreaterThan(0.5)
  await expect(bar).toBeVisible()
  await expect.poll(async () => (await snap(page)).veil, { timeout: 45_000 }).toBe(0)
  await expect(bar).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.getByTestId('resume')).toBeVisible()
  await expect(bar).toBeVisible()
  await page.getByTestId('resume').click()
})

test('right-click never swings through UI chrome or stale buffers', async ({ page }) => {
  const h = await api(page)
  await page.getByTestId('gear').click({ button: 'right' })
  await page.waitForTimeout(400)
  expect((await snap(page)).attack).toBe(0)

  await page.keyboard.press('Escape')
  await expect(page.getByTestId('resume')).toBeVisible()
  await slash(page)
  await page.waitForTimeout(200)
  expect((await snap(page)).attack).toBe(0)
  await page.getByTestId('resume').click()
  await page.waitForTimeout(1_500)
  expect((await snap(page)).attack).toBe(0)

  const before = await faceAway(page, h)
  await slash(page)
  await page.waitForTimeout(400)
  await expect
    .poll(async () => (await snap(page)).slime.hp, { timeout: 5_000 })
    .toBe(before)
  expect((await snap(page)).slime.hits).toBe(0)
})

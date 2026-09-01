import { expect, test, type Page } from '@playwright/test'
import { POND, houseWorld } from '../src/lib/world'

type Snap = {
  ready: boolean
  t: number
  attack: number
  attackDur: number
  slash: { stage: number; dir: number; active: boolean; since: number }
  drawCalls: number
  fps: number
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
  probeClickEdge: (button?: number) => void
  objectVisible: (name: string, child?: number) => boolean | null
}

const CX = 200
const CY = 112

const snap = (page: Page) => page.evaluate(() => (window as unknown as { __Ghibli: Api }).__Ghibli.snapshot())
const api = (page: Page) => page.evaluateHandle(() => (window as unknown as { __Ghibli: Api }).__Ghibli)

const slashClick = (page: Page, button: 'left' | 'right' = 'right') =>
  page.mouse.click(CX, CY, { button })

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

test('a click slash lands instantly and reports the fast duration', async ({ page }) => {
  const h = await api(page)
  const before = (await standOff(page, h)).hp
  let dur = 0
  for (let attempt = 0; attempt < 12; attempt++) {
    await standOff(page, h, 6)
    await slashClick(page, attempt % 2 === 0 ? 'right' : 'left')
    for (let i = 0; i < 16; i++) {
      const s = await snap(page)
      if (s.slime.hp < before) {
        dur = s.attackDur
        break
      }
      if (s.slime.state === 'hidden') break
      await page.waitForTimeout(250)
    }
    if (dur === 0.25) break
  }
  expect(dur).toBe(0.25)
  expect((await snap(page)).slime.hp).toBeLessThan(before)
})

test('both buttons share the one fast slash with no heavy drift', async ({ page }) => {
  const h = await api(page)
  await standOff(page, h)
  for (let i = 0; i < 8 && (await snap(page)).attackDur !== 0.25; i++) {
    await slashClick(page, 'right')
    await page.waitForTimeout(400)
  }
  expect((await snap(page)).attackDur).toBe(0.25)
  for (let i = 0; i < 8 && (await snap(page)).attackDur !== 0.25; i++) {
    await slashClick(page, 'left')
    await page.waitForTimeout(400)
  }
  expect((await snap(page)).attackDur).toBe(0.25)
  expect((await snap(page)).slash.active || (await snap(page)).attack > 0).toBeFalsy()
})

test('chained slashes alternate direction and a late press resets the chain', async ({ page }) => {
  const h = await api(page)
  await standOff(page, h)
  let sawStage1 = false
  for (let i = 0; i < 12 && !sawStage1; i++) {
    await page.evaluate((a) => a.probeClickEdge(2), h)
    await page.waitForTimeout(150)
    const s = await snap(page)
    if (s.slash.stage === 1 && s.slash.dir === -1) sawStage1 = true
    await page.waitForTimeout(380)
  }
  expect(sawStage1).toBe(true)
  let resetOk = false
  for (let pass = 0; pass < 4 && !resetOk; pass++) {
    for (let i = 0; i < 12 && (await snap(page)).slash.active; i++) {
      await page.waitForTimeout(300)
    }
    await expect
      .poll(async () => (await snap(page)).slash.since, { timeout: 30_000 })
      .toBeGreaterThan(1.1)
    await page.evaluate((a) => a.probeClickEdge(2), h)
    let observed: Snap | null = null
    for (let j = 0; j < 20 && !observed; j++) {
      const s = await snap(page)
      if (s.slash.active) observed = s
      else await page.waitForTimeout(100)
    }
    if (observed && observed.slash.stage === 0 && observed.slash.dir === 1) resetOk = true
  }
  expect(resetOk).toBe(true)
})

test('rapid slashes on both buttons fell the slime: slash slash slash', async ({ page }) => {
  const h = await api(page)
  await standOff(page, h)
  for (let i = 0; i < 10; i++) {
    if ((await snap(page)).slime.state === 'hidden') break
    await standOff(page, h, 6)
    const first = i % 2 === 0 ? 2 : 0
    const second = i % 2 === 0 ? 0 : 2
    await page.evaluate(({ a, b }) => a.probeClickEdge(b), { a: h, b: first })
    await page.waitForTimeout(220)
    await page.evaluate(({ a, b }) => a.probeClickEdge(b), { a: h, b: second })
    await page.waitForTimeout(340)
  }
  await expect
    .poll(async () => {
      const s = await snap(page)
      return `${s.slime.state}:${s.slime.hp}`
    }, { timeout: 45_000 })
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

test('clicks never swing through UI chrome or stale buffers', async ({ page }) => {
  const h = await api(page)
  await page.getByTestId('gear').click({ button: 'right' })
  await page.waitForTimeout(400)
  expect((await snap(page)).attack).toBe(0)

  await page.keyboard.press('Escape')
  await expect(page.getByTestId('resume')).toBeVisible()
  await slashClick(page)
  await page.waitForTimeout(200)
  expect((await snap(page)).attack).toBe(0)
  await page.getByTestId('resume').click()
  await page.waitForTimeout(1_500)
  expect((await snap(page)).attack).toBe(0)

  const before = (await snap(page)).slime.hp
  const far = (await snap(page)).slime
  await page.evaluate(({ a, x, z }) => a.teleport(x, z), { a: h, x: far.x + 30, z: far.z })
  await page.waitForTimeout(500)
  await slashClick(page)
  await page.waitForTimeout(400)
  await expect
    .poll(async () => (await snap(page)).slime.hp, { timeout: 5_000 })
    .toBe(before)
  expect((await snap(page)).slime.hits).toBe(0)
})

test('the slash arc shows on the swinging stage and parks after the fade', async ({ page }) => {
  const h = await api(page)
  await standOff(page, h)
  const readArcs = (page: Page) =>
    page.evaluate(() => {
      const g = (window as unknown as { __Ghibli: Api }).__Ghibli
      const s = g.snapshot()
      return {
        stage: s.slash.stage,
        active: s.slash.active,
        a0: g.objectVisible('slash-arc-0'),
        a1: g.objectVisible('slash-arc-1'),
      }
    })
  let sawArc0 = false
  let sawArc1 = false
  for (let i = 0; i < 16 && !(sawArc0 && sawArc1); i++) {
    await page.evaluate((a) => a.probeClickEdge(2), h)
    for (let j = 0; j < 7; j++) {
      const r = await readArcs(page)
      if (r.active && r.stage === 0 && r.a0 === true) sawArc0 = true
      if (r.active && r.stage === 1 && r.a1 === true) sawArc1 = true
      if (sawArc0 && sawArc1) break
      await page.waitForTimeout(60)
    }
    await page.waitForTimeout(300)
  }
  expect(sawArc0).toBe(true)
  expect(sawArc1).toBe(true)
  for (let i = 0; i < 15 && (await snap(page)).slash.active; i++) await page.waitForTimeout(300)
  await page.waitForTimeout(600)
  expect(await page.evaluate((a) => a.objectVisible('slash-arc-0'), h)).toBe(false)
  expect(await page.evaluate((a) => a.objectVisible('slash-arc-1'), h)).toBe(false)
  expect(await page.evaluate((a) => a.objectVisible('slash-hit-ring'), h)).toBe(false)
})

const probePoints = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __slashScan?: { union: Set<number>; frames: number } }
    if (!w.__slashScan) return null
    return { frames: w.__slashScan.frames, count: w.__slashScan.union.size }
  })

const armSampler = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __slashScan?: { union: Set<number>; frames: number } }
    const src = document.querySelector('canvas')
    if (!src) return false
    const c = document.createElement('canvas')
    c.width = src.width
    c.height = src.height
    const g = c.getContext('2d')
    if (!g) return false
    w.__slashScan = { union: new Set<number>(), frames: 0 }
    const probe = () => {
      if (!w.__slashScan || w.__slashScan.frames > 20000) return
      g.drawImage(src, 0, 0)
      const img = g.getImageData(0, 0, c.width, c.height).data
      for (let p = 0; p < img.length; p += 4) {
        if (img[p] > 110 && img[p + 1] > 190 && img[p + 2] > 235) w.__slashScan.union.add(p)
      }
      w.__slashScan.frames++
      requestAnimationFrame(probe)
    }
    requestAnimationFrame(probe)
    return true
  })

test('the slash reads as cyan energy on screen and leaves review shots', async ({ page }) => {
  const h = await api(page)
  const s = await standOff(page, h)
  const dx = s.spawnX - s.x
  const dz = s.spawnZ - s.z
  const d = Math.hypot(dx, dz) || 1
  await page.evaluate(
    ({ a, x, z, fx, fz }) => {
      a.teleport(x, z)
      a.face(fx, fz)
    },
    { a: h, x: s.x + (dx / d) * 3, z: s.z + (dz / d) * 3, fx: s.x - dx * 10, fz: s.z - dz * 10 }
  )
  await page.waitForTimeout(700)
  expect(await armSampler(page)).toBe(true)
  await page.waitForTimeout(1_500)
  const base = await probePoints(page)
  expect(base).not.toBeNull()
  for (let attempt = 0; attempt < 8; attempt++) {
    await page.evaluate((a) => a.probeClickEdge(2), h)
    await page.waitForTimeout(600)
  }
  const after = await probePoints(page)
  expect(after).not.toBeNull()
  expect(after!.frames).toBeGreaterThan(base!.frames)
  expect(after!.count - base!.count).toBeGreaterThanOrEqual(100)
  await page.screenshot({ path: 'test-results/slash-fx/mid-slash.png' })
})

test('a slash burst stays inside the draw-call and fps budget', async ({ page }) => {
  const h = await api(page)
  await standOff(page, h)
  let baseline = 0
  for (let i = 0; i < 8; i++) {
    baseline = Math.max(baseline, (await snap(page)).drawCalls)
    await page.waitForTimeout(150)
  }
  let peak = 0
  let minFps = Infinity
  for (let i = 0; i < 12; i++) {
    await slashClick(page, i % 2 === 0 ? 'right' : 'left')
    const s = await snap(page)
    peak = Math.max(peak, s.drawCalls)
    minFps = Math.min(minFps, s.fps)
    await page.waitForTimeout(180)
  }
  for (let i = 0; i < 10; i++) {
    const s = await snap(page)
    peak = Math.max(peak, s.drawCalls)
    minFps = Math.min(minFps, s.fps)
    await page.waitForTimeout(150)
  }
  expect(peak - baseline).toBeLessThanOrEqual(8)
  expect(minFps).toBeGreaterThan(2)
})

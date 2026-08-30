import { expect, test, type Page } from '@playwright/test'
import { pickups } from '../src/lib/items'
import { SPAWN } from '../src/lib/world'

type Snap = {
  ready: boolean
  x: number
  z: number
  hp: number
  maxHp: number
  hurt: number
  fainted: boolean
  attack: number
  near: string
  inv: { food: number }
  wield: { rod: boolean; sword: boolean; axe: boolean }
  slime: {
    x: number
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
}

type Api = {
  snapshot: () => Snap
  teleport: (x: number, z: number) => void
  face: (x: number, z: number) => void
  skipSlimeRespawn: () => void
}

const CX = 200
const CY = 112

const snap = (page: Page) => page.evaluate(() => (window as unknown as { __Ghibli: Api }).__Ghibli.snapshot())
const api = (page: Page) => page.evaluateHandle(() => (window as unknown as { __Ghibli: Api }).__Ghibli)

const damageUntil = async (page: Page, h: Awaited<ReturnType<typeof api>>, targetHp: number, attempts = 40) => {
  for (let i = 0; i < attempts; i++) {
    const s = await snap(page)
    if (s.hp <= targetHp || s.fainted) return true
    if (!s.slime.visible) {
      await page.evaluate((a) => a.skipSlimeRespawn(), h)
      await page.waitForTimeout(600)
      continue
    }
    await page.evaluate(
      ({ a, x, z }) => a.teleport(x, z),
      { a: h, x: s.slime.x + 0.5, z: s.slime.z }
    )
    await page.waitForTimeout(450)
  }
  return (await snap(page)).hp <= targetHp
}

test.beforeEach(async ({ page }) => {
  await page.goto('/?lite')
  await page.waitForFunction(
    () => (window as unknown as { __Ghibli?: { snapshot?: () => { ready: boolean } } }).__Ghibli?.snapshot?.()?.ready === true,
    null,
    { timeout: 60_000 }
  )
})

test('the hero draws the sword with full hearts, never the rod', async ({ page }) => {
  const s = await snap(page)
  expect(s.wield.sword).toBe(true)
  expect(s.wield.rod).toBe(false)
  expect(s.wield.axe).toBe(false)
  expect(s.hp).toBe(s.maxHp)
  expect(s.maxHp).toBe(5)
  await expect(page.getByTestId('player-hearts')).toBeVisible()
  await expect(page.getByTestId('player-hp')).toHaveText('5/5')
  await expect(page.locator('.heart:not(.empty)')).toHaveCount(5)
  await expect(page.locator('.heart.empty')).toHaveCount(0)
})

test('sword swings drain the vitality bar above the slime', async ({ page }) => {
  const h = await api(page)
  const fracs: number[] = []
  await expect.poll(async () => (await snap(page)).slimeHud.frac, { timeout: 20_000 }).toBe(1)
  for (let attempt = 0; attempt < 24; attempt++) {
    const s = (await snap(page)).slime
    if (s.state === 'hidden') break
    if (s.state === 'air' || s.state === 'windup') {
      await page.waitForTimeout(400)
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
      { a: h, x: s.x + (dx / d) * 0.9, z: s.z + (dz / d) * 0.9, fx: s.x, fz: s.z }
    )
    await page.waitForTimeout(250)
    const before = (await snap(page)).slime.hp
    await page.mouse.click(CX, CY)
    for (let i = 0; i < 25; i++) {
      const cur = await snap(page)
      if (cur.slime.hp < before) {
        fracs.push(cur.slimeHud.frac)
        break
      }
      if (cur.slime.state === 'hidden') break
      if (cur.attack === 0 && i > 4) break
      await page.waitForTimeout(200)
    }
  }
  const popped = (await snap(page))
  expect(popped.slime.hp).toBe(0)
  expect(popped.slime.state).toBe('hidden')
  expect(fracs.length).toBeGreaterThanOrEqual(2)
  expect(fracs[0]).toBeCloseTo(2 / 3, 2)
  expect(fracs[1]).toBeCloseTo(1 / 3, 2)

  await page.evaluate((a) => a.skipSlimeRespawn(), h)
  await expect
    .poll(
      async () => {
        const s = await snap(page)
        return s.slime.visible && s.slime.hp === 3 ? s.slimeHud : null
      },
      { timeout: 20_000 }
    )
    .toEqual({ shown: true, frac: 1 })
})

test('the slime costs the hero hearts and the HUD keeps count, then the vale mends', async ({ page }) => {
  const h = await api(page)
  const damaged = await damageUntil(page, h, 3)
  expect(damaged).toBe(true)
  const hurt = await snap(page)
  expect(hurt.hp).toBeLessThanOrEqual(3)
  expect(hurt.hp).toBeGreaterThan(0)
  await expect(page.getByTestId('player-hp')).toHaveText(`${hurt.hp}/5`)
  await expect(page.locator('.heart:not(.empty)')).toHaveCount(hurt.hp)

  await page.evaluate((a) => a.teleport(-21.5, -16), h)
  await expect.poll(async () => (await snap(page)).hp, { timeout: 45_000 }).toBe(5)
  await expect(page.getByTestId('player-hp')).toHaveText('5/5')
})

test('morsels of food mend two hearts', async ({ page }) => {
  const h = await api(page)
  const damaged = await damageUntil(page, h, 3)
  expect(damaged).toBe(true)
  const hurt = await snap(page)
  expect(hurt.hp).toBeLessThanOrEqual(3)
  expect(hurt.inv.food).toBe(0)

  const food = pickups.find((p) => p.type === 'food' && p.alive)
  expect(food).toBeTruthy()
  await page.evaluate(
    ({ a, x, z }) => a.teleport(x, z),
    { a: h, x: food!.x, z: food!.z }
  )
  await page.waitForTimeout(500)
  expect((await snap(page)).near).toBe('pk')
  await page.keyboard.press('KeyE')
  await page.waitForTimeout(300)
  if ((await snap(page)).near === 'pk') {
    await page.keyboard.press('KeyE')
    await page.waitForTimeout(300)
  }
  expect((await snap(page)).inv.food).toBeGreaterThanOrEqual(1)
  await page.keyboard.press('Digit5')
  await page.waitForTimeout(300)
  for (let i = 0; i < 4 && (await snap(page)).hp < 5; i++) {
    await page.keyboard.press('KeyE')
    await page.waitForTimeout(500)
  }
  await expect.poll(async () => (await snap(page)).hp, { timeout: 5_000 }).toBe(5)
  await expect(page.getByTestId('player-hp')).toHaveText('5/5')
})

test('fainting at zero hearts wakes the hero at the spawn shrine with full hearts', async ({ page }) => {
  const h = await api(page)
  const fainted = await damageUntil(page, h, 0, 80)
  expect(fainted).toBe(true)
  expect((await snap(page)).fainted).toBe(true)
  await expect(page.locator('.veil.faint .veil-text')).toHaveText('You fainted…', { timeout: 5_000 })
  await expect.poll(async () => (await snap(page)).fainted, { timeout: 15_000 }).toBe(false)
  const w = await snap(page)
  expect(w.hp).toBe(5)
  expect(Math.hypot(w.x - SPAWN.x, w.z - SPAWN.z)).toBeLessThan(1)
  await expect(page.getByTestId('player-hp')).toHaveText('5/5')
  await expect(page.locator('.heart:not(.empty)')).toHaveCount(5)
})

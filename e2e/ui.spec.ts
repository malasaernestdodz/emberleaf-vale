import { expect, test, type Page } from '@playwright/test'
import { pickups } from '../src/lib/items'
import { TREES } from '../src/lib/world'

type Snap = {
  ready: boolean
  x: number
  y: number
  z: number
  near: string
  attack: number
  menu: boolean
  pickups: number
  inv: { rock: number; flower: number; wood: number; fish: number; food: number; gel: number }
  quests: {
    ver: number
    done: number
    list: { id: string; progress: number; target: number; done: boolean }[]
  }
  audio: { master: number; sfx: boolean; ambience: boolean; muted: boolean; last: string; unlocked: boolean }
  slime: { x: number; y: number; z: number; state: string; hits: number; visible: boolean; spawnX: number; spawnZ: number }
}

type Api = {
  snapshot: () => Snap
  teleport: (x: number, z: number) => void
  setCamYaw: (y: number) => void
  face: (x: number, z: number) => void
  skipSlimeRespawn: () => void
}

const CX = 200
const CY = 112

const snap = (page: Page) => page.evaluate(() => (window as unknown as { __Ghibli: Api }).__Ghibli.snapshot())
const api = (page: Page) => page.evaluateHandle(() => (window as unknown as { __Ghibli: Api }).__Ghibli)

test.beforeEach(async ({ page }) => {
  await page.goto('/?lite')
  await page.waitForFunction(
    () => (window as unknown as { __Ghibli?: { snapshot?: () => { ready: boolean } } }).__Ghibli?.snapshot?.()?.ready === true,
    null,
    { timeout: 60_000 }
  )
})

test('Escape opens the pause menu, freezes gameplay, and closes again', async ({ page }) => {
  await page.keyboard.press('Escape')
  await expect(page.locator('.menu-card')).toBeVisible()
  expect((await snap(page)).menu).toBe(true)

  const h = await api(page)
  await page.evaluate((a) => a.teleport(0, 8), h)
  await page.waitForTimeout(400)
  const s0 = await snap(page)
  await page.keyboard.down('ArrowUp')
  await page.waitForTimeout(700)
  await page.keyboard.up('ArrowUp')
  const s1 = await snap(page)
  expect(Math.hypot(s1.x - s0.x, s1.z - s0.z)).toBeLessThan(0.2)

  await page.keyboard.press('Escape')
  await expect(page.locator('.menu-card')).toHaveCount(0)
  expect((await snap(page)).menu).toBe(false)
  const s2 = await snap(page)
  await page.keyboard.down('ArrowUp')
  let moved = 0
  for (let i = 0; i < 40 && moved < 0.6; i++) {
    const s = await snap(page)
    moved = Math.hypot(s.x - s2.x, s.z - s2.z)
    await page.waitForTimeout(250)
  }
  await page.keyboard.up('ArrowUp')
  expect(moved).toBeGreaterThan(0.6)
})

test('gear button opens the menu with sound settings', async ({ page }) => {
  await page.getByTestId('gear').click()
  await expect(page.locator('.menu-card')).toBeVisible()
  await expect(page.locator('.menu-section', { hasText: 'Sound' })).toBeVisible()
  await expect(page.getByTestId('master-volume')).toBeVisible()
  await expect(page.getByTestId('sfx-toggle')).toBeVisible()
  await expect(page.getByTestId('amb-toggle')).toBeVisible()
  await expect(page.getByTestId('test-sound')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.menu-card')).toHaveCount(0)
})

test('master slider, toggles, and test-sound update the audio snapshot and persist across reload', async ({ page }) => {
  await page.keyboard.press('Escape')
  await expect(page.locator('.menu-card')).toBeVisible()

  await page.getByTestId('master-volume').fill('40')
  await expect(page.getByTestId('master-pct')).toHaveText('40')
  expect((await snap(page)).audio.master).toBeCloseTo(0.4, 2)

  await page.getByTestId('sfx-toggle').uncheck()
  expect((await snap(page)).audio.sfx).toBe(false)
  await page.getByTestId('sfx-toggle').check()
  expect((await snap(page)).audio.sfx).toBe(true)

  await page.getByTestId('amb-toggle').uncheck()
  expect((await snap(page)).audio.ambience).toBe(false)
  await page.getByTestId('amb-toggle').check()
  expect((await snap(page)).audio.ambience).toBe(true)

  await page.getByTestId('test-sound').click()
  await page.waitForTimeout(300)
  const audioSnap = (await snap(page)).audio
  expect(audioSnap.unlocked).toBe(true)
  expect(audioSnap.last).toBe('test')

  await page.keyboard.press('Escape')
  await expect(page.locator('.menu-card')).toHaveCount(0)
  await page.reload()
  await page.waitForFunction(
    () => (window as unknown as { __Ghibli?: { snapshot?: () => { ready: boolean } } }).__Ghibli?.snapshot?.()?.ready === true,
    null,
    { timeout: 60_000 }
  )
  expect((await snap(page)).audio.master).toBeCloseTo(0.4, 2)
  await page.keyboard.press('Escape')
  await expect(page.locator('.menu-card')).toBeVisible()
  await expect(page.getByTestId('master-pct')).toHaveText('40')
})

test('quest HUD shows the log and advances after a real flower pickup', async ({ page }) => {
  await expect(page.getByTestId('quest-hud')).toBeVisible()
  await expect(page.getByTestId('quest-flowers')).toHaveText('0/3')

  const flower = pickups.find(
    (p) => p.type === 'flower' && p.alive && TREES.every((t) => Math.hypot(t.x - p.x, t.z - p.z) > 2.5)
  )
  expect(flower).toBeTruthy()
  const h = await api(page)
  await page.evaluate(
    ({ a, x, z }) => {
      a.teleport(x, z)
    },
    { a: h, x: flower!.x, z: flower!.z }
  )
  await page.waitForTimeout(400)
  let nearFlower = ''
  for (let i = 0; i < 20 && nearFlower !== 'pk'; i++) {
    nearFlower = (await snap(page)).near
    if (nearFlower === 'pk') break
    await page.waitForTimeout(300)
  }
  expect(nearFlower).toBe('pk')
  await page.keyboard.press('KeyE')
  await page.waitForTimeout(400)
  await expect(page.getByTestId('quest-flowers')).toHaveText('1/3')
  const q = (await snap(page)).quests.list.find((q) => q.id === 'flowers')
  expect(q?.progress).toBe(1)
  expect((await snap(page)).inv.flower).toBe(1)
})

test('hotbar renders six SVG item icons and selection pops', async ({ page }) => {
  const icons = page.locator('.hotbar .slot .slot-icon svg')
  await expect(icons).toHaveCount(6)
  await page.keyboard.press('Digit6')
  await page.waitForTimeout(300)
  const activeName = await page.locator('.hotbar .slot.active .slot-name').innerText()
  expect(activeName.toLowerCase()).toBe('gel')
})

test('three sword swings pop the slime into gel pickups and it respawns', async ({ page }) => {
  const h = await api(page)
  for (let attempt = 0; attempt < 20; attempt++) {
    const s = (await snap(page)).slime
    if (s.state === 'hidden') break
    if (s.state === 'air' || s.state === 'windup') {
      await page.waitForTimeout(400)
      continue
    }
    const dx = s.spawnX - s.x
    const dz = s.spawnZ - s.z
    const d = Math.hypot(dx, dz) || 1
    const px = s.x + (dx / d) * 0.9
    const pz = s.z + (dz / d) * 0.9
    await page.evaluate(
      ({ a, x, z, fx, fz }) => {
        a.teleport(x, z)
        a.face(fx, fz)
      },
      { a: h, x: px, z: pz, fx: s.x, fz: s.z }
    )
    await page.waitForTimeout(250)
    const before = (await snap(page)).slime.hits
    await page.mouse.click(CX, CY)
    for (let i = 0; i < 20; i++) {
      const cur = (await snap(page)).slime
      if (cur.hits > before || cur.state === 'hidden') break
      if ((await snap(page)).attack === 0 && i > 4) break
      await page.waitForTimeout(200)
    }
  }
  const popped = (await snap(page)).slime
  expect(popped.hits).toBe(3)
  expect(popped.state).toBe('hidden')
  expect(popped.visible).toBe(false)

  await page.waitForTimeout(600)
  const after = (await snap(page))
  expect(after.pickups).toBeGreaterThan(23)
  expect(after.quests.list.find((q) => q.id === 'slime')?.progress).toBe(1)

  await page.evaluate(
    ({ a, x, z }) => a.teleport(x, z),
    { a: h, x: popped.x, z: popped.z }
  )
  await page.waitForTimeout(400)
  let nearGel = ''
  for (let i = 0; i < 20 && nearGel !== 'pk'; i++) {
    nearGel = (await snap(page)).near
    if (nearGel === 'pk') break
    await page.waitForTimeout(300)
  }
  expect(nearGel).toBe('pk')
  await page.keyboard.press('KeyE')
  await page.waitForTimeout(400)
  expect((await snap(page)).inv.gel).toBeGreaterThanOrEqual(1)

  await page.evaluate((a) => a.skipSlimeRespawn(), h)
  let respawned = false
  for (let i = 0; i < 20; i++) {
    const s = (await snap(page)).slime
    if (s.visible && s.hits === 0 && Math.hypot(s.x - s.spawnX, s.z - s.spawnZ) < 0.5) {
      respawned = true
      break
    }
    await page.waitForTimeout(300)
  }
  expect(respawned).toBe(true)
})

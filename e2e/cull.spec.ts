import { expect, test, type Page } from '@playwright/test'

type CullEntry = { id: string; visible: boolean; r: number; dist: number }

type Snap = {
  ready: boolean
  culled: { visible: number; total: number }
  settings: { renderDistance: number; showGrass: boolean; showFog: boolean }
}

type Api = {
  snapshot: () => Snap
  teleport: (x: number, z: number, high?: boolean) => void
  cullList: () => CullEntry[]
  cullVisible: (id: string) => boolean | null
  setRenderDistance: (v: number) => void
  objectVisible: (name: string, child?: number) => boolean | null
}

const snap = (page: Page) => page.evaluate(() => (window as unknown as { __Ghibli: Api }).__Ghibli.snapshot())
const api = (page: Page) => page.evaluateHandle(() => (window as unknown as { __Ghibli: Api }).__Ghibli)

const LANDMARKS = ['fountain', 'house', 'mansion', 'pond', 'well', 'windmill']

test.beforeEach(async ({ page }) => {
  await page.goto('/?lite')
  await page.waitForFunction(
    () => (window as unknown as { __Ghibli?: { snapshot?: () => { ready: boolean } } }).__Ghibli?.snapshot?.()?.ready === true,
    null,
    { timeout: 240_000 }
  )
})

test('cull registry holds landmarks plus trees with finite bounds', async ({ page }) => {
  const h = await api(page)
  const list = await page.evaluate((a) => a.cullList(), h)
  const ids = list.map((e) => e.id)
  for (const id of LANDMARKS) expect(ids, `landmark ${id} registered`).toContain(id)
  expect(ids.filter((id) => id.startsWith('tree-')).length).toBeGreaterThan(0)
  for (const e of list) {
    expect(e.r).toBeGreaterThan(0)
    expect(Number.isFinite(e.dist)).toBe(true)
  }
})

test('landmarks flip visibility across the render distance boundary', async ({ page }) => {
  const h = await api(page)
  await page.evaluate((a) => a.setRenderDistance(20), h)
  await page.waitForTimeout(2000)
  const list = await page.evaluate((a) => a.cullList(), h)
  const near = list.find((e) => e.id === 'fountain')!
  const far = list.find((e) => e.id === 'mansion')!
  expect(near.dist - near.r).toBeLessThan(20)
  expect(await page.evaluate((a) => a.cullVisible('fountain'), h)).toBe(true)
  expect(far.dist - far.r).toBeGreaterThan(20)
  expect(await page.evaluate((a) => a.cullVisible('mansion'), h)).toBe(false)
  const s = await snap(page)
  expect(s.settings.renderDistance).toBe(20)
  await page.evaluate((a) => a.setRenderDistance(220), h)
  await page.waitForTimeout(2000)
  expect(await page.evaluate((a) => a.cullVisible('mansion'), h)).toBe(true)
})

test('grass toggle drives the grass meshes by visibility', async ({ page }) => {
  const h = await api(page)
  expect(await page.evaluate((a) => a.objectVisible('grass-root'), h)).toBe(true)
  expect(await page.evaluate((a) => a.objectVisible('grass-root', 0), h)).toBe(true)
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('emberleaf.settings.v1') ?? '{}')
    localStorage.setItem('emberleaf.settings.v1', JSON.stringify({ ...s, showGrass: false }))
  })
  await page.reload()
  await page.waitForFunction(
    () => (window as unknown as { __Ghibli?: { snapshot?: () => { ready: boolean } } }).__Ghibli?.snapshot?.()?.ready === true,
    null,
    { timeout: 240_000 }
  )
  const h2 = await api(page)
  expect(await page.evaluate((a) => a.objectVisible('grass-root', 0), h2)).toBe(false)
  expect(await page.evaluate((a) => a.objectVisible('grass-root', 1), h2)).toBe(false)
  const snap2 = await snap(page)
  expect(snap2.settings.showGrass).toBe(false)
  expect(snap2.settings.renderDistance).toBe(70)
})

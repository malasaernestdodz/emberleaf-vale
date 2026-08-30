import { expect, test, type Page } from '@playwright/test'
import {
  FOUNTAIN,
  HOUSE,
  HOUSE_DOOR,
  MANSION,
  MANSION_DOOR,
  MILL_BALCONY,
  POND,
  WELL,
  WINDMILL,
  houseWorld,
  mansionWorld,
  millWorld,
} from '../src/lib/world'

type Api = {
  snapshot: () => { ready: boolean; inside: boolean; insideMansion: boolean; x: number; z: number }
  teleport: (x: number, z: number) => void
  setCamYaw: (y: number) => void
}

const hideHud = (page: Page) =>
  page.addStyleTag({
    content:
      '.hud,.quests,.hotbar,.intro,.prompt,.hearts,.gear,.crosshair,.debug-panel,.veil-text{display:none!important}',
  })

const api = (page: Page) => page.evaluateHandle(() => (window as unknown as { __Ghibli: Api }).__Ghibli)
const snap = (page: Page) => page.evaluate(() => (window as unknown as { __Ghibli: Api }).__Ghibli.snapshot())

const face = (from: { x: number; z: number }, to: { x: number; z: number }) =>
  Math.atan2(-(to.x - from.x), -(to.z - from.z))

const pixel = (page: Page, u: number, v: number) =>
  page.evaluate(
    ([u, v]) => {
      const src = document.querySelector('canvas')
      if (!src) return null
      const c = document.createElement('canvas')
      c.width = src.width
      c.height = src.height
      const g = c.getContext('2d')
      if (!g) return null
      g.drawImage(src, 0, 0)
      const d = g.getImageData(Math.floor(src.width * u), Math.floor(src.height * v), 1, 1).data
      return [d[0], d[1], d[2]]
    },
    [u, v]
  )

type Shot = { name: string; from: { x: number; z: number }; to: { x: number; z: number }; zoom?: boolean }

const SHOTS: Shot[] = [
  {
    name: 'door-house',
    from: houseWorld(HOUSE_DOOR.hingeLX + HOUSE_DOOR.openW / 2, HOUSE.d / 2 + 2.3),
    to: houseWorld(HOUSE.doorLX, HOUSE.d / 2 - 0.5),
    zoom: true,
  },
  {
    name: 'door-mansion',
    from: mansionWorld(MANSION_DOOR.hingeLX + MANSION_DOOR.openW / 2, MANSION.d / 2 + 2.8),
    to: mansionWorld(MANSION_DOOR.hingeLX + MANSION_DOOR.openW / 2, MANSION.d / 2 - 0.5),
    zoom: true,
  },
  {
    name: 'interior-house',
    from: houseWorld(HOUSE.doorLX, 0.9),
    to: houseWorld(-2.2, -1.6),
  },
  {
    name: 'interior-mansion-foyer',
    from: mansionWorld(MANSION_DOOR.hingeLX + MANSION_DOOR.openW / 2, 3.4),
    to: mansionWorld(0, -2.5),
  },
  {
    name: 'mansion-corner',
    from: mansionWorld(MANSION.w / 2 + 3.2, MANSION.d / 2 + 3.2),
    to: mansionWorld(0, 0),
  },
  {
    name: 'well',
    from: { x: WELL.x + 3.4, z: WELL.z + 2.6 },
    to: WELL,
  },
  {
    name: 'fountain-plaza',
    from: { x: FOUNTAIN.x, z: FOUNTAIN.z + 8.2 },
    to: FOUNTAIN,
  },
  {
    name: 'pond',
    from: { x: POND.x + 1.5, z: POND.z + 8.5 },
    to: { x: POND.x, z: POND.z },
  },
  {
    name: 'windmill-door',
    from: { x: WINDMILL.x - 2.0, z: WINDMILL.z + 7.2 },
    to: { x: WINDMILL.x, z: WINDMILL.z },
  },
  {
    name: 'windmill-shell',
    from: millWorld(
      -Math.sin((MILL_BALCONY.phi0 + MILL_BALCONY.phi1) / 2) * 7.2,
      Math.cos((MILL_BALCONY.phi0 + MILL_BALCONY.phi1) / 2) * 7.2
    ),
    to: millWorld(
      -Math.sin((MILL_BALCONY.phi0 + MILL_BALCONY.phi1) / 2) * 0.5,
      Math.cos((MILL_BALCONY.phi0 + MILL_BALCONY.phi1) / 2) * 0.5
    ),
  },
]

test('visual gallery records every landmark from its storybook angle', async ({ page }) => {
  await page.goto('/?lite')
  hideHud(page)
  await page.waitForFunction(
    () => (window as unknown as { __Ghibli?: { snapshot?: () => { ready: boolean } } }).__Ghibli?.snapshot?.()?.ready === true,
    null,
    { timeout: 120_000 }
  )
  const h = await api(page)
  for (const s of SHOTS) {
    await page.evaluate(
      ({ a, x, z, yaw }) => {
        a.teleport(x, z)
        a.setCamYaw(yaw)
      },
      { a: h, x: s.from.x, z: s.from.z, yaw: face(s.from, s.to) }
    )
    await page.waitForTimeout(700)
    if (s.zoom) {
      await page.mouse.wheel(0, -700)
      await page.waitForTimeout(900)
    }
    await page.screenshot({ path: `test-results/gallery/${s.name}.png` })
  }
})

test('house doorway reads as a door, not a hole', async ({ page }) => {
  await page.goto('/?lite')
  hideHud(page)
  await page.waitForFunction(
    () => (window as unknown as { __Ghibli?: { snapshot?: () => { ready: boolean } } }).__Ghibli?.snapshot?.()?.ready === true,
    null,
    { timeout: 120_000 }
  )
  const h = await api(page)
  const s0 = SHOTS[0]
  await page.evaluate(
    ({ a, x, z, yaw }) => {
      a.teleport(x, z)
      a.setCamYaw(yaw)
    },
    { a: h, x: s0.from.x, z: s0.from.z, yaw: face(s0.from, s0.to) }
  )
  await page.waitForTimeout(700)
  await page.mouse.wheel(0, -700)
  await page.waitForTimeout(900)
  const sky = await pixel(page, 0.98, 0.05)
  expect(sky).not.toBeNull()
  expect(sky![2]).toBeGreaterThan(sky![0])
  const center = await pixel(page, 0.5, 0.4)
  expect(center).not.toBeNull()
  expect(center![0]).toBeGreaterThan(center![2])
})

test('mansion doorway reads as a door, not a hole', async ({ page }) => {
  await page.goto('/?lite')
  hideHud(page)
  await page.waitForFunction(
    () => (window as unknown as { __Ghibli?: { snapshot?: () => { ready: boolean } } }).__Ghibli?.snapshot?.()?.ready === true,
    null,
    { timeout: 120_000 }
  )
  const h = await api(page)
  const s0 = SHOTS[1]
  await page.evaluate(
    ({ a, x, z, yaw }) => {
      a.teleport(x, z)
      a.setCamYaw(yaw)
    },
    { a: h, x: s0.from.x, z: s0.from.z, yaw: face(s0.from, s0.to) }
  )
  await page.waitForTimeout(700)
  await page.mouse.wheel(0, -700)
  await page.waitForTimeout(900)
  const sky = await pixel(page, 0.98, 0.05)
  expect(sky).not.toBeNull()
  expect(sky![2]).toBeGreaterThan(sky![0])
  const center = await pixel(page, 0.5, 0.4)
  expect(center).not.toBeNull()
  expect(center![0]).toBeGreaterThan(center![2])
})

test('interior probes report the right inside flags from gallery spots', async ({ page }) => {
  await page.goto('/?lite')
  hideHud(page)
  await page.waitForFunction(
    () => (window as unknown as { __Ghibli?: { snapshot?: () => { ready: boolean } } }).__Ghibli?.snapshot?.()?.ready === true,
    null,
    { timeout: 120_000 }
  )
  const h = await api(page)
  const houseIn = SHOTS[2]
  await page.evaluate(
    ({ a, x, z }) => {
      a.teleport(x, z)
    },
    { a: h, x: houseIn.from.x, z: houseIn.from.z }
  )
  await page.waitForTimeout(600)
  expect((await snap(page)).inside).toBe(true)
  const foyer = SHOTS[3]
  await page.evaluate(
    ({ a, x, z }) => {
      a.teleport(x, z)
    },
    { a: h, x: foyer.from.x, z: foyer.from.z }
  )
  await page.waitForTimeout(600)
  expect((await snap(page)).insideMansion).toBe(true)
})

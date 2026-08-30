import { expect, test, type Page } from '@playwright/test'
import { HOUSE, MILL, TREES, millWorld } from '../src/lib/world'

type Api = {
  teleport: (x: number, z: number, high?: boolean) => void
  setCamYaw: (y: number) => void
}

const lookAt = (from: { x: number; z: number }, to: { x: number; z: number }) =>
  Math.atan2(-(to.x - from.x), -(to.z - from.z))

const goto = async (page: Page) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/?lite')
  await page.waitForFunction(
    () => (window as unknown as { __Ghibli?: { snapshot?: () => { ready: boolean } } }).__Ghibli?.snapshot?.()?.ready === true,
    null,
    { timeout: 120_000 }
  )
}

const pose = async (page: Page, from: { x: number; z: number }, to: { x: number; z: number }) => {
  const h = await page.evaluateHandle(() => (window as unknown as { __Ghibli: Api }).__Ghibli)
  await page.evaluate(
    ({ a, x, z, yaw }) => {
      a.teleport(x, z)
      a.setCamYaw(yaw)
    },
    { a: h, x: from.x, z: from.z, yaw: lookAt(from, to) }
  )
}

test('review shots', async ({ page }) => {
  await goto(page)
  const press = async (k: string) => {
    await page.keyboard.press(k)
    await page.waitForTimeout(400)
  }
  await pose(page, { x: 5.5, z: -2.5 }, HOUSE)
  await page.waitForTimeout(800)
  await press('KeyC')
  await press('KeyV')
  await page.waitForTimeout(700)
  await page.screenshot({ path: 'test-results/review-house-solid.png' })
  await press('KeyV')
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'test-results/review-house-wire.png' })

  const millSpot = millWorld(0, MILL.skirtR + 6)
  await pose(page, millSpot, MILL)
  await page.waitForTimeout(900)
  await page.screenshot({ path: 'test-results/review-windmill-wire.png' })
  await press('KeyV')
  await page.waitForTimeout(700)
  await page.screenshot({ path: 'test-results/review-windmill-solid.png' })

  const t = TREES[0]
  const treeSpot = { x: t.x + 2, z: t.z + 5.5 }
  await pose(page, treeSpot, t)
  await page.waitForTimeout(900)
  await page.screenshot({ path: 'test-results/review-tree-solid.png' })
  await press('KeyC')
  await press('KeyV')
  expect(true).toBe(true)
})

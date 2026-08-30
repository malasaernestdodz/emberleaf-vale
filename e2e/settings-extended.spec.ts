import { expect, test, type Page } from '@playwright/test'

type Api = {
  snapshot: () => {
    ready: boolean
    camPitch: number
    fov: number
    settings: {
      renderDistance: number
      fov: number
      sensitivity: number
      invertY: boolean
      showFps: boolean
    }
  }
}

const snap = (page: Page) => page.evaluate(() => (window as unknown as { __Ghibli: Api }).__Ghibli.snapshot())

test.beforeEach(async ({ page }) => {
  await page.goto('/?lite')
  await page.waitForFunction(
    () => (window as unknown as { __Ghibli?: { snapshot?: () => { ready: boolean } } }).__Ghibli?.snapshot?.()?.ready === true,
    null,
    { timeout: 60_000 }
  )
})

async function dragDown(page: Page, dy: number) {
  await page.mouse.move(200, 112)
  await page.mouse.down()
  await page.mouse.move(200, 112 + dy, { steps: 6 })
  await page.mouse.up()
  await page.waitForTimeout(250)
}

test('menu exposes world, graphics, and control settings', async ({ page }) => {
  await page.keyboard.press('Escape')
  await expect(page.locator('.menu-card')).toBeVisible()
  await expect(page.locator('.menu-section', { hasText: 'World' })).toBeVisible()
  await expect(page.locator('.menu-section', { hasText: 'Controls' })).toBeVisible()
  await expect(page.getByTestId('render-distance')).toBeVisible()
  await expect(page.getByTestId('render-distance-value')).toHaveText('70 m')
  await expect(page.getByTestId('fog-toggle')).toBeVisible()
  await expect(page.getByTestId('grass-toggle')).toBeVisible()
  await expect(page.getByTestId('fov')).toBeVisible()
  await expect(page.getByTestId('show-fps')).toBeVisible()
  await expect(page.getByTestId('sensitivity-value')).toHaveText('1.0×')
  await expect(page.getByTestId('invert-y')).toBeVisible()
  await page.keyboard.press('Escape')
})

test('fov slider retargets the camera and persists across reload', async ({ page }) => {
  await page.keyboard.press('Escape')
  await page.getByTestId('fov').fill('70')
  await expect(page.getByTestId('fov-value')).toHaveText('70°')
  await page.keyboard.press('Escape')
  await expect.poll(async () => (await snap(page)).fov, { timeout: 10_000 }).toBeCloseTo(70, 0)

  await page.reload()
  await page.waitForFunction(
    () => (window as unknown as { __Ghibli?: { snapshot?: () => { ready: boolean } } }).__Ghibli?.snapshot?.()?.ready === true,
    null,
    { timeout: 60_000 }
  )
  expect((await snap(page)).settings.fov).toBe(70)
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('fov')).toHaveValue('70')
  await page.keyboard.press('Escape')
})

test('sensitivity scales drag look and invert-Y flips its sign', async ({ page }) => {
  const before = (await snap(page)).camPitch
  await dragDown(page, 60)
  const afterBase = (await snap(page)).camPitch
  const deltaBase = afterBase - before
  expect(deltaBase).toBeGreaterThan(0.1)

  await page.keyboard.press('Escape')
  await page.getByTestId('sensitivity').fill('2')
  await page.keyboard.press('Escape')
  await dragDown(page, 60)
  const deltaFast = (await snap(page)).camPitch - afterBase
  expect(deltaFast).toBeGreaterThan(deltaBase * 1.6)
  expect(deltaFast).toBeLessThan(deltaBase * 2.6)

  await page.keyboard.press('Escape')
  await page.getByTestId('invert-y').check()
  await page.keyboard.press('Escape')
  const pitchBeforeInverted = (await snap(page)).camPitch
  await dragDown(page, 60)
  const deltaInverted = (await snap(page)).camPitch - pitchBeforeInverted
  expect(deltaInverted).toBeLessThan(0)
})

test('show fps toggles the hud fps segment', async ({ page }) => {
  const row = page.locator('.hud .row').first()
  await expect(row).toContainText('fps')

  await page.keyboard.press('Escape')
  await page.getByTestId('show-fps').uncheck()
  await page.keyboard.press('Escape')
  await expect(row).not.toContainText('fps')

  await page.keyboard.press('Escape')
  await page.getByTestId('show-fps').check()
  await page.keyboard.press('Escape')
  await expect(row).toContainText('fps')
  await expect(row).toContainText('drawn')
})

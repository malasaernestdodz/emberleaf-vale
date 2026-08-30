import { test } from '@playwright/test'

type Snap = { ready: boolean; t: number; x: number; z: number; menu: boolean; fps: number; drawCalls: number }

const snap = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as unknown as { __Ghibli: { snapshot: () => Snap } }).__Ghibli.snapshot())

test('diagnose context loss', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/?lite')
  await page.waitForFunction(
    () => (window as unknown as { __Ghibli?: { snapshot?: () => { ready: boolean } } }).__Ghibli?.snapshot?.()?.ready === true,
    null,
    { timeout: 60_000 }
  )
  await page.evaluate(() => {
    const w = window as unknown as { __ctxEvents: string[] }
    w.__ctxEvents = []
    const canvas = document.querySelector('canvas')
    canvas?.addEventListener('webglcontextlost', () => w.__ctxEvents.push('lost:' + Date.now()))
    canvas?.addEventListener('webglcontextrestored', () => w.__ctxEvents.push('restored:' + Date.now()))
  })
  const t0 = (await snap(page)).t
  await page.waitForTimeout(600)
  const t1 = (await snap(page)).t
  console.log('baseline dt:', (t1 - t0).toFixed(3))

  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(500)
    const s = await snap(page)
    const ev = await page.evaluate(() => (window as unknown as { __ctxEvents: string[] }).__ctxEvents)
    console.log(`post${i}: t ${s.t.toFixed(2)} pos ${s.x.toFixed(2)},${s.z.toFixed(2)} ctxEvents [${ev}]`)
  }
  console.log('pageerrors:', errors.length ? errors.slice(0, 4) : 'none')
})

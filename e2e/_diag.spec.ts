import { expect, test, type Page } from '@playwright/test'
import { MILL, millWorld } from '../src/lib/world'

type Snap = { x: number; y: number; z: number; t: number; mllx: number; mllz: number; grounded: boolean; mode: string }

const api = (page: Page) =>
  page.evaluateHandle(() => (window as unknown as { __Ghibli: { snapshot: () => Snap; teleport: (x: number, z: number, high?: boolean) => void; setCamYaw: (y: number) => void } }).__Ghibli)

test('diagnose windmill approach', async ({ page }) => {
  await page.goto('/?lite')
  await page.waitForFunction(
    () => (window as unknown as { __Ghibli?: { snapshot?: () => { ready: boolean } } }).__Ghibli?.snapshot?.()?.ready === true,
    null,
    { timeout: 240_000 }
  )
  const h = await api(page)
  const start = millWorld(0, 7.4)
  const onSteps = millWorld(0, 6.0)
  const throughDoor = millWorld(0, 4.4)
  await page.evaluate(({ a, x, z }) => a.teleport(x, z), { a: h, x: start.x, z: start.z })
  await page.waitForTimeout(400)
  const lines: string[] = []
  await page.keyboard.down('ArrowUp')
  const t0 = (await page.evaluate(() => (window as unknown as { __Ghibli: { snapshot: () => Snap } }).__Ghibli.snapshot())).t
  for (let i = 0; i < 90; i++) {
    const s = await page.evaluate(() => (window as unknown as { __Ghibli: { snapshot: () => Snap } }).__Ghibli.snapshot())
    lines.push(`i${i} t ${s.t.toFixed(1)} mlx ${s.mllx.toFixed(2)} mlz ${s.mllz.toFixed(2)} dy ${(s.y - MILL.base).toFixed(2)} grounded ${s.grounded} mode ${s.mode}`)
    if (s.mllz < 4.6 || s.t - t0 > 20) break
    const target = s.mllz > 6.3 ? onSteps : throughDoor
    await page.evaluate(
      ({ g, tx, tz }) => {
        const st = g.snapshot()
        const dx = tx - st.x
        const dz = tz - st.z
        const n = Math.hypot(dx, dz) || 1
        g.setCamYaw(Math.atan2(-dx / n, -dz / n))
      },
      { g: h, tx: target.x, tz: target.z }
    )
    await page.waitForTimeout(200)
  }
  await page.keyboard.up('ArrowUp')
  console.log(lines.join('\n'))
  expect(lines.length).toBeGreaterThan(0)
})

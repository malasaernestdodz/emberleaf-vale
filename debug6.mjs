import { chromium } from '@playwright/test'

const b = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
})
const p = await b.newPage()
p.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 300)))
await p.goto('http://localhost:4173/')
await p.waitForFunction(() => window.__Ghibli?.snapshot?.()?.ready === true, null, { timeout: 60_000 })

const pts = [
  [0, 12],
  [0, 10],
  [-0.5, 8],
  [-1, 6],
  [-2, 4],
  [-3, 2],
  [-3.3, 4.7],
  [-4, 6],
  [-2, 9],
]
for (const [x, z] of pts) {
  await p.evaluate((pt) => window.__Ghibli.teleport(pt[0], pt[1]), [x, z])
  await p.waitForTimeout(120)
  const s = await p.evaluate(() => window.__Ghibli.snapshot())
  console.log(`(${x},${z}) y=${s.y}`)
}
await p.evaluate(() => window.__Ghibli.teleport(0, 12))
await p.waitForTimeout(200)
let s = await p.evaluate(() => window.__Ghibli.snapshot())
console.log('spawn y', s.y, 'grounded', s.grounded)
await p.keyboard.press('Space')
for (let i = 0; i < 10; i++) {
  await p.waitForTimeout(150)
  s = await p.evaluate(() => window.__Ghibli.snapshot())
  console.log('after jump', i, 'y', s.y, 'vy-grounded', s.grounded, s.mode)
}
await b.close()

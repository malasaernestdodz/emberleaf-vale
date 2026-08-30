# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: collision.spec.ts >> windmill spiral climbs with held keys and steps match the mesh
- Location: e2e\collision.spec.ts:103:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic:
    - heading "EMBERLEAF VALE" [level=1]
    - generic: x 19.9 · y 0.15 · z -14.3 · 21 fps · 41 draws · 21/24 drawn
    - generic:
      - button "[C] collider debug off" [ref=e6] [cursor=pointer]
      - button "[V] solid shapes off" [ref=e7] [cursor=pointer]
  - generic: Click the world to look with the mouse (Esc frees it) · WASD walk · Ctrl/Shift sprint · Space jump · E interact · G throw · 1-6 items · left-click attack · Esc menu · C collider debug · V solid collider shapes · P perf trace · scroll to zoom
  - generic:
    - generic: VITALITY
    - generic: 5/5
  - button "Open menu" [ref=e8] [cursor=pointer]
  - generic:
    - generic:
      - text: QUESTS
      - generic: 0/6
    - generic:
      - generic: Heart of the Vale
      - generic: 0/1
      - generic: Visit the fountain plaza
    - generic:
      - generic: Petal Gathering
      - generic: 0/3
      - generic: Pick up 3 flowers
    - generic:
      - generic: Firewood Run
      - generic: 0/1
      - generic: Chop a tree for wood
  - generic:
    - generic:
      - generic: "0"
      - generic: Rock
      - generic: "1"
    - generic:
      - generic: "0"
      - generic: Flower
      - generic: "2"
    - generic:
      - generic: "0"
      - generic: Wood
      - generic: "3"
    - generic:
      - generic: "0"
      - generic: Fish
      - generic: "4"
    - generic:
      - generic: "0"
      - generic: Food
      - generic: "5"
    - generic:
      - generic: "0"
      - generic: Gel
      - generic: "6"
```

# Test source

```ts
  29  |   drawCalls: number
  30  |   fps: number
  31  | }
  32  | 
  33  | type Api = {
  34  |   snapshot: () => Snap
  35  |   teleport: (x: number, z: number, high?: boolean) => void
  36  |   setCamYaw: (y: number) => void
  37  |   raycastDown: (x: number, z: number, fromY: number) => number | null
  38  | }
  39  | 
  40  | const api = (page: Page) => page.evaluateHandle(() => (window as unknown as { __Ghibli: Api }).__Ghibli)
  41  | 
  42  | const snap = (page: Page) => page.evaluate(() => (window as unknown as { __Ghibli: Api }).__Ghibli.snapshot())
  43  | 
  44  | test.beforeEach(async ({ page }) => {
  45  |   await page.goto('/?lite')
  46  |   await page.waitForFunction(
  47  |     () => (window as unknown as { __Ghibli?: { snapshot?: () => { ready: boolean } } }).__Ghibli?.snapshot?.()?.ready === true,
  48  |     null,
  49  |     { timeout: 240_000 }
  50  |   )
  51  | })
  52  | 
  53  | const steerTo = (page: Page, h: Awaited<ReturnType<typeof api>>, tx: number, tz: number, yaw: number) =>
  54  |   page.evaluate(
  55  |     ({ g, tx, tz, yaw }) => {
  56  |       const st = g.snapshot()
  57  |       const dx = tx - st.x
  58  |       const dz = tz - st.z
  59  |       const n = Math.hypot(dx, dz) || 1
  60  |       const wx = (dx / n) * Math.cos(yaw) + (dz / n) * Math.sin(yaw)
  61  |       const wz = -(dx / n) * Math.sin(yaw) + (dz / n) * Math.cos(yaw)
  62  |       g.setCamYaw(Math.atan2(-wx, -wz))
  63  |     },
  64  |     { g: h, tx, tz, yaw }
  65  |   )
  66  | 
  67  | test('windmill door walk-in stands on the porch threshold, not buried in stone', async ({ page }) => {
  68  |   const h = await api(page)
  69  |   const start = millWorld(0, 7.4)
  70  |   const onSteps = millWorld(0, 6.0)
  71  |   const throughDoor = millWorld(0, 4.4)
  72  |   await page.evaluate(
  73  |     ({ a, x, z }) => a.teleport(x, z),
  74  |     { a: h, x: start.x, z: start.z }
  75  |   )
  76  |   await page.waitForTimeout(400)
  77  |   const s0 = await snap(page)
  78  |   expect(s0.y).toBeLessThan(MILL.base + 0.6)
  79  |   await page.keyboard.down('ArrowUp')
  80  |   let crossed = false
  81  |   let maxLift = 0
  82  |   const t0 = (await snap(page)).t
  83  |   for (let i = 0; i < 200; i++) {
  84  |     const s = await snap(page)
  85  |     maxLift = Math.max(maxLift, s.y - MILL.base)
  86  |     if (s.mllz < 5.0 && Math.abs(s.mllx) < 1.2) {
  87  |       crossed = true
  88  |       break
  89  |     }
  90  |     if (s.t - t0 > 30) break
  91  |     const target = s.mllz > 6.3 ? onSteps : throughDoor
  92  |     await steerTo(page, h, target.x, target.z, 0)
  93  |     await page.waitForTimeout(200)
  94  |   }
  95  |   await page.keyboard.up('ArrowUp')
  96  |   expect(crossed).toBe(true)
  97  |   const s = await snap(page)
  98  |   expect(Math.abs(s.y - (MILL.base + MILL.floorH))).toBeLessThanOrEqual(0.2)
  99  |   expect(maxLift).toBeLessThan(1.45)
  100 |   await page.screenshot({ path: 'test-results/collision-windmill-door.png' })
  101 | })
  102 | 
  103 | test('windmill spiral climbs with held keys and steps match the mesh', async ({ page }) => {
  104 |   const h = await api(page)
  105 |   const start = millWorld(0, 7.4)
  106 |   const onSteps = millWorld(0, 6.0)
  107 |   const throughDoor = millWorld(0, 4.4)
  108 |   const center = millWorld(0, 1.4)
  109 |   await page.evaluate(
  110 |     ({ a, x, z }) => a.teleport(x, z),
  111 |     { a: h, x: start.x, z: start.z }
  112 |   )
  113 |   await page.waitForTimeout(400)
  114 |   await page.keyboard.down('ArrowUp')
  115 |   let entered = false
  116 |   const tEnter = (await snap(page)).t
  117 |   for (let i = 0; i < 200; i++) {
  118 |     const s = await snap(page)
  119 |     const r = Math.hypot(s.mllx, s.mllz)
  120 |     if (r < 1.6) {
  121 |       entered = true
  122 |       break
  123 |     }
  124 |     if (s.t - tEnter > 30) break
  125 |     const target = s.mllz > 6.3 ? onSteps : s.mllz > 4.6 ? throughDoor : center
  126 |     await steerTo(page, h, target.x, target.z, 0)
  127 |     await page.waitForTimeout(200)
  128 |   }
> 129 |   expect(entered).toBe(true)
      |                   ^ Error: expect(received).toBe(expected) // Object.is equality
  130 |   let top = false
  131 |   const tClimb = (await snap(page)).t
  132 |   for (let i = 0; i < 400; i++) {
  133 |     const s = await snap(page)
  134 |     if (s.y > MILL.base + MILL.top - 0.3) {
  135 |       top = true
  136 |       break
  137 |     }
  138 |     if (s.t - tClimb > 60) break
  139 |     const phi0 = Math.atan2(-s.mllx, s.mllz)
  140 |     const phi = phi0 < 0 ? phi0 + Math.PI * 2 : phi0
  141 |     const target = phi + 0.4 > Math.PI * 2 ? phi + 0.4 - Math.PI * 2 : phi + 0.4
  142 |     const gx = -Math.sin(target) * 2.625
  143 |     const gz = Math.cos(target) * 2.625
  144 |     const w = millWorld(gx, gz)
  145 |     await steerTo(page, h, w.x, w.z, 0)
  146 |     await page.waitForTimeout(200)
  147 |   }
  148 |   await page.keyboard.up('ArrowUp')
  149 |   expect(top).toBe(true)
  150 |   let topStable = false
  151 |   for (let i = 0; i < 12; i++) {
  152 |     const s = await snap(page)
  153 |     if (s.grounded && Math.abs(s.y - (MILL.base + MILL.top)) < 0.4) {
  154 |       topStable = true
  155 |       break
  156 |     }
  157 |     await page.waitForTimeout(300)
  158 |   }
  159 |   expect(topStable).toBe(true)
  160 |   await page.screenshot({ path: 'test-results/collision-windmill-top.png' })
  161 |   const millCenter = millWorld(0, 1.2)
  162 |   for (const phi of [Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
  163 |     const p = millWorld(-Math.sin(phi) * 2.625, Math.cos(phi) * 2.625)
  164 |     await page.evaluate(
  165 |       ({ a, x, z }) => a.teleport(x, z),
  166 |       { a: h, x: p.x, z: p.z }
  167 |     )
  168 |     await page.waitForTimeout(500)
  169 |     const s = await snap(page)
  170 |     const rampH =
  171 |       MILL.base + MILL.floorH + ((phi - MILL.doorPhi) / (Math.PI * 2 - 2 * MILL.doorPhi - MILL.topPhi)) * (MILL.top - MILL.floorH)
  172 |     expect(Math.abs(s.y - rampH)).toBeLessThanOrEqual(0.2)
  173 |     expect(s.grounded).toBe(true)
  174 |     await page.evaluate(
  175 |       ({ a, x, z }) => a.teleport(x, z),
  176 |       { a: h, x: millCenter.x, z: millCenter.z }
  177 |     )
  178 |     await page.waitForTimeout(400)
  179 |     const hit = await page.evaluate(
  180 |       ({ a, x, z, fromY }) => a.raycastDown(x, z, fromY),
  181 |       { a: h, x: p.x, z: p.z, fromY: rampH + 1.2 }
  182 |     )
  183 |     expect(hit).not.toBeNull()
  184 |     expect(Math.abs(hit! - rampH)).toBeLessThanOrEqual(0.3)
  185 |   }
  186 | })
  187 | 
  188 | test('mansion stairwell is open on floor two and falls onto the stairs', async ({ page }) => {
  189 |   const h = await api(page)
  190 |   const bottom = mansionWorld(MANSION_STAIR.lx0 + 0.25, (MANSION_STAIR.lz0 + MANSION_STAIR.lz1) / 2)
  191 |   await page.evaluate(
  192 |     ({ a, x, z, yaw }) => {
  193 |       a.teleport(x, z)
  194 |       a.setCamYaw(yaw)
  195 |     },
  196 |     { a: h, x: bottom.x, z: bottom.z, yaw: -MANSION.yaw }
  197 |   )
  198 |   await page.waitForTimeout(300)
  199 |   await page.keyboard.down('ArrowUp')
  200 |   let up = false
  201 |   const tUp = (await snap(page)).t
  202 |   for (let i = 0; i < 200; i++) {
  203 |     const s = await snap(page)
  204 |     if (s.y > MANSION.floor2 - 0.2 && s.mlx > MANSION_STAIR.lx1 - 0.5) {
  205 |       up = true
  206 |       break
  207 |     }
  208 |     if (s.t - tUp > 30) break
  209 |     await page.waitForTimeout(250)
  210 |   }
  211 |   expect(up).toBe(true)
  212 |   const holeCenter = mansionWorld(-0.2, -5)
  213 |   const slabHit = await page.evaluate(
  214 |     ({ a, x, z, fromY }) => a.raycastDown(x, z, fromY),
  215 |     { a: h, x: holeCenter.x, z: holeCenter.z, fromY: MANSION.floor2 + 1.2 }
  216 |   )
  217 |   expect(slabHit).not.toBeNull()
  218 |   expect(slabHit!).toBeLessThan(MANSION.floor2 - 0.2)
  219 |   expect(slabHit!).toBeGreaterThan(MANSION.floorY + 0.5)
  220 |   await steerTo(page, h, holeCenter.x, holeCenter.z, 0)
  221 |   let down = false
  222 |   const tDown = (await snap(page)).t
  223 |   for (let i = 0; i < 200; i++) {
  224 |     const s = await snap(page)
  225 |     if (s.y < MANSION.floor2 - 0.5 && s.grounded) {
  226 |       down = true
  227 |       break
  228 |     }
  229 |     if (s.t - tDown > 30) break
```
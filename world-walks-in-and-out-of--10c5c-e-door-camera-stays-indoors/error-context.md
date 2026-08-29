# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: world.spec.ts >> walks in and out of the house through the door, camera stays indoors
- Location: e2e/world.spec.ts:173:1

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
    - generic: x 14.6 · z -10.6 · 127 fps · 107 draws
  - generic: Click the world to look with the mouse (Esc frees it) · WASD walk · Ctrl/Shift sprint · Space jump · E interact · G throw · 1-4 items · scroll to zoom
  - generic:
    - generic:
      - generic: Rock
      - generic: "0"
      - generic: "1"
    - generic:
      - generic: Flower
      - generic: "0"
      - generic: "2"
    - generic:
      - generic: Wood
      - generic: "0"
      - generic: "3"
    - generic:
      - generic: Fish
      - generic: "0"
      - generic: "4"
```

# Test source

```ts
  83  |   const t1 = (await snap(page)).t
  84  |   await page.waitForTimeout(500)
  85  |   expect((await snap(page)).t).toBeGreaterThan(t1)
  86  |   await page.screenshot({ path: 'test-results/scene-exterior.png' })
  87  | })
  88  | 
  89  | test('arrow keys move the player and camera follows', async ({ page }) => {
  90  |   const s0 = await snap(page)
  91  |   await page.keyboard.down('ArrowUp')
  92  |   await page.waitForTimeout(1600)
  93  |   await page.keyboard.up('ArrowUp')
  94  |   const s1 = await snap(page)
  95  |   expect(Math.hypot(s1.x - s0.x, s1.z - s0.z)).toBeGreaterThan(1.0)
  96  |   expect(Math.hypot(s1.camX - s0.camX, s1.camZ - s0.camZ)).toBeGreaterThan(0.3)
  97  | })
  98  | 
  99  | test('strafe turns heading', async ({ page }) => {
  100 |   const s0 = await snap(page)
  101 |   await page.keyboard.down('ArrowRight')
  102 |   await page.waitForTimeout(700)
  103 |   await page.keyboard.up('ArrowRight')
  104 |   const s1 = await snap(page)
  105 |   expect(Math.abs(wrap(s1.heading - s0.heading))).toBeGreaterThan(0.5)
  106 | })
  107 | 
  108 | test('sprint covers more ground', async ({ page }) => {
  109 |   const s0 = await snap(page)
  110 |   await page.keyboard.down('ControlLeft')
  111 |   await page.keyboard.down('ArrowUp')
  112 |   await page.waitForTimeout(1400)
  113 |   await page.keyboard.up('ArrowUp')
  114 |   await page.keyboard.up('ControlLeft')
  115 |   const s1 = await snap(page)
  116 |   expect(s1.sprint).toBeGreaterThan(0.5)
  117 |   expect(Math.hypot(s1.x - s0.x, s1.z - s0.z)).toBeGreaterThan(4.0)
  118 | })
  119 | 
  120 | test('jump leaves the ground and lands', async ({ page }) => {
  121 |   const s0 = await snap(page)
  122 |   const base = s0.y
  123 |   let maxY = base
  124 |   await page.keyboard.press('Space')
  125 |   for (let i = 0; i < 12; i++) {
  126 |     maxY = Math.max(maxY, (await snap(page)).y)
  127 |     await page.waitForTimeout(100)
  128 |   }
  129 |   expect(maxY - base).toBeGreaterThan(0.4)
  130 |   const sEnd = await snap(page)
  131 |   expect(Math.abs(sEnd.y - base)).toBeLessThan(0.3)
  132 |   expect(sEnd.grounded).toBe(true)
  133 | })
  134 | 
  135 | test('drag orbits camera, pitch tilts, wheel zooms', async ({ page }) => {
  136 |   const s0 = await snap(page)
  137 |   await page.mouse.move(CX, CY)
  138 |   await page.mouse.down()
  139 |   await page.mouse.move(CX + 180, CY, { steps: 10 })
  140 |   await page.mouse.up()
  141 |   const s1 = await snap(page)
  142 |   expect(Math.abs(wrap(s1.camYaw - s0.camYaw))).toBeGreaterThan(0.4)
  143 | 
  144 |   await page.mouse.move(CX, CY)
  145 |   await page.mouse.down()
  146 |   await page.mouse.move(CX, CY - 50, { steps: 8 })
  147 |   await page.mouse.up()
  148 |   const s2 = await snap(page)
  149 |   expect(Math.abs(s2.camPitch - s1.camPitch)).toBeGreaterThan(0.15)
  150 | 
  151 |   await page.mouse.wheel(0, -400)
  152 |   await page.waitForTimeout(400)
  153 |   const d1 = (await snap(page)).camDist
  154 |   expect(d1).toBeLessThan(s2.camDist - 0.3)
  155 | })
  156 | 
  157 | test('walls block the player', async ({ page }) => {
  158 |   const h = await api(page)
  159 |   await page.evaluate((a) => {
  160 |     a.teleport(13.207, -7.586)
  161 |     a.setCamYaw(-2.678)
  162 |   }, h)
  163 |   await page.waitForTimeout(300)
  164 |   await page.keyboard.down('ArrowUp')
  165 |   await page.waitForTimeout(1200)
  166 |   await page.keyboard.up('ArrowUp')
  167 |   const s = await snap(page)
  168 |   expect(s.lx).toBeGreaterThan(2.2)
  169 |   expect(s.lx).toBeLessThan(3.45)
  170 |   expect(Math.abs(s.lz)).toBeLessThan(3.0)
  171 | })
  172 | 
  173 | test('walks in and out of the house through the door, camera stays indoors', async ({ page }) => {
  174 |   const h = await api(page)
  175 |   await page.evaluate((a) => {
  176 |     a.teleport(8.156, -7.408)
  177 |     a.setCamYaw(-1.107)
  178 |   }, h)
  179 |   await page.waitForTimeout(200)
  180 |   await page.keyboard.down('ArrowUp')
  181 |   await page.waitForTimeout(6000)
  182 |   const sIn = await snap(page)
> 183 |   expect(sIn.inside).toBe(true)
      |                      ^ Error: expect(received).toBe(expected) // Object.is equality
  184 |   expect(Math.abs(sIn.lx)).toBeLessThan(3.4)
  185 |   for (let i = 0; i < 4; i++) {
  186 |     await page.mouse.move(CX, CY)
  187 |     await page.mouse.down()
  188 |     await page.mouse.move(CX + (i % 2 === 0 ? 180 : -180), CY - 40 + (i % 3) * 25, { steps: 8 })
  189 |     await page.mouse.up()
  190 |     await page.waitForTimeout(250)
  191 |     const c = await snap(page)
  192 |     expect(Math.abs(c.camX - 12)).toBeLessThan(4.3)
  193 |     expect(Math.abs(c.camZ + 10)).toBeLessThan(4.5)
  194 |     expect(c.camY).toBeLessThan(2.7)
  195 |   }
  196 |   await page.evaluate((a) => a.setCamYaw(2.0346), h)
  197 |   await page.waitForTimeout(1500)
  198 |   await page.screenshot({ path: 'test-results/scene-interior.png' })
  199 |   await page.waitForTimeout(4500)
  200 |   await page.keyboard.up('ArrowUp')
  201 |   const sOut = await snap(page)
  202 |   expect(sOut.inside).toBe(false)
  203 | })
  204 | 
  205 | test('windmill spiral climbs to the top', async ({ page }) => {
  206 |   const h = await api(page)
  207 |   await page.evaluate((a) => {
  208 |     a.teleport(21.84, -17.12)
  209 |     a.setCamYaw(-0.6435)
  210 |   }, h)
  211 |   await page.waitForTimeout(300)
  212 |   await page.keyboard.down('ArrowUp')
  213 |   let top = false
  214 |   for (let i = 0; i < 60; i++) {
  215 |     const s = await snap(page)
  216 |     if (s.y > MILL.base + 3.0) {
  217 |       top = true
  218 |       break
  219 |     }
  220 |     await page.evaluate(() => {
  221 |       const g = (window as unknown as { __Ghibli: Api }).__Ghibli
  222 |       const st = g.snapshot()
  223 |       const phi0 = Math.atan2(-st.mlx, st.mlz)
  224 |       const phi = phi0 < 0 ? phi0 + Math.PI * 2 : phi0
  225 |       g.setCamYaw(Math.PI / 2 - phi)
  226 |     })
  227 |     await page.waitForTimeout(220)
  228 |   }
  229 |   await page.keyboard.up('ArrowUp')
  230 |   expect(top).toBe(true)
  231 |   const s = await snap(page)
  232 |   expect(s.y).toBeGreaterThan(MILL.base + 2.9)
  233 |   expect(s.y).toBeLessThan(MILL.base + 3.75)
  234 | })
  235 | 
  236 | test('mansion stairs reach the second floor', async ({ page }) => {
  237 |   const h = await api(page)
  238 |   await page.evaluate((a) => {
  239 |     a.teleport(-15.55, -13.79)
  240 |     a.setCamYaw(0.82)
  241 |   }, h)
  242 |   await page.waitForTimeout(300)
  243 |   await page.keyboard.down('ArrowUp')
  244 |   let up = false
  245 |   for (let i = 0; i < 30; i++) {
  246 |     const s = await snap(page)
  247 |     if (s.y > MANSION.floor2 - 0.2) {
  248 |       up = true
  249 |       break
  250 |     }
  251 |     await page.waitForTimeout(250)
  252 |   }
  253 |   await page.keyboard.up('ArrowUp')
  254 |   expect(up).toBe(true)
  255 |   const s = await snap(page)
  256 |   expect(s.y).toBeGreaterThan(MANSION.floor2 - 0.1)
  257 |   expect(s.y).toBeLessThan(MANSION.floor2 + 0.4)
  258 |   expect(s.mlz).toBeLessThan(-0.3)
  259 |   expect(s.insideMansion).toBe(true)
  260 | })
  261 | 
  262 | test('can walk under the mansion balcony with no invisible wall', async ({ page }) => {
  263 |   const h = await api(page)
  264 |   await page.evaluate((a) => {
  265 |     a.teleport(-16.9, -13.2)
  266 |     a.setCamYaw(0.82 + Math.PI)
  267 |   }, h)
  268 |   await page.waitForTimeout(300)
  269 |   const s0 = await snap(page)
  270 |   expect(s0.y).toBeLessThan(0.5)
  271 |   await page.keyboard.down('ArrowUp')
  272 |   await page.waitForTimeout(2500)
  273 |   await page.keyboard.up('ArrowUp')
  274 |   const s1 = await snap(page)
  275 |   expect(s1.mlz).toBeLessThan(-3.2)
  276 |   expect(s1.y).toBeLessThan(0.5)
  277 |   expect(s1.insideMansion).toBe(true)
  278 | })
  279 | 
  280 | test('fountain rim is solid below and standable above', async ({ page }) => {
  281 |   const h = await api(page)
  282 |   await page.evaluate((a) => {
  283 |     a.teleport(-6, 1.2)
```
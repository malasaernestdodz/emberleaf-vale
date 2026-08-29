# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: world.spec.ts >> windmill spiral climbs to the top
- Location: e2e/world.spec.ts:205:1

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
    - generic: x 16.2 · z -9.2 · 90 fps · 135 draws
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
  183 |   expect(sIn.inside).toBe(true)
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
> 230 |   expect(top).toBe(true)
      |               ^ Error: expect(received).toBe(expected) // Object.is equality
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
  284 |     a.setCamYaw(0)
  285 |   }, h)
  286 |   await page.waitForTimeout(300)
  287 |   await page.keyboard.down('ArrowUp')
  288 |   await page.waitForTimeout(900)
  289 |   await page.keyboard.up('ArrowUp')
  290 |   const walked = await snap(page)
  291 |   const dWalked = Math.hypot(walked.x + 6, walked.z + 1)
  292 |   expect(dWalked).toBeGreaterThan(1.35)
  293 |   await page.keyboard.down('ArrowUp')
  294 |   await page.keyboard.press('Space')
  295 |   let maxLift = 0
  296 |   for (let i = 0; i < 14; i++) {
  297 |     const s = await snap(page)
  298 |     const d = Math.hypot(s.x + 6, s.z + 1)
  299 |     if (d < 1.7) maxLift = Math.max(maxLift, s.y)
  300 |     await page.waitForTimeout(120)
  301 |   }
  302 |   await page.keyboard.up('ArrowUp')
  303 |   expect(maxLift).toBeGreaterThan(0.4)
  304 |   const landed = await snap(page)
  305 |   expect(landed.grounded).toBe(true)
  306 |   const dEnd = Math.hypot(landed.x + 6, landed.z + 1)
  307 |   expect(landed.y).toBeGreaterThan(0.35)
  308 |   expect(dEnd).toBeLessThan(2.05)
  309 | })
  310 | 
  311 | test('sleeping fades the world to dark and back', async ({ page }) => {
  312 |   const h = await api(page)
  313 |   await page.evaluate((a) => {
  314 |     a.teleport(9.7, -9.6)
  315 |     a.setCamYaw(-2.6)
  316 |   }, h)
  317 |   await page.waitForTimeout(2500)
  318 |   await page.keyboard.press('KeyE')
  319 |   await page.waitForTimeout(1300)
  320 |   let veil = await page.evaluate(() => (window as unknown as { __Ghibli: Api }).__Ghibli.snapshot().veil)
  321 |   expect(veil).toBeGreaterThan(0.4)
  322 |   await page.waitForTimeout(3200)
  323 |   veil = await page.evaluate(() => (window as unknown as { __Ghibli: Api }).__Ghibli.snapshot().veil)
  324 |   expect(veil).toBeLessThan(0.1)
  325 | })
  326 | 
  327 | test('read the book opens and closes the ledger', async ({ page }) => {
  328 |   const h = await api(page)
  329 |   await page.evaluate((a) => {
  330 |     a.teleport(13.3, -11.0)
```
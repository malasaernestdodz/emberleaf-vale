# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: world.spec.ts >> read the book opens and closes the ledger
- Location: e2e/world.spec.ts:327:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.book')
Expected: visible
Timeout: 30000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 30000ms
  - waiting for locator('.book')

```

```yaml
- heading "EMBERLEAF VALE" [level=1]
- text: x 13.3 · z -11.0 · 37 fps · 120 draws Click the world to look with the mouse (Esc frees it) · WASD walk · Ctrl/Shift sprint · Space jump · E interact · G throw · 1-4 items · scroll to zoom Rock 0 1 Flower 0 2 Wood 0 3 Fish 0 4
```

# Test source

```ts
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
  331 |     a.setCamYaw(2.6)
  332 |   }, h)
  333 |   await page.waitForTimeout(2500)
  334 |   await page.keyboard.press('KeyE')
  335 |   await page.waitForTimeout(400)
> 336 |   await expect(page.locator('.book')).toBeVisible()
      |                                       ^ Error: expect(locator).toBeVisible() failed
  337 |   await page.keyboard.press('KeyE')
  338 |   await page.waitForTimeout(300)
  339 |   await expect(page.locator('.book')).toHaveCount(0)
  340 | })
  341 | 
  342 | test('chopping a tree yields wood with the axe', async ({ page }) => {
  343 |   const t0 = TREES[0]
  344 |   const h = await api(page)
  345 |   await page.evaluate(
  346 |     ({ a, x, z }) => {
  347 |       a.teleport(x, z)
  348 |     },
  349 |     { a: h, x: t0.x + 1.05, z: t0.z }
  350 |   )
  351 |   await page.waitForTimeout(500)
  352 |   const s0 = await snap(page)
  353 |   expect(s0.near).toBe('chop')
  354 |   expect(s0.tool).toBe('axe')
  355 |   await page.keyboard.press('KeyE')
  356 |   await page.waitForTimeout(2000)
  357 |   const s1 = await snap(page)
  358 |   expect(s1.inv.wood).toBeGreaterThanOrEqual(1)
  359 | })
  360 | 
  361 | test('pickup, inventory and throw', async ({ page }) => {
  362 |   const flower = pickups.find((p) => p.type === 'flower' && p.alive)
  363 |   expect(flower).toBeTruthy()
  364 |   const h = await api(page)
  365 |   await page.evaluate(
  366 |     ({ a, x, z }) => {
  367 |       a.teleport(x, z)
  368 |     },
  369 |     { a: h, x: flower!.x, z: flower!.z }
  370 |   )
  371 |   await page.waitForTimeout(500)
  372 |   const s0 = await snap(page)
  373 |   expect(s0.near).toBe('pk')
  374 |   expect(s0.pickups).toBe(21)
  375 |   await page.keyboard.press('KeyE')
  376 |   await page.waitForTimeout(400)
  377 |   const s1 = await snap(page)
  378 |   expect(s1.inv.flower).toBe(1)
  379 |   expect(s1.pickups).toBe(20)
  380 |   await page.keyboard.press('KeyG')
  381 |   await page.waitForTimeout(600)
  382 |   const s2 = await snap(page)
  383 |   expect(s2.inv.flower).toBe(0)
  384 |   expect(s2.pickups).toBe(21)
  385 | })
  386 | 
  387 | test('fishing catches a fish on the bite', async ({ page }) => {
  388 |   const h = await api(page)
  389 |   await page.evaluate((a) => {
  390 |     a.teleport(-11.6, 7.2)
  391 |     a.setCamYaw(2.2)
  392 |   }, h)
  393 |   await page.waitForTimeout(400)
  394 |   const s0 = await snap(page)
  395 |   expect(s0.near).toBe('fish')
  396 |   await page.keyboard.press('KeyE')
  397 |   await page.waitForTimeout(300)
  398 |   expect((await snap(page)).tool).toBe('rod')
  399 |   expect((await snap(page)).fishing).toBe(true)
  400 |   let caught = false
  401 |   for (let i = 0; i < 30; i++) {
  402 |     const s = await snap(page)
  403 |     if (!s.fishing) break
  404 |     if (s.bite) {
  405 |       await page.keyboard.press('KeyE')
  406 |       caught = true
  407 |       break
  408 |     }
  409 |     await page.waitForTimeout(300)
  410 |   }
  411 |   expect(caught).toBe(true)
  412 |   const sEnd = await snap(page)
  413 |   expect(sEnd.inv.fish).toBe(1)
  414 | })
  415 | 
  416 | test('windmill sails animate', async ({ page }) => {
  417 |   const s0 = await snap(page)
  418 |   await page.waitForTimeout(1200)
  419 |   const s1 = await snap(page)
  420 |   const dt = Math.max(s1.t - s0.t, 0.1)
  421 |   const rate = Math.abs(wrap(s1.windmill - s0.windmill)) / dt
  422 |   expect(rate).toBeGreaterThan(0.35)
  423 |   expect(rate).toBeLessThan(0.85)
  424 | })
  425 | 
```
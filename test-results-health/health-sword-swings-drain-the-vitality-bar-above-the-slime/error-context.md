# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: health.spec.ts >> sword swings drain the vitality bar above the slime
- Location: e2e\health.spec.ts:84:1

# Error details

```
Error: expect(received).toBeCloseTo(expected, precision)

Expected: 0.6666666666666666
Received: 1

Expected precision:    2
Expected difference: < 0.005
Received difference:   0.33333333333333337
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic:
    - heading "EMBERLEAF VALE" [level=1]
    - generic: x 2.2 · y 0.02 · z 6.6 · 46 fps · 72 draws
    - generic:
      - button "[C] collider debug off" [ref=e6] [cursor=pointer]
      - button "[V] solid shapes off" [ref=e7] [cursor=pointer]
  - generic: Click the world to look with the mouse (Esc frees it) · WASD walk · Ctrl/Shift sprint · Space jump · E interact · G throw · 1-6 items · left-click attack · Esc menu · C collider debug · V solid collider shapes · P perf trace · scroll to zoom
  - generic: "[E] Pick up the gel"
  - generic:
    - generic: VITALITY
    - generic: 4/5
  - button "Open menu" [ref=e8] [cursor=pointer]
  - generic:
    - generic:
      - text: QUESTS
      - generic: 1/6
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
  - generic: "Quest complete: Slime Bopper"
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
  23  |     hits: number
  24  |     visible: boolean
  25  |     spawnX: number
  26  |     spawnZ: number
  27  |   }
  28  |   slimeHud: { shown: boolean; frac: number }
  29  | }
  30  | 
  31  | type Api = {
  32  |   snapshot: () => Snap
  33  |   teleport: (x: number, z: number) => void
  34  |   face: (x: number, z: number) => void
  35  |   skipSlimeRespawn: () => void
  36  | }
  37  | 
  38  | const CX = 200
  39  | const CY = 112
  40  | 
  41  | const snap = (page: Page) => page.evaluate(() => (window as unknown as { __Ghibli: Api }).__Ghibli.snapshot())
  42  | const api = (page: Page) => page.evaluateHandle(() => (window as unknown as { __Ghibli: Api }).__Ghibli)
  43  | 
  44  | const damageUntil = async (page: Page, h: Awaited<ReturnType<typeof api>>, targetHp: number, attempts = 40) => {
  45  |   for (let i = 0; i < attempts; i++) {
  46  |     const s = await snap(page)
  47  |     if (s.hp <= targetHp || s.fainted) return true
  48  |     if (!s.slime.visible) {
  49  |       await page.evaluate((a) => a.skipSlimeRespawn(), h)
  50  |       await page.waitForTimeout(600)
  51  |       continue
  52  |     }
  53  |     await page.evaluate(
  54  |       ({ a, x, z }) => a.teleport(x, z),
  55  |       { a: h, x: s.slime.x + 0.5, z: s.slime.z }
  56  |     )
  57  |     await page.waitForTimeout(450)
  58  |   }
  59  |   return (await snap(page)).hp <= targetHp
  60  | }
  61  | 
  62  | test.beforeEach(async ({ page }) => {
  63  |   await page.goto('/?lite')
  64  |   await page.waitForFunction(
  65  |     () => (window as unknown as { __Ghibli?: { snapshot?: () => { ready: boolean } } }).__Ghibli?.snapshot?.()?.ready === true,
  66  |     null,
  67  |     { timeout: 60_000 }
  68  |   )
  69  | })
  70  | 
  71  | test('the hero draws the sword with full hearts, never the rod', async ({ page }) => {
  72  |   const s = await snap(page)
  73  |   expect(s.wield.sword).toBe(true)
  74  |   expect(s.wield.rod).toBe(false)
  75  |   expect(s.wield.axe).toBe(false)
  76  |   expect(s.hp).toBe(s.maxHp)
  77  |   expect(s.maxHp).toBe(5)
  78  |   await expect(page.getByTestId('player-hearts')).toBeVisible()
  79  |   await expect(page.getByTestId('player-hp')).toHaveText('5/5')
  80  |   await expect(page.locator('.heart:not(.empty)')).toHaveCount(5)
  81  |   await expect(page.locator('.heart.empty')).toHaveCount(0)
  82  | })
  83  | 
  84  | test('sword swings drain the vitality bar above the slime', async ({ page }) => {
  85  |   const h = await api(page)
  86  |   const fracs: number[] = []
  87  |   await expect.poll(async () => (await snap(page)).slimeHud.frac, { timeout: 20_000 }).toBe(1)
  88  |   for (let attempt = 0; attempt < 24; attempt++) {
  89  |     const s = (await snap(page)).slime
  90  |     if (s.state === 'hidden') break
  91  |     if (s.state === 'air' || s.state === 'windup') {
  92  |       await page.waitForTimeout(400)
  93  |       continue
  94  |     }
  95  |     const dx = s.spawnX - s.x
  96  |     const dz = s.spawnZ - s.z
  97  |     const d = Math.hypot(dx, dz) || 1
  98  |     await page.evaluate(
  99  |       ({ a, x, z, fx, fz }) => {
  100 |         a.teleport(x, z)
  101 |         a.face(fx, fz)
  102 |       },
  103 |       { a: h, x: s.x + (dx / d) * 0.9, z: s.z + (dz / d) * 0.9, fx: s.x, fz: s.z }
  104 |     )
  105 |     await page.waitForTimeout(250)
  106 |     const before = (await snap(page)).slime.hp
  107 |     await page.mouse.click(CX, CY)
  108 |     for (let i = 0; i < 25; i++) {
  109 |       const cur = await snap(page)
  110 |       if (cur.slime.hp < before) {
  111 |         fracs.push(cur.slimeHud.frac)
  112 |         break
  113 |       }
  114 |       if (cur.slime.state === 'hidden') break
  115 |       if (cur.attack === 0 && i > 4) break
  116 |       await page.waitForTimeout(200)
  117 |     }
  118 |   }
  119 |   const popped = (await snap(page))
  120 |   expect(popped.slime.hp).toBe(0)
  121 |   expect(popped.slime.state).toBe('hidden')
  122 |   expect(fracs.length).toBeGreaterThanOrEqual(2)
> 123 |   expect(fracs[0]).toBeCloseTo(2 / 3, 2)
      |                    ^ Error: expect(received).toBeCloseTo(expected, precision)
  124 |   expect(fracs[1]).toBeCloseTo(1 / 3, 2)
  125 | 
  126 |   await page.evaluate((a) => a.skipSlimeRespawn(), h)
  127 |   await expect
  128 |     .poll(
  129 |       async () => {
  130 |         const s = await snap(page)
  131 |         return s.slime.visible && s.slime.hp === 3 ? s.slimeHud : null
  132 |       },
  133 |       { timeout: 20_000 }
  134 |     )
  135 |     .toEqual({ shown: true, frac: 1 })
  136 | })
  137 | 
  138 | test('the slime costs the hero hearts and the HUD keeps count, then the vale mends', async ({ page }) => {
  139 |   const h = await api(page)
  140 |   const damaged = await damageUntil(page, h, 3)
  141 |   expect(damaged).toBe(true)
  142 |   const hurt = await snap(page)
  143 |   expect(hurt.hp).toBeLessThanOrEqual(3)
  144 |   expect(hurt.hp).toBeGreaterThan(0)
  145 |   await expect(page.getByTestId('player-hp')).toHaveText(`${hurt.hp}/5`)
  146 |   await expect(page.locator('.heart:not(.empty)')).toHaveCount(hurt.hp)
  147 | 
  148 |   await page.evaluate((a) => a.teleport(-21.5, -16), h)
  149 |   await expect.poll(async () => (await snap(page)).hp, { timeout: 45_000 }).toBe(5)
  150 |   await expect(page.getByTestId('player-hp')).toHaveText('5/5')
  151 | })
  152 | 
  153 | test('morsels of food mend two hearts', async ({ page }) => {
  154 |   const h = await api(page)
  155 |   const damaged = await damageUntil(page, h, 3)
  156 |   expect(damaged).toBe(true)
  157 |   const hurt = await snap(page)
  158 |   expect(hurt.hp).toBeLessThanOrEqual(3)
  159 |   expect(hurt.inv.food).toBe(0)
  160 | 
  161 |   const food = pickups.find((p) => p.type === 'food' && p.alive)
  162 |   expect(food).toBeTruthy()
  163 |   await page.evaluate(
  164 |     ({ a, x, z }) => a.teleport(x, z),
  165 |     { a: h, x: food!.x, z: food!.z }
  166 |   )
  167 |   await page.waitForTimeout(500)
  168 |   expect((await snap(page)).near).toBe('pk')
  169 |   await page.keyboard.press('KeyE')
  170 |   await page.waitForTimeout(300)
  171 |   if ((await snap(page)).near === 'pk') {
  172 |     await page.keyboard.press('KeyE')
  173 |     await page.waitForTimeout(300)
  174 |   }
  175 |   expect((await snap(page)).inv.food).toBeGreaterThanOrEqual(1)
  176 |   await page.keyboard.press('Digit5')
  177 |   await page.waitForTimeout(300)
  178 |   for (let i = 0; i < 4 && (await snap(page)).hp < 5; i++) {
  179 |     await page.keyboard.press('KeyE')
  180 |     await page.waitForTimeout(500)
  181 |   }
  182 |   await expect.poll(async () => (await snap(page)).hp, { timeout: 5_000 }).toBe(5)
  183 |   await expect(page.getByTestId('player-hp')).toHaveText('5/5')
  184 | })
  185 | 
  186 | test('fainting at zero hearts wakes the hero at the spawn shrine with full hearts', async ({ page }) => {
  187 |   const h = await api(page)
  188 |   const fainted = await damageUntil(page, h, 0, 80)
  189 |   expect(fainted).toBe(true)
  190 |   expect((await snap(page)).fainted).toBe(true)
  191 |   await expect(page.locator('.veil.faint .veil-text')).toHaveText('You fainted…', { timeout: 5_000 })
  192 |   await expect.poll(async () => (await snap(page)).fainted, { timeout: 15_000 }).toBe(false)
  193 |   const w = await snap(page)
  194 |   expect(w.hp).toBe(5)
  195 |   expect(Math.hypot(w.x - SPAWN.x, w.z - SPAWN.z)).toBeLessThan(1)
  196 |   await expect(page.getByTestId('player-hp')).toHaveText('5/5')
  197 |   await expect(page.locator('.heart:not(.empty)')).toHaveCount(5)
  198 | })
  199 | 
```
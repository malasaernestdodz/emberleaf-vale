import { expect, test, type Page } from '@playwright/test'
import {
  HOUSE,
  MANSION,
  MANSION_SLAB_LZ,
  MANSION_STAIR,
  MILL,
  TREES,
  groundHeight,
  houseWorld,
  mansionWorld,
  millWorld,
} from '../src/lib/world'
import { pickups } from '../src/lib/items'
import { SLIME_SPAWN } from '../src/lib/slime'

type Snap = {
  ready: boolean
  t: number
  x: number
  y: number
  z: number
  lx: number
  lz: number
  mlx: number
  mlz: number
  mllx: number
  mllz: number
  heading: number
  camYaw: number
  camPitch: number
  camDist: number
  camX: number
  camY: number
  camZ: number
  inside: boolean
  insideMansion: boolean
  mode: string
  grounded: boolean
  sprint: number
  tool: string
  chop: number
  attack: number
  colliders: boolean
  near: string
  nearLabel: string
  fishing: boolean
  bite: boolean
  veil: number
  inv: { rock: number; flower: number; wood: number; fish: number; food: number }
  slot: number
  buff: number
  pickups: number
  windmill: number
  fps: number
  grass: number
  drawCalls: number
  tris: number
  trees: number
  rocks: number
}

type Api = {
  snapshot: () => Snap
  teleport: (x: number, z: number) => void
  setCamYaw: (y: number) => void
}

const CX = 200
const CY = 112

const api = (page: Page) => page.evaluateHandle(() => (window as unknown as { __Ghibli: Api }).__Ghibli)

const snap = (page: Page) => page.evaluate(() => (window as unknown as { __Ghibli: Api }).__Ghibli.snapshot())

const wrap = (d: number) => {
  if (d > Math.PI) return d - Math.PI * 2
  if (d < -Math.PI) return d + Math.PI * 2
  return d
}

test.beforeEach(async ({ page }) => {
  await page.goto('/?lite')
  await page.waitForFunction(
    () => (window as unknown as { __Ghibli?: { snapshot?: () => { ready: boolean } } }).__Ghibli?.snapshot?.()?.ready === true,
    null,
    { timeout: 120_000 }
  )
})

test('boots with perf budgets', async ({ page }) => {
  await expect.poll(async () => (await snap(page)).tris, { timeout: 30_000 }).toBeGreaterThan(100000)
  const s = await snap(page)
  expect(s.grass).toBeGreaterThanOrEqual(10000)
  expect(s.drawCalls).toBeLessThanOrEqual(190)
  expect(s.tris).toBeGreaterThan(100000)
  expect(s.trees).toBeGreaterThanOrEqual(14)
  expect(s.rocks).toBeGreaterThanOrEqual(12)
  expect(s.pickups).toBeGreaterThanOrEqual(15)
  expect(s.fps).toBeGreaterThan(2)
  const t1 = (await snap(page)).t
  await page.waitForTimeout(500)
  expect((await snap(page)).t).toBeGreaterThan(t1)
  await page.screenshot({ path: 'test-results/scene-exterior.png' })
})

test('arrow keys move the player and camera follows', async ({ page }) => {
  const s0 = await snap(page)
  await page.keyboard.down('ArrowUp')
  let moved = 0
  for (let i = 0; i < 20; i++) {
    const s = await snap(page)
    moved = Math.hypot(s.x - s0.x, s.z - s0.z)
    if (moved > 1.2) break
    await page.waitForTimeout(300)
  }
  await page.keyboard.up('ArrowUp')
  const s1 = await snap(page)
  moved = Math.hypot(s1.x - s0.x, s1.z - s0.z)
  expect(moved).toBeGreaterThan(1.0)
  expect(Math.hypot(s1.camX - s0.camX, s1.camZ - s0.camZ)).toBeGreaterThan(0.3)
})

test('strafe turns heading', async ({ page }) => {
  const s0 = await snap(page)
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(700)
  await page.keyboard.up('ArrowRight')
  const s1 = await snap(page)
  expect(Math.abs(wrap(s1.heading - s0.heading))).toBeGreaterThan(0.5)
})

test('sprint covers more ground', async ({ page }) => {
  const s0 = await snap(page)
  await page.keyboard.down('ControlLeft')
  await page.keyboard.down('ArrowUp')
  let maxSprint = 0
  for (let i = 0; i < 12; i++) {
    maxSprint = Math.max(maxSprint, (await snap(page)).sprint)
    await page.waitForTimeout(250)
  }
  await page.keyboard.up('ArrowUp')
  await page.keyboard.up('ControlLeft')
  const s1 = await snap(page)
  expect(maxSprint).toBeGreaterThan(0.5)
  expect(Math.hypot(s1.x - s0.x, s1.z - s0.z)).toBeGreaterThan(3.5)
})

test('jump leaves the ground and lands', async ({ page }) => {
  const s0 = await snap(page)
  const base = s0.y
  let maxY = base
  await page.keyboard.press('Space')
  for (let i = 0; i < 12; i++) {
    maxY = Math.max(maxY, (await snap(page)).y)
    await page.waitForTimeout(100)
  }
  expect(maxY - base).toBeGreaterThan(0.4)
  let landed = false
  for (let i = 0; i < 20; i++) {
    const s = await snap(page)
    if (s.grounded && Math.abs(s.y - base) < 0.3) {
      landed = true
      break
    }
    await page.waitForTimeout(250)
  }
  expect(landed).toBe(true)
})

test('drag orbits camera, pitch tilts, wheel zooms', async ({ page }) => {
  const s0 = await snap(page)
  await page.mouse.move(CX, CY)
  await page.mouse.down()
  await page.mouse.move(CX + 180, CY, { steps: 10 })
  await page.mouse.up()
  const s1 = await snap(page)
  expect(Math.abs(wrap(s1.camYaw - s0.camYaw))).toBeGreaterThan(0.4)

  await page.mouse.move(CX, CY)
  await page.mouse.down()
  await page.mouse.move(CX, CY - 50, { steps: 8 })
  await page.mouse.up()
  const s2 = await snap(page)
  expect(Math.abs(s2.camPitch - s1.camPitch)).toBeGreaterThan(0.15)

  await page.mouse.wheel(0, -400)
  await page.waitForTimeout(400)
  const d1 = (await snap(page)).camDist
  expect(d1).toBeLessThan(s2.camDist - 0.3)
})

test('walls block the player', async ({ page }) => {
  const h = await api(page)
  await page.evaluate((a) => {
    a.teleport(13.207, -7.586)
    a.setCamYaw(-2.678)
  }, h)
  await page.waitForTimeout(300)
  await page.keyboard.down('ArrowUp')
  await page.waitForTimeout(1200)
  await page.keyboard.up('ArrowUp')
  const s = await snap(page)
  expect(s.lx).toBeGreaterThan(2.2)
  expect(s.lx).toBeLessThan(3.45)
  expect(Math.abs(s.lz)).toBeLessThan(3.0)
})

test('walks in and out of the house through the door, camera stays indoors', async ({ page }) => {
  const h = await api(page)
  await page.evaluate((a) => {
    a.teleport(8.156, -7.408)
  }, h)
  await page.waitForTimeout(200)
  await page.keyboard.down('ArrowUp')
  const steer = async (target: { x: number; z: number }, sx: number, sz: number) => {
    const yaw = Math.atan2(-(target.x - sx), -(target.z - sz))
    await page.evaluate(
      ({ a, yaw }) => a.setCamYaw(yaw),
      { a: h, yaw }
    )
  }
  const doorIn = houseWorld(0.6, HOUSE.d / 2 - 1.4)
  let insideSeen = false
  for (let i = 0; i < 40; i++) {
    const s = await snap(page)
    if (s.inside && Math.abs(s.lx) < 3.2 && Math.abs(s.lz) < 2.8) {
      insideSeen = true
      break
    }
    await steer(doorIn, s.x, s.z)
    await page.waitForTimeout(280)
  }
  expect(insideSeen).toBe(true)
  for (let i = 0; i < 4; i++) {
    await page.mouse.move(CX, CY)
    await page.mouse.down()
    await page.mouse.move(CX + (i % 2 === 0 ? 180 : -180), CY - 40 + (i % 3) * 25, { steps: 8 })
    await page.mouse.up()
    await page.waitForTimeout(250)
    const c = await snap(page)
    expect(Math.abs(c.camX - 12)).toBeLessThan(4.3)
    expect(Math.abs(c.camZ + 10)).toBeLessThan(4.5)
    expect(c.camY).toBeLessThan(2.7)
  }
  await page.screenshot({ path: 'test-results/scene-interior.png' })
  const doorOut = houseWorld(0.6, HOUSE.d / 2 + 1.6)
  let outsideSeen = false
  for (let i = 0; i < 40; i++) {
    const s = await snap(page)
    if (!s.inside) {
      outsideSeen = true
      break
    }
    await steer(doorOut, s.x, s.z)
    await page.waitForTimeout(280)
  }
  await page.keyboard.up('ArrowUp')
  expect(outsideSeen).toBe(true)
})

test('left click swings the sword by default', async ({ page }) => {
  expect((await snap(page)).tool).toBe('sword')
  await page.mouse.click(CX, CY)
  let swung = false
  for (let i = 0; i < 12; i++) {
    if ((await snap(page)).attack > 0) {
      swung = true
      break
    }
    await page.waitForTimeout(250)
  }
  expect(swung).toBe(true)
  // Pointer lock can stall the RAF loop for seconds on software GL; wait for
  // game time to actually flow before judging the swing decay.
  await expect
    .poll(async () => (await snap(page)).t, { timeout: 30_000, intervals: [500] })
    .toBeGreaterThan(1)
  let done = false
  for (let i = 0; i < 40; i++) {
    if ((await snap(page)).attack === 0) {
      done = true
      break
    }
    await page.waitForTimeout(250)
  }
  expect(done).toBe(true)
})

test('C toggles the collider shape overlay', async ({ page }) => {
  expect((await snap(page)).colliders).toBe(false)
  await page.keyboard.press('KeyC')
  let on = false
  for (let i = 0; i < 12; i++) {
    if ((await snap(page)).colliders) {
      on = true
      break
    }
    await page.waitForTimeout(250)
  }
  expect(on).toBe(true)
  await page.screenshot({ path: 'test-results/colliders.png' })
  await page.keyboard.press('KeyC')
  let off = false
  for (let i = 0; i < 12; i++) {
    if (!(await snap(page)).colliders) {
      off = true
      break
    }
    await page.waitForTimeout(250)
  }
  expect(off).toBe(true)
})

test('windmill spiral climbs to the top', async ({ page }) => {
  const h = await api(page)
  const outside = millWorld(0, MILL.rWall + 1.3)
  const startYaw = MILL.yaw
  await page.evaluate(
    ({ a, x, z, yaw }) => {
      a.teleport(x, z)
      a.setCamYaw(yaw)
    },
    { a: h, x: outside.x, z: outside.z, yaw: startYaw }
  )
  await page.waitForTimeout(400)
  await page.keyboard.down('ArrowUp')
  let insideMill = false
  for (let i = 0; i < 40; i++) {
    const s = await snap(page)
    if (Math.hypot(s.mllx, s.mllz) < 1.2) {
      insideMill = true
      break
    }
    await page.waitForTimeout(280)
  }
  expect(insideMill).toBe(true)
  let top = false
  for (let i = 0; i < 140; i++) {
    const s = await snap(page)
    if (s.y > MILL.base + MILL.top - 0.3) {
      top = true
      break
    }
    await page.evaluate(
      ({ yaw }) => {
        const g = (window as unknown as { __Ghibli: Api }).__Ghibli
        const st = g.snapshot()
        const phi0 = Math.atan2(-st.mllx, st.mllz)
        const phi = phi0 < 0 ? phi0 + Math.PI * 2 : phi0
        const tx = -Math.sin(phi + 0.35) * 2.625 - st.mllx
        const tz = Math.cos(phi + 0.35) * 2.625 - st.mllz
        const n = Math.hypot(tx, tz)
        const c = Math.cos(yaw)
        const s2 = Math.sin(yaw)
        const wx = (tx / n) * c + (tz / n) * s2
        const wz = -(tx / n) * s2 + (tz / n) * c
        g.setCamYaw(Math.atan2(-wx, -wz))
      },
      { yaw: MILL.yaw }
    )
    await page.waitForTimeout(280)
  }
  await page.keyboard.up('ArrowUp')
  expect(top).toBe(true)
  const s = await snap(page)
  expect(s.y).toBeGreaterThan(MILL.base + MILL.top - 0.6)
  expect(s.y).toBeLessThan(MILL.base + MILL.top + 0.4)
})

test('mansion stairs reach the second floor', async ({ page }) => {
  const h = await api(page)
  const bottom = mansionWorld(MANSION_STAIR.lx0 + 0.25, (MANSION_STAIR.lz0 + MANSION_STAIR.lz1) / 2)
  await page.evaluate(
    ({ a, x, z, yaw }) => {
      a.teleport(x, z)
      a.setCamYaw(yaw)
    },
    { a: h, x: bottom.x, z: bottom.z, yaw: -MANSION.yaw }
  )
  await page.waitForTimeout(300)
  await page.keyboard.down('ArrowUp')
  let up = false
  for (let i = 0; i < 40; i++) {
    const s = await snap(page)
    if (s.y > MANSION.floor2 - 0.2 && s.mlx > MANSION_STAIR.lx1 - 0.5) {
      up = true
      break
    }
    await page.waitForTimeout(300)
  }
  await page.keyboard.up('ArrowUp')
  expect(up).toBe(true)
  let summit = false
  for (let i = 0; i < 12 && !summit; i++) {
    const s = await snap(page)
    summit =
      s.y > MANSION.floor2 - 0.1 &&
      s.y < MANSION.floor2 + 0.4 &&
      s.mlz < MANSION_SLAB_LZ &&
      s.insideMansion
    if (!summit) await page.waitForTimeout(300)
  }
  expect(summit).toBe(true)
})

test('can walk under the back balcony with no invisible wall', async ({ page }) => {
  const h = await api(page)
  const porch = mansionWorld(4.6, -8.8)
  await page.evaluate(
    ({ a, x, z, yaw }) => {
      a.teleport(x, z)
      a.setCamYaw(yaw)
    },
    { a: h, x: porch.x, z: porch.z, yaw: MANSION.yaw - Math.PI }
  )
  await page.waitForTimeout(300)
  const s0 = await snap(page)
  expect(s0.y).toBeLessThan(0.5)
  await page.keyboard.down('ArrowUp')
  let maxLift = 0
  for (let i = 0; i < 24; i++) {
    maxLift = Math.max(maxLift, (await snap(page)).y)
    await page.waitForTimeout(250)
  }
  await page.keyboard.up('ArrowUp')
  const s1 = await snap(page)
  expect(s1.mlz - s0.mlz).toBeGreaterThan(1.5)
  expect(s1.mlz).toBeGreaterThan(-7.2)
  expect(s1.mlz).toBeLessThan(-6.15)
  expect(maxLift).toBeLessThan(0.5)
  expect(s1.insideMansion).toBe(false)
})

test('fountain rim is solid below and standable above', async ({ page }) => {
  const h = await api(page)
  await page.evaluate((a) => {
    a.teleport(-6, 1.2)
    a.setCamYaw(0)
  }, h)
  await page.waitForTimeout(300)
  await page.keyboard.down('ArrowUp')
  await page.waitForTimeout(900)
  await page.keyboard.up('ArrowUp')
  const walked = await snap(page)
  const dWalked = Math.hypot(walked.x + 6, walked.z + 1)
  expect(dWalked).toBeGreaterThan(1.35)
  await page.waitForTimeout(250)
  let maxLift = 0
  let landed = await snap(page)
  for (let attempt = 0; attempt < 4 && maxLift <= 0.4; attempt++) {
    await page.keyboard.down('ArrowUp')
    await page.keyboard.press('Space')
    for (let i = 0; i < 48; i++) {
      landed = await snap(page)
      const d = Math.hypot(landed.x + 6, landed.z + 1)
      if (d < 2.05) maxLift = Math.max(maxLift, landed.y)
      if (landed.grounded && i > 5) break
      await page.waitForTimeout(160)
    }
    await page.keyboard.up('ArrowUp')
  }
  expect(maxLift).toBeGreaterThan(0.4)
  expect(landed.grounded).toBe(true)
  const dEnd = Math.hypot(landed.x + 6, landed.z + 1)
  expect(landed.y).toBeGreaterThan(0.35)
  expect(dEnd).toBeLessThan(2.05)
})

test('sleeping fades the world to dark and back', async ({ page }) => {
  const h = await api(page)
  await page.evaluate((a) => {
    a.teleport(12.0, -11.6)
    a.setCamYaw(0.8)
  }, h)
  await page.waitForTimeout(2500)
  await page.keyboard.press('KeyE')
  let dark = false
  for (let i = 0; i < 25; i++) {
    if ((await snap(page)).veil > 0.4) {
      dark = true
      break
    }
    await page.waitForTimeout(300)
  }
  expect(dark).toBe(true)
  let woke = false
  for (let i = 0; i < 25; i++) {
    if ((await snap(page)).veil < 0.1) {
      woke = true
      break
    }
    await page.waitForTimeout(300)
  }
  expect(woke).toBe(true)
})

test('read the book opens and closes the ledger', async ({ page }) => {
  const h = await api(page)
  const spot = houseWorld(0.55, 0.8)
  await page.evaluate(
    ({ a, x, z }) => {
      a.teleport(x, z)
      a.setCamYaw(1.4)
    },
    { a: h, x: spot.x, z: spot.z }
  )
  await page.waitForTimeout(2500)
  const s0 = await snap(page)
  expect(s0.near).toBe('book')
  await page.keyboard.press('KeyE')
  await page.waitForTimeout(400)
  await expect(page.locator('.book')).toBeVisible()
  await page.keyboard.press('KeyE')
  await page.waitForTimeout(300)
  await expect(page.locator('.book')).toHaveCount(0)
})

test('chopping a tree yields wood with the axe', async ({ page }) => {
  const t0 = TREES[0]
  const h = await api(page)
  await page.evaluate(
    ({ a, x, z }) => {
      a.teleport(x, z)
    },
    { a: h, x: t0.x + 1.05, z: t0.z }
  )
  await page.waitForTimeout(500)
  const s0 = await snap(page)
  expect(s0.near).toBe('chop')
  expect(s0.tool).toBe('axe')
  let wood = 0
  for (let i = 0; i < 8 && wood < 1; i++) {
    await page.keyboard.press('KeyE')
    await page.waitForTimeout(1700)
    wood = (await snap(page)).inv.wood
  }
  expect(wood).toBeGreaterThanOrEqual(1)
})

test('pickup, inventory and throw', async ({ page }) => {
  const flower = pickups.find(
    (p) =>
      p.type === 'flower' &&
      p.alive &&
      TREES.every((t) => Math.hypot(t.x - p.x, t.z - p.z) > 2.5) &&
      Math.hypot(p.x - SLIME_SPAWN.x, p.z - SLIME_SPAWN.z) > 4
  )
  expect(flower).toBeTruthy()
  const h = await api(page)
  await page.evaluate(
    ({ a, x, z }) => {
      a.teleport(x, z)
    },
    { a: h, x: flower!.x, z: flower!.z }
  )
  await page.waitForTimeout(500)
  const s0 = await snap(page)
  expect(s0.near).toBe('pk')
  expect(s0.pickups).toBe(23)
  await page.keyboard.press('KeyE')
  let pickedUp = false
  let s1 = await snap(page)
  for (let i = 0; i < 20 && !pickedUp; i++) {
    await page.waitForTimeout(300)
    s1 = await snap(page)
    pickedUp = s1.inv.flower === 1 && s1.pickups === 22
  }
  expect(pickedUp).toBe(true)
  await page.keyboard.press('Digit2')
  await page.waitForTimeout(150)
  await page.keyboard.press('KeyG')
  let thrown = false
  let s2 = await snap(page)
  for (let i = 0; i < 20 && !thrown; i++) {
    await page.waitForTimeout(300)
    s2 = await snap(page)
    thrown = s2.inv.flower === 0 && s2.pickups === 23
  }
  expect(thrown).toBe(true)
})

test('sit on a stool and stand back up', async ({ page }) => {
  const h = await api(page)
  await page.evaluate((a) => {
    a.teleport(13.5, -7.2)
    a.setCamYaw(-2.4)
  }, h)
  await page.waitForTimeout(2500)
  let near = ''
  for (let i = 0; i < 10; i++) {
    near = (await snap(page)).near
    if (near === 'sit') break
    await page.waitForTimeout(300)
  }
  expect(near).toBe('sit')
  await page.keyboard.press('KeyE')
  let sat = false
  for (let i = 0; i < 12; i++) {
    if ((await snap(page)).mode === 'sit') {
      sat = true
      break
    }
    await page.waitForTimeout(300)
  }
  expect(sat).toBe(true)
  await page.keyboard.press('KeyW')
  let stood = false
  for (let i = 0; i < 12; i++) {
    const s = await snap(page)
    if (s.mode === 'walk' && s.grounded) {
      stood = true
      break
    }
    await page.waitForTimeout(300)
  }
  expect(stood).toBe(true)
})

test('food can be picked up and eaten for a speed boost', async ({ page }) => {
  const h = await api(page)
  const spot = mansionWorld(0, 2.7)
  await page.evaluate(
    ({ a, x, z }) => {
      a.teleport(x, z)
      a.setCamYaw(Math.PI)
    },
    { a: h, x: spot.x, z: spot.z }
  )
  await page.waitForTimeout(2500)
  const s0 = await snap(page)
  expect(s0.near).toBe('pk')
  expect(s0.inv.food).toBe(0)
  await page.keyboard.press('KeyE')
  let picked = false
  for (let i = 0; i < 10; i++) {
    if ((await snap(page)).inv.food === 1) {
      picked = true
      break
    }
    await page.waitForTimeout(300)
  }
  expect(picked).toBe(true)
  await page.keyboard.press('Digit5')
  await page.waitForTimeout(200)
  await page.evaluate((a) => {
    a.teleport(0, 8)
  }, h)
  await page.waitForTimeout(400)
  expect((await snap(page)).near).toBe('')
  await page.keyboard.press('KeyE')
  let eaten = false
  for (let i = 0; i < 10; i++) {
    const s = await snap(page)
    if (s.inv.food === 0 && s.buff > 0.5) {
      eaten = true
      break
    }
    await page.waitForTimeout(300)
  }
  expect(eaten).toBe(true)
})

test('fishing catches a fish on the bite', async ({ page }) => {
  const h = await api(page)
  await page.evaluate((a) => {
    a.teleport(-11.6, 7.2)
    a.setCamYaw(2.2)
  }, h)
  await page.waitForTimeout(400)
  const s0 = await snap(page)
  expect(s0.near).toBe('fish')
  await page.keyboard.press('KeyE')
  let cast = false
  for (let i = 0; i < 8; i++) {
    const s = await snap(page)
    if (s.fishing && s.tool === 'rod') {
      cast = true
      break
    }
    await page.waitForTimeout(300)
  }
  expect(cast).toBe(true)
  let caught = false
  for (let i = 0; i < 70; i++) {
    const s = await snap(page)
    if (!s.fishing) break
    if (s.bite) {
      await page.keyboard.press('KeyE')
      caught = true
      break
    }
    await page.waitForTimeout(150)
  }
  expect(caught).toBe(true)
  let granted = false
  for (let i = 0; i < 10; i++) {
    if ((await snap(page)).inv.fish === 1) {
      granted = true
      break
    }
    await page.waitForTimeout(200)
  }
  expect(granted).toBe(true)
})

test('indoor zoom behaves consistently in every building', async ({ page }) => {
  const h = await api(page)
  await page.evaluate((a) => {
    a.teleport(12.9, -10.9)
    a.setCamYaw(2.6)
  }, h)
  await page.waitForTimeout(800)
  await page.mouse.wheel(0, 600)
  await page.waitForTimeout(500)
  let s = await snap(page)
  expect(Math.abs(s.camX - 12)).toBeLessThan(4.3)
  expect(Math.abs(s.camZ + 10)).toBeLessThan(4.5)
  expect(s.camY).toBeLessThan(2.7)

  const bottom = mansionWorld(MANSION_STAIR.lx0 + 0.25, (MANSION_STAIR.lz0 + MANSION_STAIR.lz1) / 2)
  await page.evaluate(
    ({ a, x, z, yaw }) => {
      a.teleport(x, z)
      a.setCamYaw(yaw)
    },
    { a: h, x: bottom.x, z: bottom.z, yaw: -MANSION.yaw }
  )
  await page.waitForTimeout(300)
  await page.keyboard.down('ArrowUp')
  let up = false
  for (let i = 0; i < 40; i++) {
    if ((await snap(page)).y > MANSION.floor2 - 0.15 && (await snap(page)).mlx > MANSION_STAIR.lx1 - 0.5) {
      up = true
      break
    }
    await page.waitForTimeout(300)
  }
  await page.keyboard.up('ArrowUp')
  expect(up).toBe(true)
  await page.mouse.wheel(0, 600)
  await page.waitForTimeout(500)
  s = await snap(page)
  expect(Math.abs(s.camX - MANSION.x)).toBeLessThan(7.0)
  expect(Math.abs(s.camZ - MANSION.z)).toBeLessThan(5.6)
  expect(s.camY).toBeLessThan(MANSION.floor2 + 2.6)

  const outside = millWorld(0, MILL.rWall + 1.3)
  await page.evaluate(
    ({ a, x, z, yaw }) => {
      a.teleport(x, z)
      a.setCamYaw(yaw)
    },
    { a: h, x: outside.x, z: outside.z, yaw: MILL.yaw }
  )
  await page.waitForTimeout(400)
  await page.keyboard.down('ArrowUp')
  let insideMill = false
  for (let i = 0; i < 40; i++) {
    const s = await snap(page)
    if (Math.hypot(s.mllx, s.mllz) < 1.2) {
      insideMill = true
      break
    }
    await page.waitForTimeout(280)
  }
  expect(insideMill).toBe(true)
  let climbed = false
  for (let i = 0; i < 100; i++) {
    if ((await snap(page)).y > MILL.base + MILL.top - 0.6) {
      climbed = true
      break
    }
    await page.evaluate(
      ({ yaw }) => {
        const g = (window as unknown as { __Ghibli: Api }).__Ghibli
        const st = g.snapshot()
        const phi0 = Math.atan2(-st.mllx, st.mllz)
        const phi = phi0 < 0 ? phi0 + Math.PI * 2 : phi0
        const tx = -Math.sin(phi + 0.35) * 2.625 - st.mllx
        const tz = Math.cos(phi + 0.35) * 2.625 - st.mllz
        const n = Math.hypot(tx, tz)
        const c = Math.cos(yaw)
        const s2 = Math.sin(yaw)
        const wx = (tx / n) * c + (tz / n) * s2
        const wz = -(tx / n) * s2 + (tz / n) * c
        g.setCamYaw(Math.atan2(-wx, -wz))
      },
      { yaw: MILL.yaw }
    )
    await page.waitForTimeout(280)
  }
  await page.keyboard.up('ArrowUp')
  expect(climbed).toBe(true)
  await page.mouse.wheel(0, 600)
  await page.waitForTimeout(500)
  s = await snap(page)
  expect(Math.hypot(s.camX - MILL.x, s.camZ - MILL.z)).toBeLessThan(MILL.rIn - 0.2)
  expect(s.camY).toBeLessThan(MILL.base + MILL.top + 5.2)
})

test('windmill base floor has no invisible walls', async ({ page }) => {
  const h = await api(page)
  const outside = millWorld(0, MILL.rWall + 1.3)
  await page.evaluate(
    ({ a, x, z, yaw }) => {
      a.teleport(x, z)
      a.setCamYaw(yaw)
    },
    { a: h, x: outside.x, z: outside.z, yaw: MILL.yaw }
  )
  await page.waitForTimeout(300)
  await page.keyboard.down('ArrowUp')
  let maxLift = 0
  let reached = false
  for (let i = 0; i < 16; i++) {
    const s = await snap(page)
    maxLift = Math.max(maxLift, s.y - MILL.base)
    if (Math.hypot(s.mllx, s.mllz) < 1.2) {
      reached = true
      break
    }
    await page.waitForTimeout(300)
  }
  await page.keyboard.up('ArrowUp')
  expect(reached).toBe(true)
  expect(maxLift).toBeLessThan(1.45)
})

test('windmill sails animate', async ({ page }) => {
  const s0 = await snap(page)
  await page.waitForTimeout(1200)
  const s1 = await snap(page)
  const dt = Math.max(s1.t - s0.t, 0.1)
  const rate = Math.abs(wrap(s1.windmill - s0.windmill)) / dt
  expect(rate).toBeGreaterThan(0.35)
  expect(rate).toBeLessThan(0.85)
})

test('ground height stays consistent across the mansion stair and slab edges', () => {
  const st = MANSION_STAIR
  const samples = 8
  for (let i = 0; i <= samples; i++) {
    const lz = st.lz1 - 0.3 - (i / samples) * (st.lz1 - st.lz0 - 0.5)
    const p = mansionWorld((st.lx0 + st.lx1) / 2, lz)
    const h = groundHeight(p.x, p.z, MANSION.floor2)
    expect(h).toBeGreaterThanOrEqual(MANSION.floorY - 0.01)
    expect(h).toBeLessThanOrEqual(MANSION.floor2 + 0.01)
  }
  const hall = mansionWorld(-3, 2)
  expect(groundHeight(hall.x, hall.z)).toBeCloseTo(MANSION.floorY, 2)
  const slabTop = mansionWorld(4.5, -4)
  expect(groundHeight(slabTop.x, slabTop.z, MANSION.floor2)).toBeCloseTo(MANSION.floor2, 2)
  const slabUnder = mansionWorld(4.5, -4)
  expect(groundHeight(slabUnder.x, slabUnder.z, 0.3)).toBeCloseTo(MANSION.floorY, 2)
  const stairwell = mansionWorld(-0.2, -5)
  const overWell = groundHeight(stairwell.x, stairwell.z, MANSION.floor2)
  expect(overWell).toBeGreaterThan(MANSION.floorY)
  expect(overWell).toBeLessThan(MANSION.floor2 - 0.3)
})

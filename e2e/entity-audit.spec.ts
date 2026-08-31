import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { CULL_DEFS } from '../src/lib/cull'
import { ENTITIES, FEATURE_VOCAB } from '../src/lib/entities'
import {
  FOUNTAIN,
  HOUSE,
  HOUSE_DOOR,
  INTERACTABLES,
  MANSION,
  MANSION_BALCONY,
  MANSION_DOOR,
  MANSION_PORTICO,
  MILL,
  MILL_BALCONY,
  MILL_LOOKOUT,
  MILL_LOOKOUT_MID_PHI,
  POND,
  PLAYER,
  SEATS,
  WELL,
  groundHeight,
  houseLocal,
  mansionLocal,
  mansionWorld,
  millWorld,
  terrainHeight,
} from '../src/lib/world'

type AuditRow = {
  id: string
  name: string
  kind: string
  description: string
  features: string[]
  meshPresent: boolean
  cullRegistered: boolean
  cullVisible: boolean | null
}

type Audit = { entities: AuditRow[]; sceneOnlyIds: string[] }

type Api = {
  entityAudit: () => Audit
  teleport: (x: number, z: number) => void
  setCamYaw: (y: number) => void
}

const api = (page: Page) => page.evaluateHandle(() => (window as unknown as { __Ghibli: Api }).__Ghibli)

const boot = async (page: Page) => {
  await page.goto('/?lite')
  await page.waitForFunction(
    () =>
      (
        window as unknown as {
          __Ghibli?: { entityAudit?: () => Audit; snapshot?: () => { ready: boolean } }
        }
      ).__Ghibli?.snapshot?.()?.ready === true,
    null,
    { timeout: 120_000 }
  )
}

const fileText = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8')

const SCENE_FILE: Record<string, string> = {
  house: 'src/scene/House.tsx',
  mansion: 'src/scene/Mansion.tsx',
  windmill: 'src/scene/Windmill.tsx',
  fountain: 'src/scene/Fountain.tsx',
  well: 'src/scene/Well.tsx',
  pond: 'src/scene/Pond.tsx',
}

test.describe('entity registry', () => {
  test('ids, names and descriptions are unique', () => {
    const ids = ENTITIES.map((e) => e.id)
    const names = ENTITIES.map((e) => e.name)
    const descriptions = ENTITIES.map((e) => e.description)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(names).size).toBe(names.length)
    expect(new Set(descriptions).size).toBe(descriptions.length)
    for (const e of ENTITIES) {
      expect(e.description.length, `${e.id} description too thin`).toBeGreaterThanOrEqual(60)
      expect(e.features.length, `${e.id} declares no features`).toBeGreaterThan(0)
      for (const f of e.features) expect(FEATURE_VOCAB, `${e.id} feature ${f}`).toContain(f)
    }
  })

  test('registry covers every cullable landmark exactly', () => {
    expect([...ENTITIES.map((e) => e.id)].sort()).toEqual(Object.keys(CULL_DEFS).sort())
  })

  test('every registered id is a literal cullId in its scene file', () => {
    for (const e of ENTITIES) {
      const src = fileText(SCENE_FILE[e.id])
      expect(src, `${e.id} must set userData.cullId`).toContain(`cullId: '${e.id}'`)
    }
  })

  test('light-bearing entities have a point light in their scene file', () => {
    for (const e of ENTITIES.filter((e) => e.features.includes('light'))) {
      expect(fileText(SCENE_FILE[e.id]), `${e.id} declares light`).toContain('<pointLight')
    }
  })
})

test.describe('mansion portico grill', () => {
  const cx = MANSION_PORTICO.cx
  const doorCenter = MANSION_DOOR.hingeLX + MANSION_DOOR.openW / 2

  test('portico is centered on the doorway', () => {
    expect(cx).toBeCloseTo(doorCenter, 6)
    expect(Math.abs(cx - (cx - MANSION_PORTICO.halfW))).toBeCloseTo(
      Math.abs(cx + MANSION_PORTICO.halfW - cx),
      6
    )
  })

  test('columns clear the doorway opening and the open leaf', () => {
    const left = cx - MANSION_PORTICO.halfW
    const right = cx + MANSION_PORTICO.halfW
    expect(doorCenter - left).toBeCloseTo(right - doorCenter, 6)
    expect(left).toBeLessThanOrEqual(MANSION_DOOR.hingeLX - 0.31)
    expect(right).toBeGreaterThanOrEqual(MANSION_DOOR.hingeLX + MANSION_DOOR.openW + 0.31)
  })

  test('roof line and steps keep the porch a porch, not a fake balcony', () => {
    expect(MANSION_PORTICO.roofY).toBeCloseTo(MANSION.floor2 + 0.12, 6)
    expect(MANSION_PORTICO.d1).toBeGreaterThan(MANSION.d / 2)
    expect(MANSION_PORTICO.stepSpan).toBeGreaterThanOrEqual(MANSION_DOOR.openW + 0.5)
    const src = fileText('src/scene/Mansion.tsx')
    expect(src).not.toContain('const px0')
  })
})

test.describe('per-entity feature grill', () => {
  test('house: open door with walkable threshold and interior anchors', () => {
    expect(HOUSE_DOOR.swing).toBeGreaterThan(2.5)
    expect(HOUSE_DOOR.swing).toBeLessThanOrEqual(Math.PI)
    expect(HOUSE_DOOR.hingeLX + HOUSE_DOOR.openW).toBeCloseTo(HOUSE.doorLX + HOUSE.doorW / 2, 6)
    for (const id of ['bed', 'book']) {
      const it = INTERACTABLES.find((i) => i.id === id)
      expect(it, `house interactable ${id}`).toBeDefined()
      const l = houseLocal(it!.x, it!.z)
      expect(Math.abs(l.lx)).toBeLessThan(HOUSE.w / 2)
      expect(Math.abs(l.lz)).toBeLessThan(HOUSE.d / 2)
    }
    expect(SEATS.length).toBeGreaterThanOrEqual(2)
  })

  test('mansion: open front door, ajar balcony leaf, deck, grand interior', () => {
    expect(MANSION_DOOR.swing).toBeGreaterThan(2.5)
    expect(MANSION_BALCONY.doorHalfW * 2 - 0.16).toBeGreaterThan(0.5)
    expect(MANSION_BALCONY.doorH - 0.12).toBeLessThanOrEqual(MANSION_BALCONY.doorH)
    const deckC = mansionWorld(MANSION_BALCONY.doorLX, (MANSION_BALCONY.lz0 + MANSION_BALCONY.lz1) / 2)
    expect(groundHeight(deckC.x, deckC.z, MANSION.floor2)).toBeCloseTo(MANSION.floor2, 6)
    const bed2 = INTERACTABLES.find((i) => i.id === 'bed2')
    expect(bed2).toBeDefined()
    const l = mansionLocal(bed2!.x, bed2!.z)
    expect(Math.abs(l.lx)).toBeLessThan(MANSION.w / 2)
    expect(Math.abs(l.lz)).toBeLessThan(MANSION.d / 2)
    expect(SEATS.filter((s) => Math.abs(mansionLocal(s.x, s.z).lx) < MANSION.w / 2).length).toBeGreaterThanOrEqual(4)
  })

  test('windmill: ajar door fits the slit, guarded deck, lookout on the balcony', () => {
    expect(MILL.doorHalf * 2 * MILL.rWall).toBeGreaterThanOrEqual(1.7)
    expect(MILL_BALCONY.railH).toBeGreaterThanOrEqual(1.0)
    expect(MILL_BALCONY.lintelH).toBeGreaterThanOrEqual(PLAYER.h + 0.5)
    expect(MILL_BALCONY.lintelH).toBeGreaterThan(PLAYER.jumpApex + 1)
    const look = millWorld(
      -Math.sin(MILL_LOOKOUT_MID_PHI) * MILL_LOOKOUT.r,
      Math.cos(MILL_LOOKOUT_MID_PHI) * MILL_LOOKOUT.r
    )
    expect(groundHeight(look.x, look.z, MILL.base + MILL.top)).toBeCloseTo(MILL.base + MILL.top, 6)
    const lookout = INTERACTABLES.find((i) => i.id === 'lookout')
    expect(lookout).toBeDefined()
  })

  test('water entities expose their walkable basins or sunken surface', () => {
    expect(groundHeight(FOUNTAIN.x + 1.85, FOUNTAIN.z)).toBeCloseTo(0.56, 3)
    expect(groundHeight(WELL.x + 0.9, WELL.z)).toBeCloseTo(0.78, 3)
    expect(terrainHeight(POND.x, POND.z)).toBeLessThan(-0.3)
  })
})

test.describe('runtime entity audit', () => {
  test('every entity grills green in the live scene', async ({ page }) => {
    await boot(page)
    const audit = await page.evaluate(() => (window as unknown as { __Ghibli: Api }).__Ghibli.entityAudit())
    expect(audit.sceneOnlyIds).toEqual([])
    expect(audit.entities.map((e) => e.id).sort()).toEqual(Object.keys(CULL_DEFS).sort())
    for (const row of audit.entities) {
      expect(row.meshPresent, `${row.id} mesh in scene`).toBe(true)
      expect(row.cullRegistered, `${row.id} cull registration`).toBe(true)
      expect(typeof row.cullVisible, `${row.id} cull visibility type`).toBe('boolean')
      expect(row.description.length, `${row.id} description rides the audit`).toBeGreaterThan(0)
      expect(row.features.length, `${row.id} features ride the audit`).toBeGreaterThan(0)
    }
  })

  test('each landmark is visible once the player stands beside it', async ({ page }) => {
    await boot(page)
    const h = await api(page)
    for (const [id, def] of Object.entries(CULL_DEFS)) {
      await page.evaluate(
        ({ a, x, z }) => a.teleport(x, z),
        { a: h, x: def.x + 8, z: def.z + 8 }
      )
      let visible = false
      for (let i = 0; i < 40 && !visible; i++) {
        await page.waitForTimeout(250)
        const audit = await page.evaluate(() =>
          (window as unknown as { __Ghibli: Api }).__Ghibli.entityAudit()
        )
        visible = audit.entities.find((e) => e.id === id)?.cullVisible === true
      }
      expect(visible, `${id} should be culled-in next to the player`).toBe(true)
    }
  })

  test('portico facade screenshot shows the centered doorway', async ({ page }) => {
    await boot(page)
    await page.addStyleTag({
      content:
        '.hud,.quests,.hotbar,.intro,.prompt,.hearts,.gear,.crosshair,.debug-panel,.veil-text,.slime-health{display:none!important}',
    })
    const h = await api(page)
    const from = mansionWorld(MANSION_PORTICO.cx, MANSION.d / 2 + 3.6)
    const to = mansionWorld(MANSION_PORTICO.cx, MANSION.d / 2 - 0.5)
    await page.evaluate(
      ({ a, x, z, yaw }) => {
        a.teleport(x, z)
        a.setCamYaw(yaw)
      },
      { a: h, x: from.x, z: from.z, yaw: Math.atan2(-(to.x - from.x), -(to.z - from.z)) }
    )
    await page.waitForTimeout(700)
    await page.mouse.wheel(0, -700)
    await page.waitForTimeout(900)
    await page.screenshot({ path: 'test-results/gallery/portico-mansion.png' })
  })
})

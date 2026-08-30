import type { Object3D } from 'three'
import { FOUNTAIN, HOUSE, MILL, MANSION, POND, WELL, WINDMILL } from './world'

export type CullEntry = {
  id: string
  x: number
  y: number
  z: number
  r: number
  obj: Object3D | null
  visible: boolean
}

export const CULL_DEFS: Record<string, { x: number; y: number; z: number; r: number }> = {
  house: { x: HOUSE.x, y: 1.6, z: HOUSE.z, r: 6.5 },
  mansion: { x: MANSION.x, y: 5, z: MANSION.z, r: 12.5 },
  windmill: { x: WINDMILL.x, y: (MILL.base + MILL.top) / 2, z: WINDMILL.z, r: 7 },
  fountain: { x: FOUNTAIN.x, y: 1, z: FOUNTAIN.z, r: 3.2 },
  well: { x: WELL.x, y: 1, z: WELL.z, r: 2.2 },
  pond: { x: POND.x, y: 0, z: POND.z, r: POND.r + 1.5 },
}

const entries = new Map<string, CullEntry>()

export function registerCullable(id: string, x: number, y: number, z: number, r: number): CullEntry {
  const e = entries.get(id)
  if (e) {
    e.x = x
    e.y = y
    e.z = z
    e.r = r
    return e
  }
  const ne: CullEntry = { id, x, y, z, r, obj: null, visible: true }
  entries.set(id, ne)
  return ne
}

export function attachCullable(id: string, obj: Object3D) {
  const e = entries.get(id)
  if (e) e.obj = obj
}

export function cullEntries(): CullEntry[] {
  return [...entries.values()]
}

export function cullVisible(id: string): boolean | null {
  const e = entries.get(id)
  return e ? e.visible : null
}

export function withinRenderDistance(dist: number, maxDist: number, margin = 0): boolean {
  return dist - margin <= maxDist
}

export function updateCulling(camX: number, camY: number, camZ: number, maxDist: number): { total: number; visible: number } {
  let visible = 0
  for (const e of entries.values()) {
    const d = Math.hypot(e.x - camX, e.y - camY, e.z - camZ)
    e.visible = withinRenderDistance(d, maxDist, e.r)
    if (e.obj) e.obj.visible = e.visible
    if (e.visible) visible++
  }
  return { total: entries.size, visible }
}

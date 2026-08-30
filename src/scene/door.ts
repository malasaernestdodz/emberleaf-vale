import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export type DoorBuild = { w: number; h: number; t: number; open: number }

export function buildDoorLeaf({ w, h, t, open }: DoorBuild): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = []
  const panel = new THREE.BoxGeometry(w, h, t)
  panel.translate(w / 2, h / 2, 0)
  parts.push(panel)
  for (const by of [h * 0.26, h * 0.74]) {
    const brace = new THREE.BoxGeometry(w - 0.14, 0.13, t + 0.04)
    brace.translate(w / 2, by, 0)
    parts.push(brace)
  }
  const handle = new THREE.BoxGeometry(0.1, 0.1, t + 0.26)
  handle.translate(w - 0.24, h * 0.48, 0)
  parts.push(handle)
  const g = mergeGeometries(parts, false)!
  g.rotateY(open)
  return g
}

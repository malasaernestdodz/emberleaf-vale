import { useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { smoothstep } from '../lib/math'
import { MANSION, MANSION_BALCONY, MANSION_DOOR, MANSION_SLAB_LZ, MANSION_STAIR, MANSION_STAIRWELL } from '../lib/world'
import { buildDoorLeaf } from './door'
import { getGlassMaterial, getNoiseNormalMap } from './textures'
import { getToonRamp } from './toonRamp'

const COLORS: Record<string, string> = {
  plaster: '#b3a7d6',
  timber: '#4a3a2c',
  wood: '#7a5b3a',
  roof: '#a03d2c',
  cream: '#efe6d0',
  red: '#b8452f',
  gold: '#d8b56a',
  blue: '#4a7a9e',
  green: '#5d8f3a',
  steel: '#cfd6dd',
  stone: '#8d8578',
}

function tr(g: THREE.BufferGeometry, x: number, y: number, z: number, ry = 0) {
  if (ry) g.rotateY(ry)
  g.translate(x, y, z)
  return g
}

const H = 9.3
const F2 = MANSION.floor2
const f1 = MANSION.floorY
const BURY = 0.35
const STAIR_MID_LX = (MANSION_STAIR.lx0 + MANSION_STAIR.lx1) / 2
const STAIR_MID_LZ = (MANSION_STAIR.lz0 + MANSION_STAIR.lz1) / 2
const STAIR_LEN = MANSION_STAIR.lx1 - MANSION_STAIR.lx0
const SLOPE = Math.atan2(F2 - f1, STAIR_LEN)

export function Mansion() {
  const doorGeo = useMemo(
    () =>
      buildDoorLeaf({ w: MANSION_DOOR.openW, h: MANSION_DOOR.openH, t: MANSION_DOOR.leafT, open: MANSION_DOOR.swing }),
    []
  )
  const balcDoorGeo = useMemo(
    () =>
      buildDoorLeaf({
        w: MANSION_BALCONY.doorHalfW * 2 - 0.16,
        h: MANSION_BALCONY.doorH - 0.12,
        t: 0.08,
        open: 0.55,
      }),
    []
  )
  const built = useMemo(() => {
    const buckets: Record<string, THREE.BufferGeometry[]> = {}
    const put = (k: string, g: THREE.BufferGeometry) => {
      ;(buckets[k] ??= []).push(g)
    }
    const hw = MANSION.w / 2
    const hd = MANSION.d / 2
    const wallH = H + BURY
    const wallY = (H - BURY) / 2

    put('wood', tr(new THREE.BoxGeometry(MANSION.w, 0.29, MANSION.d), 0, f1 - 0.145, 0))

    put('plaster', tr(new THREE.BoxGeometry(5.7, wallH, 0.2), -4.65, wallY, hd))
    put('plaster', tr(new THREE.BoxGeometry(7.5, wallH, 0.2), 3.75, wallY, hd))
    put('plaster', tr(new THREE.BoxGeometry(1.8, H - 2.6, 0.2), -0.9, 2.6 + (H - 2.6) / 2, hd))
    put('plaster', tr(new THREE.BoxGeometry(MANSION.w, F2 + BURY, 0.2), 0, (F2 - BURY) / 2, -hd))
    put('plaster', tr(new THREE.BoxGeometry(6.55, H - F2, 0.2), -4.225, F2 + (H - F2) / 2, -hd))
    put('plaster', tr(new THREE.BoxGeometry(1.9, H - F2, 0.2), 0, F2 + (H - F2) / 2, -hd))
    put('plaster', tr(new THREE.BoxGeometry(2.9, H - F2, 0.2), 2.4, F2 + (H - F2) / 2, -hd))
    put(
      'plaster',
      tr(
        new THREE.BoxGeometry(
          MANSION_BALCONY.doorHalfW * 2,
          H - F2 - MANSION_BALCONY.doorH,
          0.2
        ),
        MANSION_BALCONY.doorLX,
        F2 + MANSION_BALCONY.doorH + (H - F2 - MANSION_BALCONY.doorH) / 2,
        -hd
      )
    )
    put('plaster', tr(new THREE.BoxGeometry(2.15, H - F2, 0.2), 6.425, F2 + (H - F2) / 2, -hd))
    put('plaster', tr(new THREE.BoxGeometry(0.2, wallH, MANSION.d), -hw, wallY, 0))
    put('plaster', tr(new THREE.BoxGeometry(0.2, wallH, MANSION.d), hw, wallY, 0))

    for (const [px, pz] of [
      [-hw, -hd],
      [hw, -hd],
      [-hw, hd],
      [hw, hd],
      ...MANSION_DOOR.jambPosts.map((jx) => [jx, hd] as [number, number]),
    ]) {
      put('timber', tr(new THREE.BoxGeometry(0.3, wallH + 0.05, 0.3), px, wallY + 0.025, pz))
    }
    for (const y of [F2 + 0.12, 6.8, H]) {
      put('timber', tr(new THREE.BoxGeometry(MANSION.w + 0.3, 0.24, 0.28), 0, y, hd))
      put('timber', tr(new THREE.BoxGeometry(MANSION.w + 0.3, 0.24, 0.28), 0, y, -hd))
      put('timber', tr(new THREE.BoxGeometry(0.28, 0.24, MANSION.d + 0.3), -hw, y, 0))
      put('timber', tr(new THREE.BoxGeometry(0.28, 0.24, MANSION.d + 0.3), hw, y, 0))
    }

    const addWin = (x: number, y: number, z: number, ry: number, w = 0.9, h = 0.9) => {
      const f = new THREE.BoxGeometry(w, h, 0.08)
      f.rotateY(ry)
      f.translate(x, y, z)
      put('timber', f)
      const g = new THREE.PlaneGeometry(w - 0.22, h - 0.22)
      g.rotateY(ry)
      const gx = x + Math.sin(ry) * 0.06
      const gz = z + Math.cos(ry) * 0.06
      g.translate(gx, y, gz)
      ;(buckets.glass ??= []).push(g)
      const ped = new THREE.BoxGeometry(w + 0.24, 0.13, 0.16)
      ped.rotateY(ry)
      ped.translate(x, y + h / 2 + 0.11, z)
      put('cream', ped)
      const sill = new THREE.BoxGeometry(w + 0.28, 0.11, 0.18)
      sill.rotateY(ry)
      sill.translate(x, y - h / 2 - 0.1, z)
      put('cream', sill)
      const mv = new THREE.BoxGeometry(0.05, h - 0.24, 0.05)
      mv.rotateY(ry)
      mv.translate(gx, y, gz)
      put('timber', mv)
      const mh = new THREE.BoxGeometry(w - 0.24, 0.05, 0.05)
      mh.rotateY(ry)
      mh.translate(gx, y, gz)
      put('timber', mh)
    }
    addWin(-3.6, 2.0, hd + 0.1, 0, 1.1, 1.7)
    addWin(3.6, 2.0, hd + 0.1, 0, 1.1, 1.7)
    addWin(-3.6, 5.8, hd + 0.1, 0)
    addWin(3.6, 5.8, hd + 0.1, 0)
    addWin(-4.5, 5.2, -hd - 0.1, Math.PI)
    addWin(6.45, 5.2, -hd - 0.1, Math.PI)
    addWin(-hw - 0.1, 1.9, 2.5, -Math.PI / 2)
    addWin(-hw - 0.1, 5.2, -2.5, -Math.PI / 2)
    addWin(hw + 0.1, 1.9, 2.5, Math.PI / 2)
    addWin(hw + 0.1, 5.2, -2.5, Math.PI / 2)

    const roofPts: THREE.Vector2[] = []
    for (let i = 0; i <= 10; i++) {
      const t = i / 10
      const flare = 1 + 0.08 * smoothstep(0.65, 1, t)
      roofPts.push(new THREE.Vector2(t * 11.4 * flare, H + Math.pow(1 - t, 1.2) * 3.0))
    }
    put('roof', new THREE.LatheGeometry(roofPts, 4).rotateY(Math.PI / 4))

    const sw = MANSION_STAIRWELL
    put('wood', tr(new THREE.BoxGeometry(MANSION.w, 0.15, MANSION_SLAB_LZ - sw.lz1), 0, F2 - 0.075, (MANSION_SLAB_LZ + sw.lz1) / 2))
    put('wood', tr(new THREE.BoxGeometry(hw - sw.lx1, 0.15, sw.lz1 - sw.lz0), (hw + sw.lx1) / 2, F2 - 0.075, (sw.lz0 + sw.lz1) / 2))
    put('wood', tr(new THREE.BoxGeometry(sw.lx0 + hw, 0.15, sw.lz1 - sw.lz0), (sw.lx0 - hw) / 2, F2 - 0.075, (sw.lz0 + sw.lz1) / 2))

    put('blue', tr(new THREE.CircleGeometry(2.0, 26).rotateX(-Math.PI / 2), 0, f1 + 0.015, 1.5))
    put('gold', tr(new THREE.CircleGeometry(1.3, 26).rotateX(-Math.PI / 2), 0, f1 + 0.02, 1.5))
    put('wood', tr(new THREE.BoxGeometry(3.2, 0.09, 1.4), 0, f1 + 0.8, 1.5))
    for (const [cx, cz] of [
      [-1.45, 0.95],
      [1.45, 0.95],
      [-1.45, 2.05],
      [1.45, 2.05],
    ]) {
      put('wood', tr(new THREE.BoxGeometry(0.14, 0.8, 0.14), cx, f1 + 0.4, cz))
    }
    for (const [px, pz] of [
      [1.9, 0.95],
      [1.9, 2.05],
      [-1.9, 0.95],
      [-1.9, 2.05],
    ]) {
      put('wood', tr(new THREE.CylinderGeometry(0.26, 0.3, 0.55, 8), px, f1 + 0.275, pz))
    }

    put('wood', tr(new THREE.BoxGeometry(0.55, 2.4, 3.0), -7.05, f1 + 1.2, 0.5))
    for (let row = 0; row < 4; row++) {
      for (let j = 0; j < 6; j++) {
        const cols = ['red', 'blue', 'gold', 'green']
        put(cols[(row + j) % 4], tr(new THREE.BoxGeometry(0.2, 0.34, 0.4), -7.0, f1 + 0.5 + row * 0.52, -0.75 + j * 0.5))
      }
    }
    put('wood', tr(new THREE.BoxGeometry(0.5, 2.3, 0.35), 4.9, f1 + 1.15, 4.6))
    put('cream', tr(new THREE.CircleGeometry(0.18, 12), 4.9, f1 + 1.8, 4.79))
    put('gold', tr(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6), 4.9, f1 + 1.35, 4.75))

    for (const [px, pz] of [
      [-6.8, 5.2],
      [-6.8, -0.8],
    ]) {
      put('wood', tr(new THREE.CylinderGeometry(0.28, 0.36, 0.5, 8), px, f1 + 0.25, pz))
      put('green', new THREE.SphereGeometry(0.42, 10, 8).translate(px, f1 + 0.75, pz))
    }

    const STEPS = MANSION_STAIR.steps
    for (let k = 0; k < STEPS; k++) {
      const frac = (k + 0.5) / STEPS
      const lx = MANSION_STAIR.lx0 + frac * STAIR_LEN
      const y = f1 + ((k + 1) / STEPS) * (F2 - f1) - 0.06
      put('wood', tr(new THREE.BoxGeometry(0.48, 0.12, 2.0), lx, y, STAIR_MID_LZ))
    }
    const rampLen = Math.hypot(STAIR_LEN, F2 - f1)
    const under = new THREE.BoxGeometry(rampLen + 0.2, 0.12, 2.0)
    under.rotateZ(SLOPE)
    under.translate(STAIR_MID_LX, (f1 + F2) / 2 - 0.14, STAIR_MID_LZ)
    put('wood', under)
    const railLen = sw.lx1 - sw.lx0 + 0.4
    const rail = new THREE.BoxGeometry(railLen, 0.14, 0.09)
    rail.rotateZ(SLOPE)
    rail.translate((sw.lx0 + sw.lx1) / 2, F2 + 1.0 - (railLen / 2) * Math.sin(SLOPE), MANSION_STAIR.lz1 + 0.05)
    put('timber', rail)
    const railPost = new THREE.BoxGeometry(sw.lx1 - sw.lx0, F2 - f1 + 1.0, 0.14)
    railPost.translate((sw.lx0 + sw.lx1) / 2, f1 + (F2 - f1 + 1.0) / 2, MANSION_STAIR.lz1 + 0.07)
    put('wood', railPost)
    put('timber', tr(new THREE.BoxGeometry(0.14, 1.0, 0.14), MANSION_STAIR.lx1, F2 + 0.5, MANSION_STAIR.lz1 + 0.05))
    put('timber', tr(new THREE.BoxGeometry(0.14, 2.4, 0.14), sw.lx0 - 0.15, f1 + 1.2, MANSION_STAIR.lz1 + 0.05))
    put('wood', tr(new THREE.BoxGeometry(0.16, 1.0, sw.lz1 - sw.lz0), sw.lx0 - 0.07, F2 + 0.5, (sw.lz0 + sw.lz1) / 2))
    put('timber', tr(new THREE.BoxGeometry(0.26, 0.1, sw.lz1 - sw.lz0 + 0.1), sw.lx0 - 0.07, F2 + 1.02, (sw.lz0 + sw.lz1) / 2))

    put('wood', tr(new THREE.BoxGeometry(MANSION.w, 1.0, 0.16), 0, F2 + 0.5, MANSION_SLAB_LZ))
    put('timber', tr(new THREE.BoxGeometry(MANSION.w + 0.1, 0.1, 0.26), 0, F2 + 1.02, MANSION_SLAB_LZ))

    put('wood', tr(new THREE.BoxGeometry(3.6, 0.15, 1.5), 4.6, F2 - 0.075, -6.75))
    put('timber', tr(new THREE.BoxGeometry(0.16, MANSION_BALCONY.doorH, 0.26), MANSION_BALCONY.doorLX - MANSION_BALCONY.doorHalfW + 0.08, F2 + MANSION_BALCONY.doorH / 2, -hd - 0.02))
    put('timber', tr(new THREE.BoxGeometry(0.16, MANSION_BALCONY.doorH, 0.26), MANSION_BALCONY.doorLX + MANSION_BALCONY.doorHalfW - 0.08, F2 + MANSION_BALCONY.doorH / 2, -hd - 0.02))
    put('timber', tr(new THREE.BoxGeometry(MANSION_BALCONY.doorHalfW * 2 + 0.32, 0.18, 0.26), MANSION_BALCONY.doorLX, F2 + MANSION_BALCONY.doorH + 0.09, -hd - 0.02))
    put('wood', tr(new THREE.BoxGeometry(MANSION_BALCONY.doorHalfW * 2 - 0.1, 0.07, 0.6), MANSION_BALCONY.doorLX, F2 + 0.035, -hd))
    put('timber', tr(new THREE.BoxGeometry(3.6, 1.0, 0.14), 4.6, F2 + 0.5, -7.45))
    put('timber', tr(new THREE.BoxGeometry(0.14, 1.0, 1.5), 6.25, F2 + 0.5, -6.75))
    put('timber', tr(new THREE.BoxGeometry(0.14, 1.0, 1.5), 2.95, F2 + 0.5, -6.75))
    for (const px of [6.1, 3.1]) {
      put('wood', tr(new THREE.BoxGeometry(0.22, F2 + 1.0, 0.22), px, (F2 + 1.0) / 2, -7.3))
    }
    put('timber', tr(new THREE.BoxGeometry(2.1, 2.4, 0.1), 4.6, F2 + 1.15, -hd - 0.02))
    for (const px of [4.1, 5.1]) {
      const g = new THREE.PlaneGeometry(0.85, 2.1)
      g.translate(px, F2 + 1.15, -hd + 0.07)
      ;(buckets.glass ??= []).push(g)
      const mv = new THREE.BoxGeometry(0.05, 1.9, 0.05)
      mv.translate(px, F2 + 1.15, -hd + 0.07)
      put('timber', mv)
    }

    put('cream', tr(new THREE.CircleGeometry(1.0, 22).rotateX(-Math.PI / 2), -1, F2 + 0.015, -3))
    put('wood', tr(new THREE.BoxGeometry(1.7, 0.5, 2.1), 3.5, F2 + 0.25, -3.0))
    put('cream', tr(new THREE.BoxGeometry(1.55, 0.28, 1.95), 3.5, F2 + 0.55, -3.0))
    put('cream', tr(new THREE.BoxGeometry(0.7, 0.2, 0.5), 4.1, F2 + 0.72, -2.6))
    put('red', tr(new THREE.BoxGeometry(1.55, 0.1, 1.2), 3.5, F2 + 0.68, -3.3))
    put('wood', tr(new THREE.BoxGeometry(1.9, 0.08, 0.9), 5.9, F2 + 0.8, -5.3))
    for (const [cx, cz] of [
      [5.1, -5.6],
      [6.7, -5.6],
      [5.1, -5.0],
      [6.7, -5.0],
    ]) {
      put('wood', tr(new THREE.BoxGeometry(0.12, 0.8, 0.12), cx, F2 + 0.4, cz))
    }
    put('wood', tr(new THREE.CylinderGeometry(0.26, 0.3, 0.5, 8), 5.9, F2 + 0.25, -4.55))
    put('wood', tr(new THREE.BoxGeometry(0.6, 0.7, 0.08), 5.9, F2 + 0.75, -4.2))
    put('wood', tr(new THREE.BoxGeometry(0.5, 1.9, 1.8), -7.15, F2 + 0.95, -2.95))
    for (let row = 0; row < 3; row++) {
      for (let j = 0; j < 3; j++) {
        const cols = ['green', 'gold', 'red', 'blue']
        put(cols[(row + j) % 4], tr(new THREE.BoxGeometry(0.2, 0.32, 0.44), -7.1, F2 + 0.45 + row * 0.5, -3.6 + j * 0.55))
      }
    }
    put('timber', tr(new THREE.CylinderGeometry(0.04, 0.05, 1.3, 6), 2.2, F2 + 0.65, -2.6))
    put('gold', new THREE.SphereGeometry(0.14, 10, 8).translate(2.2, F2 + 1.35, -2.6))

    put('gold', tr(new THREE.TorusGeometry(0.8, 0.06, 8, 24).rotateX(Math.PI / 2), 0, 5.0, 0.5))
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4
      const cx = Math.cos(a) * 0.6
      const cz = 0.5 + Math.sin(a) * 0.6
      put('cream', tr(new THREE.CylinderGeometry(0.05, 0.05, 0.45, 6), cx, 5.25, cz))
      put('gold', new THREE.SphereGeometry(0.07, 8, 6).translate(cx, 5.52, cz))
    }

    const px0 = -1.8
    put('wood', tr(new THREE.BoxGeometry(4.2, 0.18, 2.3), px0, 0.03, hd + 1.05))
    put('stone', tr(new THREE.BoxGeometry(2.7, 0.1, 0.55), px0, 0.05, hd + 2.4))
    put('stone', tr(new THREE.BoxGeometry(2.3, 0.1, 0.5), px0, 0.15, hd + 2.28))
    for (const [cx, cz] of [
      [px0 - 1.7, hd + 0.35],
      [px0 + 1.7, hd + 0.35],
      [px0 - 1.7, hd + 1.75],
      [px0 + 1.7, hd + 1.75],
    ]) {
      put('cream', tr(new THREE.CylinderGeometry(0.13, 0.16, 3.1, 10), cx, 1.66, cz))
      put('gold', tr(new THREE.BoxGeometry(0.36, 0.1, 0.36), cx, 3.28, cz))
    }
    put('wood', tr(new THREE.BoxGeometry(4.1, 0.26, 2.25), px0, 3.42, hd + 1.05))
    put(
      'timber',
      tr(
        new THREE.BoxGeometry(MANSION_DOOR.openW + 0.36, 0.18, 0.16),
        (MANSION_DOOR.hingeLX * 2 + MANSION_DOOR.openW) / 2,
        MANSION_DOOR.lintelY,
        MANSION_DOOR.frameZ
      )
    )
    put('wood', tr(new THREE.BoxGeometry(4.3, 0.14, 2.4), px0, F2 + 0.07, hd + 1.0))
    put('wood', tr(new THREE.BoxGeometry(4.3, 0.1, 0.14), px0, F2 + 0.98, hd + 2.1))
    put('wood', tr(new THREE.BoxGeometry(4.3, 0.09, 0.12), px0, F2 + 0.34, hd + 2.12))
    for (let i = 0; i < 9; i++) {
      put('cream', tr(new THREE.BoxGeometry(0.09, 0.52, 0.09), px0 - 1.95 + i * 0.49, F2 + 0.66, hd + 2.08))
    }

    for (const sx of [-1, 1]) {
      for (let i = 0; i < 8; i++) {
        const y = 0.35 + i * 1.05
        const w = i % 2 === 0 ? 0.42 : 0.3
        put('cream', tr(new THREE.BoxGeometry(w, 0.62, 0.12), sx * (hw - 0.75), y, hd + 0.1))
      }
    }

    put('cream', tr(new THREE.BoxGeometry(MANSION.w + 0.16, 0.16, 0.1), 0, F2 - 0.18, hd + 0.07))
    put('cream', tr(new THREE.BoxGeometry(MANSION.w + 0.16, 0.16, 0.1), 0, F2 - 0.18, -hd - 0.07))
    put('cream', tr(new THREE.BoxGeometry(0.1, 0.16, MANSION.d + 0.16), -hw - 0.07, F2 - 0.18, 0))
    put('cream', tr(new THREE.BoxGeometry(0.1, 0.16, MANSION.d + 0.16), hw + 0.07, F2 - 0.18, 0))
    put('cream', tr(new THREE.BoxGeometry(MANSION.w + 0.5, 0.22, 0.16), 0, H - 0.14, hd + 0.1))
    put('cream', tr(new THREE.BoxGeometry(MANSION.w + 0.5, 0.22, 0.16), 0, H - 0.14, -hd - 0.1))
    put('cream', tr(new THREE.BoxGeometry(0.16, 0.22, MANSION.d + 0.5), -hw - 0.1, H - 0.14, 0))
    put('cream', tr(new THREE.BoxGeometry(0.16, 0.22, MANSION.d + 0.5), hw + 0.1, H - 0.14, 0))

    put('stone', tr(new THREE.BoxGeometry(0.72, 2.8, 0.72), -4.6, H + 1.15, -2.2))
    put('stone', tr(new THREE.BoxGeometry(0.95, 0.16, 0.95), -4.6, H + 2.6, -2.2))
    put('timber', tr(new THREE.BoxGeometry(0.5, 0.16, 0.5), -4.6, H + 2.72, -2.2))
    put('stone', tr(new THREE.BoxGeometry(0.72, 3.0, 0.72), 4.3, H + 1.3, -3.6))
    put('stone', tr(new THREE.BoxGeometry(0.95, 0.16, 0.95), 4.3, H + 2.85, -3.6))
    put('timber', tr(new THREE.BoxGeometry(0.5, 0.16, 0.5), 4.3, H + 2.97, -3.6))

    for (const sx of [-1, 1]) {
      put('plaster', tr(new THREE.BoxGeometry(0.95, 0.95, 1.2), sx * 2.9, H + 1.42, 2.4))
      put('roof', tr(new THREE.ConeGeometry(0.82, 0.55, 4).rotateY(Math.PI / 4), sx * 2.9, H + 2.16, 2.4))
    }

    const merged: { key: string; geo: THREE.BufferGeometry }[] = []
    for (const [k, geos] of Object.entries(buckets)) {
      merged.push({ key: k, geo: mergeGeometries(geos, false)! })
    }
    return merged
  }, [])

  const mats = useMemo(() => {
    const ramp = getToonRamp()
    const out: Record<string, THREE.MeshToonMaterial> = {}
    for (const k of Object.keys(COLORS)) {
      const m = new THREE.MeshToonMaterial({ color: COLORS[k], gradientMap: ramp })
      if (k === 'plaster') {
        m.normalMap = getNoiseNormalMap(3, 2.2)
        m.normalScale = new THREE.Vector2(0.45, 0.45)
      } else if (k === 'roof') {
        m.normalMap = getNoiseNormalMap(11, 11)
        m.normalScale = new THREE.Vector2(0.3, 0.3)
        m.side = THREE.DoubleSide
      }
      out[k] = m
    }
    return out
  }, [])
  const glass = useMemo(() => getGlassMaterial(), [])

  return (
    <group position={[MANSION.x, 0, MANSION.z]} rotation={[0, MANSION.yaw, 0]} userData={{ cullId: 'mansion' }}>
      {built.map(({ key, geo }) => (
        <mesh
          key={key}
          geometry={geo}
          material={key === 'glass' ? glass : mats[key]}
          castShadow={key !== 'glass'}
          receiveShadow={key !== 'glass'}
        />
      ))}
      <mesh geometry={doorGeo} position={[MANSION_DOOR.hingeLX, 0, MANSION_DOOR.leafZ]} castShadow>
        <meshToonMaterial color="#6b4a2f" gradientMap={getToonRamp()} />
      </mesh>
      <mesh
        geometry={balcDoorGeo}
        position={[MANSION_BALCONY.doorLX - MANSION_BALCONY.doorHalfW + 0.08, F2 + 0.03, -MANSION.d / 2 - 0.1]}
        castShadow
      >
        <meshToonMaterial color="#6b4a2f" gradientMap={getToonRamp()} />
      </mesh>
      <pointLight position={[0, 4.8, 1.5]} intensity={16} distance={12} decay={2} color="#ffd9a0" />
      <pointLight position={[0, F2 + 2.4, -3.9]} intensity={12} distance={9} decay={2} color="#ffe6c0" />
    </group>
  )
}

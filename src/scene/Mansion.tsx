import { useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { smoothstep } from '../lib/math'
import { MANSION, MANSION_SLAB_LZ, MANSION_STAIR } from '../lib/world'
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
}

function tr(g: THREE.BufferGeometry, x: number, y: number, z: number, ry = 0) {
  if (ry) g.rotateY(ry)
  g.translate(x, y, z)
  return g
}

const H = 9.3
const F2 = MANSION.floor2
const f1 = MANSION.floorY
const STAIR_MID_LX = (MANSION_STAIR.lx0 + MANSION_STAIR.lx1) / 2
const STAIR_MID_LZ = (MANSION_STAIR.lz0 + MANSION_STAIR.lz1) / 2
const STAIR_LEN = MANSION_STAIR.lx1 - MANSION_STAIR.lx0
const SLOPE = Math.atan2(F2 - f1, STAIR_LEN)

export function Mansion() {
  const doorGeo = useMemo(() => {
    const g = new THREE.BoxGeometry(1.76, 2.6, 0.1)
    g.translate(0.88, 0, 0)
    return g
  }, [])
  const built = useMemo(() => {
    const buckets: Record<string, THREE.BufferGeometry[]> = {}
    const put = (k: string, g: THREE.BufferGeometry) => {
      ;(buckets[k] ??= []).push(g)
    }
    const hw = MANSION.w / 2
    const hd = MANSION.d / 2

    put('wood', tr(new THREE.BoxGeometry(MANSION.w, 0.16, MANSION.d), 0, f1 - 0.08, 0))

    put('plaster', tr(new THREE.BoxGeometry(5.7, H, 0.2), -4.65, H / 2, hd))
    put('plaster', tr(new THREE.BoxGeometry(7.5, H, 0.2), 3.75, H / 2, hd))
    put('plaster', tr(new THREE.BoxGeometry(1.8, H - 2.6, 0.2), -0.9, 2.6 + (H - 2.6) / 2, hd))
    put('plaster', tr(new THREE.BoxGeometry(MANSION.w, F2, 0.2), 0, F2 / 2, -hd))
    put('plaster', tr(new THREE.BoxGeometry(6.55, H - F2, 0.2), -4.225, F2 + (H - F2) / 2, -hd))
    put('plaster', tr(new THREE.BoxGeometry(6.55, H - F2, 0.2), 4.225, F2 + (H - F2) / 2, -hd))
    put('plaster', tr(new THREE.BoxGeometry(1.9, H - F2 - 2.3, 0.2), 0, F2 + 2.3 + (H - F2 - 2.3) / 2, -hd))
    put('plaster', tr(new THREE.BoxGeometry(0.2, H, MANSION.d), -hw, H / 2, 0))
    put('plaster', tr(new THREE.BoxGeometry(0.2, H, MANSION.d), hw, H / 2, 0))

    for (const [px, pz] of [
      [-hw, -hd],
      [hw, -hd],
      [-hw, hd],
      [hw, hd],
      [-1.8, hd],
      [0, hd],
    ]) {
      put('timber', tr(new THREE.BoxGeometry(0.3, H + 0.05, 0.3), px, (H + 0.05) / 2, pz))
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
      g.translate(x + Math.sin(ry) * 0.06, y, z + Math.cos(ry) * 0.06)
      ;(buckets.glass ??= []).push(g)
    }
    addWin(-3.6, 2.0, hd + 0.1, 0, 1.1, 1.7)
    addWin(3.6, 2.0, hd + 0.1, 0, 1.1, 1.7)
    addWin(-3.6, 5.8, hd + 0.1, 0)
    addWin(3.6, 5.8, hd + 0.1, 0)
    addWin(-4.5, 5.2, -hd - 0.1, Math.PI)
    addWin(4.5, 5.2, -hd - 0.1, Math.PI)
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

    put('wood', tr(new THREE.BoxGeometry(14.8, 0.15, 4.1), 0, F2 - 0.075, -3.95))

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
    const rail = new THREE.BoxGeometry(rampLen + 0.4, 0.14, 0.09)
    rail.rotateZ(SLOPE)
    rail.translate(STAIR_MID_LX, (f1 + F2) / 2 + 1.15, MANSION_STAIR.lz1 + 0.13)
    put('timber', rail)
    const railPost = new THREE.BoxGeometry(STAIR_LEN, F2 - f1 + 1.0, 0.14)
    railPost.translate(STAIR_MID_LX, f1 + (F2 - f1 + 1.0) / 2, MANSION_STAIR.lz1 + 0.07)
    put('wood', railPost)

    put('wood', tr(new THREE.BoxGeometry(MANSION.w, 1.0, 0.16), 0, F2 + 0.5, MANSION_SLAB_LZ))
    put('timber', tr(new THREE.BoxGeometry(MANSION.w + 0.1, 0.1, 0.26), 0, F2 + 1.02, MANSION_SLAB_LZ))

    put('wood', tr(new THREE.BoxGeometry(3.6, 0.15, 1.5), 4.6, F2 - 0.075, -6.75))
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

    const merged: { key: string; geo: THREE.BufferGeometry }[] = []
    for (const [k, geos] of Object.entries(buckets)) {
      merged.push({ key: k, geo: mergeGeometries(geos, false)! })
    }
    return merged
  }, [])

  const ramp = getToonRamp()
  return (
    <group position={[MANSION.x, 0, MANSION.z]} rotation={[0, MANSION.yaw, 0]}>
      {built.map(({ key, geo }) =>
        key === 'glass' ? (
          <mesh key={key} geometry={geo}>
            <meshBasicMaterial color="#ffd27a" side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
        ) : (
          <mesh key={key} geometry={geo} castShadow receiveShadow>
            <meshToonMaterial
              color={COLORS[key]}
              gradientMap={ramp}
              side={key === 'roof' ? THREE.DoubleSide : THREE.FrontSide}
            />
          </mesh>
        )
      )}
      <mesh geometry={doorGeo} position={[-1.8, 1.3, MANSION.d / 2 + 0.12]} rotation-y={1.5} castShadow>
        <meshToonMaterial color="#6b4a2f" gradientMap={ramp} />
      </mesh>
      <pointLight position={[0, 4.8, 1.5]} intensity={16} distance={12} decay={2} color="#ffd9a0" />
      <pointLight position={[0, F2 + 2.4, -3.9]} intensity={12} distance={9} decay={2} color="#ffe6c0" />
    </group>
  )
}

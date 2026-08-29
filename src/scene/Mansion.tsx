import { useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { smoothstep } from '../lib/math'
import { MANSION } from '../lib/world'
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
}

function tr(g: THREE.BufferGeometry, x: number, y: number, z: number, ry = 0) {
  if (ry) g.rotateY(ry)
  g.translate(x, y, z)
  return g
}

const SLOPE = Math.atan2(MANSION.floor2 - MANSION.floorY, 3.8)

export function Mansion() {
  const doorGeo = useMemo(() => {
    const g = new THREE.BoxGeometry(1.3, 2.1, 0.08)
    g.translate(0.65, 0, 0)
    return g
  }, [])
  const built = useMemo(() => {
    const buckets: Record<string, THREE.BufferGeometry[]> = {}
    const put = (k: string, g: THREE.BufferGeometry) => {
      ;(buckets[k] ??= []).push(g)
    }
    const hw = MANSION.w / 2
    const hd = MANSION.d / 2
    const H = 6.2
    const F2 = MANSION.floor2
    const f1 = MANSION.floorY

    put('wood', tr(new THREE.BoxGeometry(MANSION.w, 0.16, MANSION.d), 0, f1 - 0.08, 0))
    put('plaster', tr(new THREE.BoxGeometry(4.3, H, 0.2), -2.85, H / 2, hd))
    put('plaster', tr(new THREE.BoxGeometry(4.3, H, 0.2), 2.85, H / 2, hd))
    put('plaster', tr(new THREE.BoxGeometry(MANSION.w, H, 0.2), 0, H / 2, -hd))
    put('plaster', tr(new THREE.BoxGeometry(0.2, H, MANSION.d), -hw, H / 2, 0))
    put('plaster', tr(new THREE.BoxGeometry(0.2, H, MANSION.d), hw, H / 2, 0))

    for (const [px, pz] of [
      [-hw, -hd],
      [hw, -hd],
      [-hw, hd],
      [hw, hd],
      [-0.78, hd],
      [0.78, hd],
    ]) {
      put('timber', tr(new THREE.BoxGeometry(0.26, H + 0.05, 0.26), px, H / 2, pz))
    }
    put('timber', tr(new THREE.BoxGeometry(MANSION.w + 0.3, 0.24, 0.28), 0, H, hd))
    put('timber', tr(new THREE.BoxGeometry(MANSION.w + 0.3, 0.24, 0.28), 0, H, -hd))
    put('timber', tr(new THREE.BoxGeometry(0.28, 0.24, MANSION.d + 0.3), -hw, H, 0))
    put('timber', tr(new THREE.BoxGeometry(0.28, 0.24, MANSION.d + 0.3), hw, H, 0))
    put('timber', tr(new THREE.BoxGeometry(MANSION.w + 0.3, 0.2, 0.24), 0, 3.06, hd))
    put('timber', tr(new THREE.BoxGeometry(MANSION.w + 0.3, 0.2, 0.24), 0, 3.06, -hd))
    put('timber', tr(new THREE.BoxGeometry(0.24, 0.2, MANSION.d + 0.3), -hw, 3.06, 0))
    put('timber', tr(new THREE.BoxGeometry(0.24, 0.2, MANSION.d + 0.3), hw, 3.06, 0))

    const addWin = (x: number, y: number, z: number, ry: number) => {
      const f = new THREE.BoxGeometry(0.8, 0.8, 0.08)
      f.rotateY(ry)
      f.translate(x, y, z)
      put('timber', f)
      const g = new THREE.PlaneGeometry(0.58, 0.58)
      g.rotateY(ry)
      g.translate(x + Math.sin(ry) * 0.06, y, z + Math.cos(ry) * 0.06)
      ;(buckets.glass ??= []).push(g)
    }
    addWin(-2.4, 1.7, hd + 0.1, 0)
    addWin(2.4, 1.7, hd + 0.1, 0)
    addWin(-2.5, 4.7, -hd - 0.1, Math.PI)
    addWin(2.5, 4.7, -hd - 0.1, Math.PI)
    addWin(-hw - 0.1, 4.7, -1.5, -Math.PI / 2)
    addWin(hw + 0.1, 1.7, 1.5, Math.PI / 2)
    addWin(hw + 0.1, 4.7, -1.5, Math.PI / 2)

    const roofPts: THREE.Vector2[] = []
    for (let i = 0; i <= 10; i++) {
      const t = i / 10
      const flare = 1 + 0.08 * smoothstep(0.65, 1, t)
      roofPts.push(new THREE.Vector2(t * 7.6 * flare, H + Math.pow(1 - t, 1.2) * 1.9))
    }
    put('roof', new THREE.LatheGeometry(roofPts, 4).rotateY(Math.PI / 4))

    put('blue', tr(new THREE.CircleGeometry(1.9, 24).rotateX(-Math.PI / 2), 0, f1 + 0.015, 1.2))
    put('gold', tr(new THREE.CircleGeometry(1.2, 24).rotateX(-Math.PI / 2), 0, f1 + 0.02, 1.2))
    put('wood', tr(new THREE.BoxGeometry(2.6, 0.09, 1.0), 0, f1 + 0.42, 1.5))
    for (const [cx, cz] of [
      [-1.2, 1.05],
      [1.2, 1.05],
      [-1.2, 1.95],
      [1.2, 1.95],
    ]) {
      put('wood', tr(new THREE.BoxGeometry(0.09, 0.38, 0.09), cx, f1 + 0.19, cz))
    }
    for (const [px, pz] of [
      [-1.5, 2.7],
      [1.5, 2.7],
      [0, 0.1],
    ]) {
      put('wood', tr(new THREE.CylinderGeometry(0.22, 0.26, 0.44, 8), px, f1 + 0.22, pz))
    }
    put('wood', tr(new THREE.BoxGeometry(0.55, 2.3, 2.9), -4.6, f1 + 1.15, -2))
    for (let row = 0; row < 4; row++) {
      for (let j = 0; j < 5; j++) {
        const cols = ['red', 'blue', 'gold', 'green']
        put(cols[(row + j) % 4], tr(new THREE.BoxGeometry(0.2, 0.34, 0.24), -4.28, f1 + 0.45 + row * 0.5, -3.05 + j * 0.52))
      }
    }
    for (const [px, pz] of [
      [4.3, 2.0],
      [-3.9, 3.2],
    ]) {
      put('wood', tr(new THREE.CylinderGeometry(0.24, 0.3, 0.4, 8), px, f1 + 0.2, pz))
      put('green', new THREE.SphereGeometry(0.34, 10, 8).translate(px, f1 + 0.72, pz))
    }

    put('wood', tr(new THREE.BoxGeometry(MANSION.w, 0.15, 3.6), 0, F2 - 0.075, -2.2))
    const under = new THREE.BoxGeometry(1.26, 0.12, 4.68)
    under.rotateX(SLOPE)
    under.translate(2.9, (f1 + F2) / 2 - 0.1, 1.6)
    put('wood', under)
    const STEPS = 9
    for (let k = 0; k < STEPS; k++) {
      const frac = (k + 0.5) / STEPS
      const lz = 3.5 - frac * 3.8
      const y = f1 + frac * (F2 - f1) - 0.03
      put('wood', tr(new THREE.BoxGeometry(1.3, 0.09, 0.4), 2.9, y, lz))
    }
    for (const rx of [2.25, 3.55]) {
      const g = new THREE.BoxGeometry(0.09, 0.14, 4.74)
      g.rotateX(SLOPE)
      g.translate(rx, (f1 + F2) / 2 + 0.12, 1.6)
      put('timber', g)
    }

    put('cream', tr(new THREE.CircleGeometry(1.6, 24).rotateX(-Math.PI / 2), 0, F2 + 0.015, -2.2))
    put('wood', tr(new THREE.BoxGeometry(1.7, 0.34, 2.4), -2.8, F2 + 0.17, -2.6))
    put('cream', tr(new THREE.BoxGeometry(1.55, 0.16, 2.25), -2.8, F2 + 0.42, -2.6))
    put('cream', tr(new THREE.BoxGeometry(0.95, 0.14, 0.5), -2.8, F2 + 0.56, -3.45))
    put('gold', tr(new THREE.BoxGeometry(1.6, 0.1, 1.3), -2.8, F2 + 0.48, -2.1))
    put('wood', tr(new THREE.BoxGeometry(1.8, 0.08, 0.8), 2.9, F2 + 0.74, -2.9))
    for (const [lx, lz] of [
      [2.15, -3.2],
      [3.65, -3.2],
      [2.15, -2.6],
      [3.65, -2.6],
    ]) {
      put('wood', tr(new THREE.BoxGeometry(0.08, 0.7, 0.08), lx, F2 + 0.35, lz))
    }
    put('wood', tr(new THREE.BoxGeometry(0.5, 0.9, 0.5), 2.9, F2 + 0.45, -1.9))
    put('wood', tr(new THREE.BoxGeometry(0.55, 2.0, 2.4), -4.6, F2 + 1.0, 0.8))
    for (let row = 0; row < 3; row++) {
      for (let j = 0; j < 4; j++) {
        const cols = ['green', 'gold', 'red', 'blue']
        put(cols[(row + j) % 4], tr(new THREE.BoxGeometry(0.2, 0.32, 0.24), -4.28, F2 + 0.35 + row * 0.48, -0.15 + j * 0.5))
      }
    }
    put('timber', tr(new THREE.CylinderGeometry(0.04, 0.05, 1.3, 6), 4.3, F2 + 0.65, -3.3))
    put('gold', new THREE.SphereGeometry(0.14, 10, 8).translate(4.3, F2 + 1.35, -3.3))

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
      <mesh geometry={doorGeo} position={[-0.7, 1.05, MANSION.d / 2 + 0.14]} rotation-y={-1.9} castShadow>
        <meshToonMaterial color="#6b4a2f" gradientMap={ramp} />
      </mesh>
      <pointLight position={[4.3, 3.9, -3.3]} intensity={16} distance={8} decay={2} color="#ffd9a0" />
      <pointLight position={[0, 4.8, 0]} intensity={10} distance={10} decay={2} color="#ffe6c0" />
    </group>
  )
}

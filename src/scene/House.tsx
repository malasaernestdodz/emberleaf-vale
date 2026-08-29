import { useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { smoothstep } from '../lib/math'
import { HOUSE } from '../lib/world'
import { getToonRamp } from './toonRamp'

const COLORS: Record<string, string> = {
  plaster: '#9b8fc4',
  timber: '#4a3a2c',
  wood: '#7a5b3a',
  roof: '#b5432e',
  stone: '#8d8578',
  cream: '#efe6d0',
  red: '#b8452f',
  gold: '#d8b56a',
  blue: '#4a7a9e',
  green: '#7a9e6a',
}

function tr(g: THREE.BufferGeometry, x: number, y: number, z: number, ry = 0) {
  if (ry) g.rotateY(ry)
  g.translate(x, y, z)
  return g
}

export function House() {
  const built = useMemo(() => {
    const buckets: Record<string, THREE.BufferGeometry[]> = {}
    const put = (k: string, g: THREE.BufferGeometry) => {
      ;(buckets[k] ??= []).push(g)
    }
    const hw = HOUSE.w / 2
    const hd = HOUSE.d / 2
    const H = HOUSE.h
    const dw = HOUSE.doorW / 2
    const lx = HOUSE.doorLX

    const leftSegW = lx - dw + hw
    const rightSegW = hw - (lx + dw)
    put('plaster', tr(new THREE.BoxGeometry(leftSegW, H, 0.18), -hw + leftSegW / 2, H / 2, hd))
    put('plaster', tr(new THREE.BoxGeometry(rightSegW, H, 0.18), lx + dw + rightSegW / 2, H / 2, hd))
    put('plaster', tr(new THREE.BoxGeometry(HOUSE.w, H, 0.18), 0, H / 2, -hd))
    put('plaster', tr(new THREE.BoxGeometry(0.18, H, HOUSE.d), -hw, H / 2, 0))
    put('plaster', tr(new THREE.BoxGeometry(0.18, H, HOUSE.d), hw, H / 2, 0))
    put('plaster', tr(new THREE.BoxGeometry(HOUSE.doorW, 0.8, 0.18), lx, 2.5, hd))

    const posts: [number, number][] = [
      [-hw, -hd],
      [hw, -hd],
      [-hw, hd],
      [hw, hd],
      [lx - dw - 0.1, hd],
      [lx + dw + 0.1, hd],
    ]
    for (const [px, pz] of posts) put('timber', tr(new THREE.BoxGeometry(0.24, H + 0.05, 0.24), px, H / 2, pz))
    put('timber', tr(new THREE.BoxGeometry(HOUSE.w + 0.3, 0.22, 0.26), 0, H, hd))
    put('timber', tr(new THREE.BoxGeometry(HOUSE.w + 0.3, 0.22, 0.26), 0, H, -hd))
    put('timber', tr(new THREE.BoxGeometry(0.26, 0.22, HOUSE.d + 0.3), -hw, H, 0))
    put('timber', tr(new THREE.BoxGeometry(0.26, 0.22, HOUSE.d + 0.3), hw, H, 0))

    const addWin = (x: number, y: number, z: number, ry: number) => {
      const f = new THREE.BoxGeometry(0.74, 0.74, 0.07)
      f.rotateY(ry)
      f.translate(x, y, z)
      put('timber', f)
      const g = new THREE.PlaneGeometry(0.52, 0.52)
      g.rotateY(ry)
      g.translate(x + Math.sin(ry) * 0.05, y, z + Math.cos(ry) * 0.05)
      ;(buckets.glass ??= []).push(g)
    }
    addWin(-1.9, 1.6, hd + 0.09, 0)
    addWin(2.9, 1.6, hd + 0.09, 0)
    addWin(-hw - 0.09, 1.6, 0.5, -Math.PI / 2)
    addWin(hw + 0.09, 1.6, -0.6, Math.PI / 2)

    const roofPts: THREE.Vector2[] = []
    for (let i = 0; i <= 10; i++) {
      const t = i / 10
      const flare = 1 + 0.1 * smoothstep(0.65, 1, t)
      roofPts.push(new THREE.Vector2(t * 5.6 * flare, 3.0 + Math.pow(1 - t, 1.35) * 2.6))
    }
    put('roof', new THREE.LatheGeometry(roofPts, 24))
    put('stone', tr(new THREE.BoxGeometry(0.55, 1.7, 0.55), -1.7, 5.0, -1.2))
    put('stone', tr(new THREE.BoxGeometry(0.75, 0.18, 0.75), -1.7, 5.95, -1.2))

    put('wood', tr(new THREE.BoxGeometry(HOUSE.w, 0.18, HOUSE.d), 0, 0.09, 0))
    put('timber', tr(new THREE.BoxGeometry(HOUSE.w + 0.24, 0.12, HOUSE.d + 0.24), 0, 2.84, 0))
    const doorGeo = new THREE.BoxGeometry(1.1, 2.0, 0.07)
    doorGeo.translate(0.55, 0, 0)

    put('red', tr(new THREE.CircleGeometry(1.6, 24).rotateX(-Math.PI / 2), 0.3, 0.19, 0.4))
    put('gold', tr(new THREE.CircleGeometry(1.05, 24).rotateX(-Math.PI / 2), 0.3, 0.195, 0.4))
    put('wood', tr(new THREE.BoxGeometry(1.5, 0.08, 0.9), 1.9, 0.52, 0.8))
    for (const [cx2, cz2] of [
      [1.9 - 0.65, 0.8 - 0.35],
      [1.9 + 0.65, 0.8 - 0.35],
      [1.9 - 0.65, 0.8 + 0.35],
      [1.9 + 0.65, 0.8 + 0.35],
    ]) {
      put('wood', tr(new THREE.BoxGeometry(0.08, 0.48, 0.08), cx2, 0.24, cz2))
    }
    put('red', new THREE.SphereGeometry(0.16, 12, 10).translate(1.9, 0.74, 0.8))
    const spout = new THREE.CylinderGeometry(0.03, 0.03, 0.18, 6)
    spout.rotateZ(1.1)
    spout.translate(2.12, 0.78, 0.8)
    put('red', spout)
    put('blue', tr(new THREE.BoxGeometry(0.22, 0.05, 0.16), 2.35, 0.585, 0.72, 0.5))
    put('wood', tr(new THREE.CylinderGeometry(0.22, 0.26, 0.42, 8), 2.6, 0.21, 0.2))
    put('wood', tr(new THREE.CylinderGeometry(0.22, 0.26, 0.42, 8), 2.5, 0.21, 1.4))

    put('wood', tr(new THREE.BoxGeometry(1.1, 0.32, 2.1), -2.4, 0.16, -1.5))
    put('cream', tr(new THREE.BoxGeometry(1.0, 0.16, 2.0), -2.4, 0.4, -1.5))
    put('cream', tr(new THREE.BoxGeometry(0.7, 0.12, 0.4), -2.4, 0.52, -2.1))
    put('green', tr(new THREE.BoxGeometry(1.02, 0.1, 1.1), -2.4, 0.46, -0.9))

    put('wood', tr(new THREE.BoxGeometry(0.42, 1.9, 1.5), 3.05, 0.95, -1.0))
    const bookCols = ['red', 'blue', 'gold', 'green']
    for (let row = 0; row < 3; row++) {
      for (let j = 0; j < 4; j++) {
        const g = new THREE.BoxGeometry(0.18, 0.4, 0.26)
        g.translate(2.83, 0.5 + row * 0.6, -1.55 + j * 0.36)
        put(bookCols[(row + j) % 4], g)
      }
    }

    const merged: { key: string; geo: THREE.BufferGeometry }[] = []
    for (const [k, geos] of Object.entries(buckets)) {
      merged.push({ key: k, geo: mergeGeometries(geos, false)! })
    }
    return { merged, doorGeo }
  }, [])

  const ramp = getToonRamp()
  return (
    <group position={[HOUSE.x, 0, HOUSE.z]} rotation={[0, HOUSE.yaw, 0]}>
      {built.merged.map(({ key, geo }) =>
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
      <mesh geometry={built.doorGeo} position={[-0.05, 1.0, HOUSE.d / 2 + 0.12]} rotation-y={-1.9} castShadow>
        <meshToonMaterial color="#6b4a2f" gradientMap={ramp} />
      </mesh>
      <mesh position={[-1.6, 2.25, -1.3]}>
        <sphereGeometry args={[0.13, 10, 8]} />
        <meshBasicMaterial color="#ffc46a" toneMapped={false} />
      </mesh>
      <pointLight position={[-1.6, 2.15, -1.3]} intensity={25} distance={7.5} decay={2} color="#ffb45e" />
    </group>
  )
}

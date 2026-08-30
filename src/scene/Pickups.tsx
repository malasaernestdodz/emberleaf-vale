import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { pickups } from '../lib/items'
import { mulberry32 } from '../lib/math'
import { groundHeight, game } from '../lib/world'
import { getToonRamp } from './toonRamp'

const MAX = 90

function paint(g: THREE.BufferGeometry, r: number, gr: number, b: number) {
  const ng = g.toNonIndexed()
  const pos = ng.attributes.position as THREE.BufferAttribute
  const col = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) {
    col[i * 3] = r
    col[i * 3 + 1] = gr
    col[i * 3 + 2] = b
  }
  ng.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return ng
}

function merge(parts: THREE.BufferGeometry[]) {
  const g = mergeGeometries(parts)
  if (!g) throw new Error('merge failed')
  return g
}

const rockGeom = merge([
  paint(new THREE.DodecahedronGeometry(0.14, 0).scale(1, 0.78, 0.92), 0.6, 0.585, 0.55),
  paint(new THREE.DodecahedronGeometry(0.05, 0).translate(0.1, 0.09, 0.04), 0.52, 0.56, 0.42),
])

const flowerGeom = merge([
  paint(new THREE.CylinderGeometry(0.012, 0.016, 0.18, 5).translate(0, 0.09, 0), 0.365, 0.56, 0.227),
  paint(new THREE.SphereGeometry(0.035, 6, 5).scale(1.4, 0.4, 0.7).translate(0.055, 0.07, 0), 0.365, 0.56, 0.227),
  paint(new THREE.SphereGeometry(0.048, 6, 5).translate(0, 0.2, 0.06), 0.941, 0.66, 0.753),
  paint(new THREE.SphereGeometry(0.048, 6, 5).translate(0, 0.2, -0.06), 0.941, 0.66, 0.753),
  paint(new THREE.SphereGeometry(0.048, 6, 5).translate(0.06, 0.2, 0), 0.941, 0.66, 0.753),
  paint(new THREE.SphereGeometry(0.048, 6, 5).translate(-0.06, 0.2, 0), 0.941, 0.66, 0.753),
  paint(new THREE.SphereGeometry(0.048, 6, 5).translate(0.042, 0.245, 0.042), 0.941, 0.66, 0.753),
  paint(new THREE.SphereGeometry(0.048, 6, 5).translate(-0.042, 0.245, -0.042), 0.941, 0.66, 0.753),
  paint(new THREE.SphereGeometry(0.034, 6, 5).translate(0, 0.2, 0), 1, 0.824, 0.478),
])

const woodGeom = merge([
  paint(new THREE.CylinderGeometry(0.05, 0.06, 0.42, 7).rotateZ(Math.PI / 2).translate(0, 0.062, 0), 0.541, 0.416, 0.282),
  paint(new THREE.CylinderGeometry(0.058, 0.058, 0.016, 7).rotateZ(Math.PI / 2).translate(-0.21, 0.062, 0), 0.788, 0.69, 0.541),
  paint(new THREE.CylinderGeometry(0.058, 0.058, 0.016, 7).rotateZ(Math.PI / 2).translate(0.21, 0.062, 0), 0.788, 0.69, 0.541),
])

const fishGeom = merge([
  paint(new THREE.SphereGeometry(0.095, 10, 8).scale(1.5, 1, 0.55).translate(0, 0.09, 0), 0.373, 0.722, 0.788),
  paint(new THREE.ConeGeometry(0.055, 0.13, 5).rotateZ(Math.PI / 2).translate(-0.17, 0.09, 0), 0.29, 0.639, 0.706),
  paint(new THREE.ConeGeometry(0.032, 0.06, 4).translate(0, 0.19, 0), 0.29, 0.639, 0.706),
  paint(new THREE.SphereGeometry(0.016, 6, 5).translate(0.1, 0.11, 0.045), 0.133, 0.204, 0.235),
  paint(new THREE.SphereGeometry(0.016, 6, 5).translate(0.1, 0.11, -0.045), 0.133, 0.204, 0.235),
])

const foodGeom = merge([
  paint(new THREE.CylinderGeometry(0.06, 0.075, 0.09, 9).translate(0, 0.045, 0), 0.788, 0.561, 0.306),
  paint(new THREE.SphereGeometry(0.075, 9, 7).scale(1, 0.7, 1).translate(0, 0.1, 0), 0.878, 0.667, 0.384),
  paint(new THREE.SphereGeometry(0.009, 5, 4).translate(0.03, 0.155, 0.02), 0.961, 0.89, 0.753),
  paint(new THREE.SphereGeometry(0.009, 5, 4).translate(-0.025, 0.16, -0.015), 0.961, 0.89, 0.753),
  paint(new THREE.SphereGeometry(0.009, 5, 4).translate(0.005, 0.158, -0.045), 0.961, 0.89, 0.753),
])

const gelGeom = merge([
  paint(new THREE.SphereGeometry(0.1, 10, 8).scale(1, 0.85, 1).translate(0, 0.085, 0), 0.525, 0.878, 0.541),
  paint(new THREE.SphereGeometry(0.022, 6, 5).translate(0.035, 0.145, 0.035), 0.918, 1, 0.918),
])

export function Pickups() {
  const meshes = useRef<Record<string, THREE.InstancedMesh>>({
    rock: null!,
    flower: null!,
    wood: null!,
    fish: null!,
    food: null!,
    gel: null!,
  })
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const ramp = getToonRamp()

  useEffect(() => {
    const c = new THREE.Color()
    const rand = mulberry32(1201)
    const rocks = meshes.current.rock
    for (let i = 0; i < MAX; i++) {
      const v = 0.82 + rand() * 0.36
      c.setRGB(v, v * 0.985, v * 0.94)
      rocks.setColorAt(i, c)
    }
    const woods = meshes.current.wood
    for (let i = 0; i < MAX; i++) {
      const v = 0.85 + rand() * 0.3
      c.setRGB(v, v, v)
      woods.setColorAt(i, c)
    }
    if (rocks.instanceColor) rocks.instanceColor.needsUpdate = true
    if (woods.instanceColor) woods.instanceColor.needsUpdate = true
  }, [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    for (const p of pickups) {
      if (!p.alive || !p.flying) continue
      p.vy -= 16 * dt
      p.x += p.vx * dt
      p.z += p.vz * dt
      p.y += p.vy * dt
      const gh = groundHeight(p.x, p.z, p.y) + 0.12
      if (p.y <= gh) {
        p.y = gh
        p.flying = false
        p.vx = 0
        p.vz = 0
        p.vy = 0
      }
    }
    const lists: Record<string, typeof pickups> = { rock: [], flower: [], wood: [], fish: [], food: [], gel: [] }
    for (const p of pickups) {
      if (p.alive) lists[p.type].push(p)
    }
    const light = (t: string) => t === 'flower' || t === 'gel' || t === 'fish'
    for (const t of ['rock', 'flower', 'wood', 'fish', 'food', 'gel'] as const) {
      const mesh = meshes.current[t]
      if (!mesh) continue
      let n = 0
      for (const p of lists[t]) {
        if (n >= MAX) break
        const bob = !p.flying && light(t) ? Math.sin(game.time * 2.2 + p.id * 1.3) * 0.02 : 0
        const idleSpin = !p.flying && light(t) ? game.time * 0.5 : 0
        dummy.position.set(p.x, p.y + bob, p.z)
        dummy.rotation.set(p.flying ? p.id + performance.now() * 0.004 : 0, p.id * 1.7 + idleSpin, 0)
        dummy.updateMatrix()
        mesh.setMatrixAt(n, dummy.matrix)
        n++
      }
      mesh.count = n
      mesh.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <>
      {(
        [
          ['rock', rockGeom, true],
          ['flower', flowerGeom, false],
          ['wood', woodGeom, true],
          ['fish', fishGeom, false],
          ['food', foodGeom, true],
          ['gel', gelGeom, false],
        ] as const
      ).map(([t, geom, shadow]) => (
        <instancedMesh
          key={t}
          ref={(m: THREE.InstancedMesh | null) => {
            if (m) meshes.current[t] = m
          }}
          args={[geom, undefined, MAX]}
          frustumCulled={false}
          castShadow={shadow}
        >
          <meshToonMaterial vertexColors gradientMap={ramp} transparent={t === 'gel'} opacity={t === 'gel' ? 0.92 : 1} />
        </instancedMesh>
      ))}
    </>
  )
}

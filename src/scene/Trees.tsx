import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { hash2, lerp, mulberry32, smoothstep } from '../lib/math'
import { playSfx } from '../lib/audio'
import { fallAngle, growScale, restBounce, treeLife, updateTrees } from '../lib/trees'
import { game, ROCKS, TREES } from '../lib/world'
import { endSys } from '../lib/trace'
import { getToonRamp } from './toonRamp'

function colorize(g: THREE.BufferGeometry, c: [number, number, number], jitter: number, seed: number) {
  const pos = g.attributes.position as THREE.BufferAttribute
  const col = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) {
    const h = hash2(pos.getX(i) * 3.17 + seed, pos.getY(i) * 2.71 + pos.getZ(i) * 1.61)
    const j = 1 + (h - 0.5) * 2 * jitter
    col[i * 3] = c[0] * j
    col[i * 3 + 1] = c[1] * j
    col[i * 3 + 2] = c[2] * j
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
}

function deform(g: THREE.BufferGeometry, amp: number, seed: number) {
  const pos = g.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const h = hash2(x * 5.13 + y * 1.7 + seed, z * 4.31 + y * 2.3)
    const k = 1 + (h - 0.5) * 2 * amp
    pos.setXYZ(i, x * k, y * k, z * k)
  }
}

function treeVariant(seed: number, palette: [number, number, number]) {
  const rng = mulberry32(seed)
  const parts: THREE.BufferGeometry[] = []
  const trunkH = 1.6 + rng() * 0.8
  const trunk = new THREE.CylinderGeometry(0.16, 0.34, trunkH, 6).toNonIndexed()
  trunk.translate(0, trunkH / 2, 0)
  colorize(trunk, [0.36, 0.26, 0.18], 0.08, seed)
  parts.push(trunk)
  const blobs = 4 + Math.floor(rng() * 2)
  for (let i = 0; i < blobs; i++) {
    const r = 0.9 + rng() * 0.7
    const blob = new THREE.IcosahedronGeometry(r, 1)
    deform(blob, 0.18, seed + i * 17)
    blob.scale(1, 0.72, 1)
    const a = (i / blobs) * Math.PI * 2 + rng()
    const rad = rng() * 0.7
    blob.translate(Math.cos(a) * rad, trunkH + 0.35 + rng() * 0.7, Math.sin(a) * rad)
    colorize(blob, palette, 0.12, seed + i * 31)
    parts.push(blob)
  }
  return mergeGeometries(parts, false)!
}

function rockGeo(seed: number) {
  const g = new THREE.IcosahedronGeometry(1, 1)
  deform(g, 0.25, seed)
  g.computeVertexNormals()
  const pos = g.attributes.position as THREE.BufferAttribute
  const nrm = g.attributes.normal as THREE.BufferAttribute
  const col = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) {
    const mossy = smoothstep(0.55, 0.85, nrm.getY(i))
    const j = 0.9 + hash2(pos.getX(i) * 7.7 + seed, pos.getZ(i) * 3.3) * 0.2
    col[i * 3] = lerp(0.52, 0.36, mossy) * j
    col[i * 3 + 1] = lerp(0.52, 0.5, mossy) * j
    col[i * 3 + 2] = lerp(0.5, 0.3, mossy) * j
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return g
}

export function Trees() {
  const { variants, rockMerged } = useMemo(() => {
    const vars = [
      treeVariant(11, [0.83, 0.52, 0.16]),
      treeVariant(23, [0.9, 0.68, 0.22]),
      treeVariant(37, [0.58, 0.7, 0.24]),
    ]
    const rockParts: THREE.BufferGeometry[] = []
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    for (let i = 0; i < ROCKS.length; i++) {
      const k = ROCKS[i]
      e.set(0, k.yaw, 0)
      q.setFromEuler(e)
      m.compose(new THREE.Vector3(k.x, k.y, k.z), q, new THREE.Vector3(k.s, k.s * k.sq, k.s))
      const g = rockGeo(1000 + i * 13)
      g.applyMatrix4(m)
      rockParts.push(g)
    }
    return { variants: vars, rockMerged: mergeGeometries(rockParts, false)! }
  }, [])

  const material = useMemo(
    () => new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: getToonRamp() }),
    []
  )
  const groups = useRef<(THREE.Group | null)[]>([])
  const prevPhase = useRef<string[]>(TREES.map(() => 'up'))

  useFrame((_, delta) => {
    const t0 = performance.now()
    if (game.paused) return
    updateTrees(Math.min(delta, 0.05))
    for (let i = 0; i < TREES.length; i++) {
      const t = TREES[i]
      const life = treeLife[i]
      const g = groups.current[i]
      if (!g) continue
      if (life.phase === 'up') {
        g.rotation.set(0, t.yaw, Math.sin(game.time * 46 + i * 2.3) * 0.05 * life.shake)
        g.scale.setScalar(t.s)
      } else if (life.phase === 'fall') {
        g.rotation.order = 'YXZ'
        g.rotation.set(fallAngle(life.t), life.dir, 0)
      } else if (life.phase === 'down') {
        g.rotation.set(fallAngle(1) + restBounce(life.t), life.dir, 0)
      } else {
        g.rotation.order = 'XYZ'
        g.rotation.set(0, t.yaw, 0)
        g.scale.setScalar(t.s * growScale(life.t))
      }
      if (prevPhase.current[i] !== life.phase) {
        if (life.phase === 'fall') playSfx('creak')
        else if (life.phase === 'down') playSfx('crash')
        prevPhase.current[i] = life.phase
      }
    }
    endSys('trees', t0)
  })

  return (
    <group>
      {TREES.map((t, i) => (
        <group
          key={i}
          ref={(el) => {
            groups.current[i] = el
          }}
          position={[t.x, t.y, t.z]}
        >
          <mesh geometry={variants[t.variant]} material={material} castShadow receiveShadow />
        </group>
      ))}
      <mesh geometry={rockMerged} material={material} castShadow receiveShadow />
    </group>
  )
}

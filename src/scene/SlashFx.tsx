import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FADE_TIME, SLASH_TIME, slash } from '../lib/slash'
import { slime } from '../lib/slime'
import { endSys } from '../lib/trace'
import { game } from '../lib/world'

const SPAN = (150 * Math.PI) / 180
const WISP_SPAN = (120 * Math.PI) / 180
const RING_LIFE = 0.18

function buildFan(inner: number, outer: number, span: number, segments: number, alphaScale: number) {
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array((segments + 1) * 2 * 3)
  const col = new Float32Array((segments + 1) * 2 * 4)
  const idx: number[] = []
  const cBody = new THREE.Color('#2fa8ff')
  const cEdge = new THREE.Color('#9ff3ff')
  const c = new THREE.Color()
  for (let s = 0; s <= segments; s++) {
    const a = s / segments
    const theta = -span / 2 + a * span
    const x = Math.sin(theta)
    const z = Math.cos(theta)
    const fade = 0.12 + 0.83 * Math.pow(a, 1.4)
    c.copy(cBody).lerp(cEdge, Math.min(1, a * 3))
    pos.set([x * inner, 0, z * inner], s * 6)
    pos.set([x * outer, 0, z * outer], s * 6 + 3)
    col.set([c.r, c.g, c.b, 0.55 * alphaScale * fade], s * 8)
    col.set([c.r, c.g, c.b, 0.95 * alphaScale * fade], s * 8 + 4)
  }
  for (let s = 0; s < segments; s++) {
    const i0 = s * 2
    idx.push(i0, i0 + 1, i0 + 2, i0 + 2, i0 + 1, i0 + 3)
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(col, 4))
  geo.setIndex(idx)
  return geo
}

function buildStageMesh(
  name: string,
  inner: number,
  outer: number,
  span: number,
  alphaScale: number
) {
  const mat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const mesh = new THREE.Mesh(buildFan(inner, outer, span, 16, alphaScale), mat)
  mesh.name = name
  mesh.visible = false
  return mesh
}

export function SlashFx() {
  const g0 = useRef<THREE.Group>(null!)
  const g1 = useRef<THREE.Group>(null!)
  const ring = useRef<THREE.Mesh>(null!)
  const ringT = useRef(10)
  const lastHits = useRef(slime.hits)
  const stage0 = useMemo(
    () => [
      buildStageMesh('slash-arc-0', 0.45, 1.25, SPAN, 1),
      buildStageMesh('slash-wisp-0', 0.6, 1.1, WISP_SPAN, 0.5),
    ],
    []
  )
  const stage1 = useMemo(
    () => [
      buildStageMesh('slash-arc-1', 0.45, 1.25, SPAN, 1),
      buildStageMesh('slash-wisp-1', 0.6, 1.1, WISP_SPAN, 0.5),
    ],
    []
  )

  useFrame((_, delta) => {
    const t0 = performance.now()
    const dt = Math.min(delta, 0.05)
    const groups = [g0.current, g1.current]
    for (let i = 0; i < 2; i++) {
      const g = groups[i]
      const on = slash.active && slash.stage === i
      g.visible = on
      const arc = g.children[0] as THREE.Mesh
      const wisp = g.children[1] as THREE.Mesh
      arc.visible = on
      wisp.visible = on
      if (on) {
        g.position.set(game.x, game.y + 0.82, game.z)
        g.rotation.y = game.heading + (i === 1 ? 0.18 : 0)
        const fade =
          slash.t < SLASH_TIME ? 1 : Math.max(0, 1 - (slash.t - SLASH_TIME) / FADE_TIME)
        const sweep = 1 - Math.min(1, slash.t / SLASH_TIME)
        arc.scale.x = slash.dir
        arc.rotation.y = slash.dir * sweep * 0.5
        ;(arc.material as THREE.MeshBasicMaterial).opacity = fade
        wisp.scale.x = -slash.dir
        wisp.rotation.y = slash.dir * sweep * 0.7
        ;(wisp.material as THREE.MeshBasicMaterial).opacity = fade * 0.9
      }
    }
    if (slime.hits !== lastHits.current) {
      lastHits.current = slime.hits
      ringT.current = 0
      ring.current.visible = true
    }
    if (ring.current.visible) {
      ringT.current += dt
      if (ringT.current >= RING_LIFE) {
        ring.current.visible = false
      } else {
        const k = ringT.current / RING_LIFE
        ring.current.position.set(slime.x, slime.y + 0.45, slime.z)
        ring.current.scale.setScalar(1 + k * 1.1)
        ;(ring.current.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - k)
      }
    }
    endSys('slashfx', t0)
  })

  return (
    <group userData={{ excludeRaycast: true }}>
      <group ref={g0}>
        <primitive object={stage0[0]} />
        <primitive object={stage0[1]} />
      </group>
      <group ref={g1}>
        <primitive object={stage1[0]} />
        <primitive object={stage1[1]} />
      </group>
      <mesh
        ref={ring}
        name="slash-hit-ring"
        visible={false}
        rotation-x={-Math.PI / 2}
        renderOrder={41}
      >
        <ringGeometry args={[0.34, 0.46, 24]} />
        <meshBasicMaterial
          color="#bff6ff"
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

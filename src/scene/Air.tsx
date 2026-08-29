import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry32 } from '../lib/math'
import { terrainHeight } from '../lib/world'

const LEAF_N = 150

export function Air() {
  const leaves = useRef<THREE.InstancedMesh>(null!)
  const rngRespawn = useRef(mulberry32(12345))
  const data = useMemo(() => {
    const rng = mulberry32(99)
    const arr: { x: number; z: number; y: number; sp: number; ph: number; rs: number }[] = []
    for (let i = 0; i < LEAF_N; i++) {
      arr.push({
        x: (rng() - 0.5) * 100,
        z: (rng() - 0.5) * 100,
        y: 2 + rng() * 6,
        sp: 0.35 + rng() * 0.4,
        ph: rng() * Math.PI * 2,
        rs: 0.5 + rng() * 1.5,
      })
    }
    return arr
  }, [])
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useEffect(() => {
    const c = new THREE.Color()
    const pal = ['#e8862a', '#e6b23a', '#d95f2a', '#f0c95a']
    for (let i = 0; i < LEAF_N; i++) {
      c.set(pal[i % pal.length])
      leaves.current.setColorAt(i, c)
    }
    if (leaves.current.instanceColor) leaves.current.instanceColor.needsUpdate = true
  }, [])

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = clock.elapsedTime
    for (let i = 0; i < LEAF_N; i++) {
      const L = data[i]
      L.y -= L.sp * dt
      L.x += Math.sin(t * 1.2 + L.ph) * 0.6 * dt
      L.z += Math.cos(t * 0.9 + L.ph) * 0.45 * dt
      if (L.y < terrainHeight(L.x, L.z) + 0.05) {
        const r = rngRespawn.current
        L.y = 5 + r() * 3
        L.x = (r() - 0.5) * 100
        L.z = (r() - 0.5) * 100
      }
      dummy.position.set(L.x, L.y, L.z)
      dummy.rotation.set(t * L.rs + L.ph, t * L.rs * 0.7, L.ph)
      dummy.updateMatrix()
      leaves.current.setMatrixAt(i, dummy.matrix)
    }
    leaves.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={leaves} args={[undefined, undefined, LEAF_N]} frustumCulled={false}>
      <planeGeometry args={[0.14, 0.14]} />
      <meshBasicMaterial side={THREE.DoubleSide} />
    </instancedMesh>
  )
}

const wingL = new THREE.PlaneGeometry(0.16, 0.11)
wingL.translate(0.08, 0, 0)
const wingR = new THREE.PlaneGeometry(0.16, 0.11)
wingR.translate(-0.08, 0, 0)

const B_N = 6

export function Butterflies() {
  const groups = useRef<(THREE.Group | null)[]>([])
  const data = useMemo(() => {
    const rng = mulberry32(555)
    return Array.from({ length: B_N }, (_, i) => ({
      cx: (rng() - 0.5) * 60,
      cz: (rng() - 0.5) * 60,
      rx: 3 + rng() * 5,
      rz: 2 + rng() * 4,
      fx: 0.15 + rng() * 0.25,
      fz: 0.13 + rng() * 0.22,
      ph: rng() * Math.PI * 2,
      h: 1.3 + rng() * 1.0,
      col: ['#fff6d8', '#ffd27a', '#f6b8c8'][i % 3],
    }))
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    for (let i = 0; i < B_N; i++) {
      const b = data[i]
      const g = groups.current[i]
      if (!g) continue
      const x = b.cx + Math.sin(t * b.fx + b.ph) * b.rx
      const z = b.cz + Math.sin(t * b.fz + b.ph * 2) * b.rz
      const px = g.position.x
      const pz = g.position.z
      g.position.set(x, terrainHeight(x, z) + b.h + Math.sin(t * 2.1 + b.ph) * 0.25, z)
      const dx = x - px
      const dz = z - pz
      if (dx * dx + dz * dz > 1e-8) g.rotation.y = Math.atan2(dx, dz)
      const flap = 0.25 + Math.abs(Math.sin(t * 12 + b.ph)) * 1.0
      const wl = g.children[0] as THREE.Mesh
      const wr = g.children[1] as THREE.Mesh
      wl.rotation.y = flap
      wr.rotation.y = -flap
    }
  })

  return (
    <>
      {data.map((b, i) => (
        <group
          key={i}
          ref={(el) => {
            groups.current[i] = el
          }}
        >
          <mesh geometry={wingL}>
            <meshBasicMaterial color={b.col} side={THREE.DoubleSide} />
          </mesh>
          <mesh geometry={wingR}>
            <meshBasicMaterial color={b.col} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </>
  )
}

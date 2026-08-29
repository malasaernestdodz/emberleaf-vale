import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { pickups } from '../lib/items'
import { groundHeight } from '../lib/world'

const MAX = 90

export function Pickups() {
  const rocks = useRef<THREE.InstancedMesh>(null!)
  const flowers = useRef<THREE.InstancedMesh>(null!)
  const woods = useRef<THREE.InstancedMesh>(null!)
  const fishes = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useEffect(() => {
    const c = new THREE.Color()
    c.set('#9a958c')
    for (let i = 0; i < MAX; i++) rocks.current.setColorAt(i, c)
    c.set('#f0a8c0')
    for (let i = 0; i < MAX; i++) flowers.current.setColorAt(i, c)
    if (flowers.current.instanceColor) flowers.current.instanceColor.needsUpdate = true
    if (rocks.current.instanceColor) rocks.current.instanceColor.needsUpdate = true
  }, [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    for (const p of pickups) {
      if (!p.alive || !p.flying) continue
      p.vy -= 16 * dt
      p.x += p.vx * dt
      p.z += p.vz * dt
      p.y += p.vy * dt
      const gh = groundHeight(p.x, p.z) + 0.12
      if (p.y <= gh) {
        p.y = gh
        p.flying = false
        p.vx = 0
        p.vz = 0
        p.vy = 0
      }
    }
    const lists: Record<string, typeof pickups> = { rock: [], flower: [], wood: [], fish: [] }
    for (const p of pickups) {
      if (p.alive) lists[p.type].push(p)
    }
    const place = (mesh: THREE.InstancedMesh, list: typeof pickups, tilt: number) => {
      let n = 0
      for (const p of list) {
        if (n >= MAX) break
        dummy.position.set(p.x, p.y, p.z)
        dummy.rotation.set(p.flying ? p.id + performance.now() * 0.004 : 0, p.id * 1.7, tilt)
        dummy.updateMatrix()
        mesh.setMatrixAt(n, dummy.matrix)
        n++
      }
      mesh.count = n
      mesh.instanceMatrix.needsUpdate = true
    }
    place(rocks.current, lists.rock, 0)
    place(flowers.current, lists.flower, 0)
    place(woods.current, lists.wood, Math.PI / 2)
    place(fishes.current, lists.fish, Math.PI / 2)
  })

  return (
    <>
      <instancedMesh ref={rocks} args={[undefined, undefined, MAX]} frustumCulled={false} castShadow>
        <dodecahedronGeometry args={[0.13]} />
        <meshToonMaterial />
      </instancedMesh>
      <instancedMesh ref={flowers} args={[undefined, undefined, MAX]} frustumCulled={false}>
        <sphereGeometry args={[0.09, 8, 6]} />
        <meshToonMaterial />
      </instancedMesh>
      <instancedMesh ref={woods} args={[undefined, undefined, MAX]} frustumCulled={false} castShadow>
        <cylinderGeometry args={[0.06, 0.07, 0.44, 7]} />
        <meshToonMaterial color="#8a6a48" />
      </instancedMesh>
      <instancedMesh ref={fishes} args={[undefined, undefined, MAX]} frustumCulled={false}>
        <coneGeometry args={[0.07, 0.26, 6]} />
        <meshToonMaterial color="#5fb8c9" />
      </instancedMesh>
    </>
  )
}

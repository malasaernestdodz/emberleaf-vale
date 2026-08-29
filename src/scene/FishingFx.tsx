import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { POND, game } from '../lib/world'

const UP = new THREE.Vector3(0, 1, 0)

export function FishingFx() {
  const group = useRef<THREE.Group>(null!)
  const line = useRef<THREE.Mesh>(null!)
  const bobber = useRef<THREE.Group>(null!)
  const fish = useRef<THREE.Mesh>(null!)
  const ring1 = useRef<THREE.Mesh>(null!)
  const ring2 = useRef<THREE.Mesh>(null!)
  const tmp = useMemo(
    () => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), dir: new THREE.Vector3() }),
    []
  )

  useFrame(({ camera }) => {
    const g = group.current
    g.visible = game.fishing
    if (!game.fishing) return
    const hx = Math.sin(game.heading)
    const hz = Math.cos(game.heading)
    const pdx = POND.x - game.x
    const pdz = POND.z - game.z
    const pd = Math.hypot(pdx, pdz) || 1
    const reach = Math.min(2.4, pd)
    const bx = game.x + (pdx / pd) * reach
    const bz = game.z + (pdz / pd) * reach
    const by = 0.52 + (game.bite ? -0.16 : Math.sin(game.time * 3) * 0.04)
    bobber.current.position.set(bx, by, bz)
    fish.current.visible = game.bite
    fish.current.rotation.y = game.time * 2

    const cyc = (game.time * 0.7) % 1
    const cyc2 = (game.time * 0.7 + 0.5) % 1
    const setRing = (m: THREE.Mesh, f: number, base: number) => {
      m.scale.setScalar(0.4 + f * 1.8)
      const mat = m.material as THREE.MeshBasicMaterial
      mat.opacity = (1 - f) * (game.bite ? 0.85 : 0.45)
      m.position.set(bx, 0.53, bz)
      void base
    }
    setRing(ring1.current, cyc, 0)
    setRing(ring2.current, cyc2, 1)

    tmp.a.set(game.x + hx * 0.45, game.y + 1.15, game.z + hz * 0.45)
    tmp.b.set(bx, by + 0.04, bz)
    tmp.dir.subVectors(tmp.b, tmp.a)
    const len = Math.max(tmp.dir.length(), 0.01)
    line.current.scale.set(1, len, 1)
    line.current.position.copy(tmp.a).addScaledVector(tmp.dir, 0.5)
    line.current.quaternion.setFromUnitVectors(UP, tmp.dir.normalize())
    void camera
  })

  return (
    <group ref={group} visible={false}>
      <mesh ref={line}>
        <cylinderGeometry args={[0.006, 0.006, 1, 4]} />
        <meshBasicMaterial color="#f0ead8" />
      </mesh>
      <group ref={bobber}>
        <mesh>
          <sphereGeometry args={[0.055, 8, 6]} />
          <meshBasicMaterial color="#e86a3a" toneMapped={false} />
        </mesh>
        <mesh ref={fish} visible={false} position={[0.02, -0.1, 0.1]} rotation-z={1.5}>
          <coneGeometry args={[0.05, 0.2, 6]} />
          <meshToonMaterial color="#5fb8c9" />
        </mesh>
      </group>
      <mesh ref={ring1} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.3, 0.37, 24]} />
        <meshBasicMaterial color="#cfeef5" transparent opacity={0.4} depthWrite={false} />
      </mesh>
      <mesh ref={ring2} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.16, 0.21, 20]} />
        <meshBasicMaterial color="#cfeef5" transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  )
}

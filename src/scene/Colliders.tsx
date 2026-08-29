import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLLIDERS, game } from '../lib/world'
import { consumeEdge } from '../lib/input'

const MAX_H = 12

export function Colliders() {
  const group = useRef<THREE.Group>(null!)
  const shapes = useMemo(
    () =>
      COLLIDERS.map((c, i) => {
        const y0 = c.y0 ?? 0
        const top = Math.min(c.top ?? MAX_H, MAX_H)
        const h = Math.max(top - y0, 0.3)
        if (c.t === 'c') {
          const geo = new THREE.CylinderGeometry(c.r, c.r, h, 14, 1)
          return (
            <mesh key={i} geometry={geo} position={[c.x, y0 + h / 2, c.z]}>
              <meshBasicMaterial color="#35d0ba" wireframe transparent opacity={0.5} />
            </mesh>
          )
        }
        const geo = new THREE.BoxGeometry(c.hw * 2, h, c.hd * 2)
        return (
          <mesh key={i} geometry={geo} position={[c.x, y0 + h / 2, c.z]} rotation-y={c.yaw}>
            <meshBasicMaterial color="#ff9f43" wireframe transparent opacity={0.5} />
          </mesh>
        )
      }),
    []
  )
  useFrame(() => {
    if (consumeEdge('KeyC')) game.showColliders = !game.showColliders
    if (group.current) group.current.visible = game.showColliders
  })
  return (
    <group ref={group} visible={false}>
      {shapes}
    </group>
  )
}

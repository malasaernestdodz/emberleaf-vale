import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { slime, updateSlime } from '../lib/slime'
import { endSys } from '../lib/trace'
import { game } from '../lib/world'
import { getToonRamp } from './toonRamp'

export function Slime() {
  const root = useRef<THREE.Group>(null!)
  const body = useRef<THREE.Group>(null!)
  const ramp = getToonRamp()

  useFrame((_, delta) => {
    const t0 = performance.now()
    const dt = Math.min(delta, 0.05)
    updateSlime(dt)
    const s = slime
    root.current.visible = s.state !== 'hidden'
    root.current.position.set(s.x, s.y, s.z)
    root.current.rotation.y = s.yaw
    const breathe = Math.sin(game.time * 3.1)
    const sq = s.squish
    body.current.scale.set(
      1 + breathe * 0.05 + sq * 0.22,
      1 - breathe * 0.09 - sq * 0.36,
      1 + breathe * 0.05 + sq * 0.22
    )
    body.current.position.y = 0.44 * body.current.scale.y
    endSys('slime', t0)
  })

  return (
    <group ref={root}>
      <group ref={body}>
        <mesh castShadow>
          <sphereGeometry args={[0.45, 20, 16]} />
          <meshToonMaterial color="#7ed957" gradientMap={ramp} transparent opacity={0.94} />
        </mesh>
        <mesh position={[-0.15, 0.12, 0.36]}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshBasicMaterial color="#2e2a28" />
        </mesh>
        <mesh position={[0.15, 0.12, 0.36]}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshBasicMaterial color="#2e2a28" />
        </mesh>
        <mesh position={[-0.17, 0.06, 0.39]} scale={[1, 1.4, 1]}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshBasicMaterial color="#2e2a28" />
        </mesh>
        <mesh position={[0.17, 0.06, 0.39]} scale={[1, 1.4, 1]}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshBasicMaterial color="#2e2a28" />
        </mesh>
        <mesh position={[-0.2, 0.3, 0.3]}>
          <sphereGeometry args={[0.07, 8, 6]} />
          <meshBasicMaterial color="#eaffea" transparent opacity={0.8} />
        </mesh>
      </group>
    </group>
  )
}

import { useMemo } from 'react'
import * as THREE from 'three'
import { WELL } from '../lib/world'
import { getToonRamp } from './toonRamp'

export function Well() {
  const ramp = getToonRamp()
  const rimGeo = useMemo(() => {
    const g = new THREE.RingGeometry(0.6, 1.05, 16)
    g.rotateX(-Math.PI / 2)
    g.translate(0, 0.785, 0)
    return g
  }, [])
  return (
    <group position={[WELL.x, 0, WELL.z]}>
      <mesh castShadow receiveShadow position={[0, 0.39, 0]}>
        <cylinderGeometry args={[0.95, 1.05, 0.78, 12, 1, true]} />
        <meshToonMaterial color="#8d8578" gradientMap={ramp} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={rimGeo} receiveShadow>
        <meshToonMaterial color="#8d8578" gradientMap={ramp} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.9, 0.95, 0.6, 12, 1, true]} />
        <meshBasicMaterial color="#101b20" side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.04, 0]}>
        <circleGeometry args={[0.88, 12]} />
        <meshBasicMaterial color="#101b20" />
      </mesh>
      <mesh castShadow position={[-0.75, 1.2, 0]}>
        <boxGeometry args={[0.12, 1.6, 0.12]} />
        <meshToonMaterial color="#7a5b3a" gradientMap={ramp} />
      </mesh>
      <mesh castShadow position={[0.75, 1.2, 0]}>
        <boxGeometry args={[0.12, 1.6, 0.12]} />
        <meshToonMaterial color="#7a5b3a" gradientMap={ramp} />
      </mesh>
      <mesh castShadow position={[0, 1.95, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.05, 0.05, 1.7, 6]} />
        <meshToonMaterial color="#7a5b3a" gradientMap={ramp} />
      </mesh>
      <mesh castShadow position={[0, 2.35, 0]} rotation-y={Math.PI / 4}>
        <coneGeometry args={[1.25, 0.65, 4]} />
        <meshToonMaterial color="#b5432e" gradientMap={ramp} />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.3, 4]} />
        <meshBasicMaterial color="#3a2f28" />
      </mesh>
      <mesh castShadow position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.16, 0.13, 0.24, 8, 1, true]} />
        <meshToonMaterial color="#7a5b3a" gradientMap={ramp} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

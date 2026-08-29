import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { MILL, WINDMILL, WINDMILL_Y, game } from '../lib/world'
import { getToonRamp } from './toonRamp'

function buildSails() {
  const parts: THREE.BufferGeometry[] = []
  for (let i = 0; i < 4; i++) {
    const rot = new THREE.Matrix4().makeRotationZ((i * Math.PI) / 2)
    const spar = new THREE.BoxGeometry(0.09, 3.4, 0.09)
    spar.translate(0, 2.0, 0)
    spar.applyMatrix4(rot)
    parts.push(spar)
    for (let j = 0; j < 5; j++) {
      const bar = new THREE.BoxGeometry(0.9, 0.07, 0.05)
      bar.translate(0, 0.75 + j * 0.58, 0.03)
      bar.applyMatrix4(rot)
      parts.push(bar)
    }
  }
  return mergeGeometries(parts, false)!
}

const STEPS = 18
const ARC = Math.PI * 2 - 0.7
const RISE = MILL.top - 0.02

export function Windmill() {
  const sails = useRef<THREE.Group>(null!)
  const sailsGeo = useMemo(buildSails, [])
  const spiral = useMemo(() => {
    const parts: THREE.BufferGeometry[] = []
    for (let k = 0; k < STEPS; k++) {
      const phi = 0.35 + ((k + 0.5) / STEPS) * ARC
      const y = MILL.base + 0.02 + ((phi - 0.35) / ARC) * RISE - 0.06
      const g = new THREE.BoxGeometry(0.92, 0.12, 1.0)
      g.rotateY(Math.PI - phi)
      g.translate(-Math.sin(phi) * 2.0, y, Math.cos(phi) * 2.0)
      parts.push(g)
    }
    const landing = new THREE.BoxGeometry(1.1, 0.12, 1.0)
    landing.rotateY(Math.PI - (Math.PI * 2 - 0.18))
    landing.translate(-Math.sin(Math.PI * 2 - 0.18) * 2.0, MILL.base + MILL.top - 0.06, Math.cos(Math.PI * 2 - 0.18) * 2.0)
    parts.push(landing)
    return mergeGeometries(parts, false)!
  }, [])
  useFrame((_, delta) => {
    sails.current.rotation.z -= 0.6 * Math.min(delta, 0.5)
    game.windmill = sails.current.rotation.z
  })
  const ramp = getToonRamp()
  return (
    <group position={[WINDMILL.x, WINDMILL_Y, WINDMILL.z]} rotation={[0, MILL.yaw, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
        <cylinderGeometry args={[2.9, 3.3, 0.8, 20]} />
        <meshToonMaterial color="#8d8578" gradientMap={ramp} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 4.25, 0]}>
        <cylinderGeometry args={[2.6, 3.2, 8.5, 24, 1, true, 0.42, Math.PI * 2 - 0.84]} />
        <meshToonMaterial color="#d8cdb4" gradientMap={ramp} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[2.56, 28]} />
        <meshToonMaterial color="#7a5b3a" gradientMap={ramp} />
      </mesh>
      <mesh castShadow position={[0, 4.25, 0]}>
        <cylinderGeometry args={[0.16, 0.2, 8.5, 10]} />
        <meshToonMaterial color="#5d4430" gradientMap={ramp} />
      </mesh>
      <mesh geometry={spiral} castShadow receiveShadow>
        <meshToonMaterial color="#8f6c48" gradientMap={ramp} />
      </mesh>
      <mesh castShadow position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.62, 0.68, 0.36, 12]} />
        <meshToonMaterial color="#8d8578" gradientMap={ramp} />
      </mesh>
      <mesh position={[0, 0.41, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.6, 12]} />
        <meshToonMaterial color="#5d4430" gradientMap={ramp} />
      </mesh>
      <mesh castShadow position={[1.18, 1.3, 2.66]}>
        <boxGeometry args={[0.18, 2.6, 0.18]} />
        <meshToonMaterial color="#4a3a2c" gradientMap={ramp} />
      </mesh>
      <mesh castShadow position={[-1.18, 1.3, 2.66]}>
        <boxGeometry args={[0.18, 2.6, 0.18]} />
        <meshToonMaterial color="#4a3a2c" gradientMap={ramp} />
      </mesh>
      <mesh castShadow position={[0, 2.66, 2.66]}>
        <boxGeometry args={[2.5, 0.18, 0.18]} />
        <meshToonMaterial color="#4a3a2c" gradientMap={ramp} />
      </mesh>
      {[-2.2, 0, 2.2].map((a) => (
        <group key={a} position={[Math.sin(a) * 2.62, 6.6, Math.cos(a) * 2.62]} rotation-y={a}>
          <mesh>
            <circleGeometry args={[0.26, 14]} />
            <meshToonMaterial color="#4a3a2c" gradientMap={ramp} />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <circleGeometry args={[0.18, 14]} />
            <meshBasicMaterial color="#ffd27a" toneMapped={false} />
          </mesh>
        </group>
      ))}
      <mesh castShadow position={[0, 9.55, 0]}>
        <coneGeometry args={[3.1, 2.3, 24]} />
        <meshToonMaterial color="#b5432e" gradientMap={ramp} />
      </mesh>
      <mesh position={[0, 7.0, -2.85]}>
        <sphereGeometry args={[0.16, 10, 8]} />
        <meshToonMaterial color="#4a3a2c" gradientMap={ramp} />
      </mesh>
      <group ref={sails} position={[0, 7.0, -3.0]}>
        <mesh geometry={sailsGeo} castShadow>
          <meshToonMaterial color="#7a5b3a" gradientMap={ramp} />
        </mesh>
      </group>
      <pointLight position={[0, 6.2, 0]} intensity={10} distance={9} decay={2} color="#ffcf8e" />
    </group>
  )
}

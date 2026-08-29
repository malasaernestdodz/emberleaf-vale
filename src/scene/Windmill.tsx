import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { MILL, MILL_ARC, WINDMILL, WINDMILL_Y, game } from '../lib/world'
import { getToonRamp } from './toonRamp'

const WALL_H = 12.2
const WALL_TOP_R = 3.8
const HUB_Y = 10.0

function buildSails() {
  const parts: THREE.BufferGeometry[] = []
  for (let i = 0; i < 4; i++) {
    const rot = new THREE.Matrix4().makeRotationZ((i * Math.PI) / 2)
    const spar = new THREE.BoxGeometry(0.12, 5.0, 0.12)
    spar.translate(0, 2.7, 0)
    spar.applyMatrix4(rot)
    parts.push(spar)
    for (let j = 0; j < 7; j++) {
      const bar = new THREE.BoxGeometry(1.25, 0.08, 0.05)
      bar.translate(0, 0.85 + j * 0.62, 0.03)
      bar.applyMatrix4(rot)
      parts.push(bar)
    }
  }
  return mergeGeometries(parts, false)!
}

const STEPS = 30
const STEP_R = (MILL.rCenter + MILL.rIn) / 2
const STEP_W = MILL.rIn - MILL.rCenter + 0.1

export function Windmill() {
  const sails = useRef<THREE.Group>(null!)
  const sailsGeo = useMemo(buildSails, [])
  const spiral = useMemo(() => {
    const parts: THREE.BufferGeometry[] = []
    for (let k = 0; k < STEPS; k++) {
      const phi = MILL.doorPhi + ((k + 0.5) / STEPS) * MILL_ARC
      const y = MILL.base + 0.02 + ((phi - MILL.doorPhi) / MILL_ARC) * (MILL.top - 0.02)
      const g = new THREE.BoxGeometry(1.18, 0.1, STEP_W)
      g.rotateY(Math.PI - phi)
      g.translate(-Math.sin(phi) * STEP_R, y - 0.05, Math.cos(phi) * STEP_R)
      parts.push(g)
    }
    return mergeGeometries(parts, false)!
  }, [])
  const landingGeo = useMemo(() => {
    const thetaStart = MILL.doorPhi - Math.PI / 2
    const g = new THREE.RingGeometry(MILL.rCenter, MILL.rIn, 22, 1, thetaStart, MILL.topPhi)
    g.rotateX(-Math.PI / 2)
    g.translate(0, MILL.base + MILL.top + 0.001, 0)
    return g
  }, [])
  useFrame((_, delta) => {
    sails.current.rotation.z -= 0.6 * Math.min(delta, 0.5)
    game.windmill = sails.current.rotation.z
  })
  const ramp = getToonRamp()
  const doorHalf = 0.24
  const doorPostX = Math.sin(doorHalf) * (MILL.rWall + 0.1)
  const doorPostZ = Math.cos(doorHalf) * (MILL.rWall + 0.1)
  return (
    <group position={[WINDMILL.x, WINDMILL_Y, WINDMILL.z]} rotation={[0, MILL.yaw, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.55, 0]}>
        <cylinderGeometry args={[4.7, 5.1, 1.1, 24]} />
        <meshToonMaterial color="#8d8578" gradientMap={ramp} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 6.7, 0]}>
        <cylinderGeometry args={[WALL_TOP_R, 4.4, WALL_H, 28, 1, true, doorHalf, Math.PI * 2 - doorHalf * 2]} />
        <meshToonMaterial color="#d8cdb4" gradientMap={ramp} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[3.55, 36]} />
        <meshToonMaterial color="#7a5b3a" gradientMap={ramp} />
      </mesh>
      <mesh castShadow position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.8, 0.88, 0.5, 14]} />
        <meshToonMaterial color="#8d8578" gradientMap={ramp} />
      </mesh>
      <mesh position={[0, 0.505, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.78, 14]} />
        <meshToonMaterial color="#5d4430" gradientMap={ramp} />
      </mesh>
      <mesh castShadow position={[0, 0.57, 0]}>
        <cylinderGeometry args={[0.6, 0.64, 0.13, 12]} />
        <meshToonMaterial color="#9a958c" gradientMap={ramp} />
      </mesh>
      <mesh castShadow position={[0, 6.4, 0]}>
        <cylinderGeometry args={[0.3, 0.34, 11.8, 10]} />
        <meshToonMaterial color="#5d4430" gradientMap={ramp} />
      </mesh>
      <mesh geometry={spiral} castShadow receiveShadow>
        <meshToonMaterial color="#8f6c48" gradientMap={ramp} />
      </mesh>
      <mesh geometry={landingGeo} receiveShadow>
        <meshToonMaterial color="#8f6c48" gradientMap={ramp} side={THREE.DoubleSide} />
      </mesh>
      <mesh castShadow position={[doorPostX, 1.7, doorPostZ]}>
        <boxGeometry args={[0.2, 3.4, 0.2]} />
        <meshToonMaterial color="#4a3a2c" gradientMap={ramp} />
      </mesh>
      <mesh castShadow position={[-doorPostX, 1.7, doorPostZ]}>
        <boxGeometry args={[0.2, 3.4, 0.2]} />
        <meshToonMaterial color="#4a3a2c" gradientMap={ramp} />
      </mesh>
      <mesh castShadow position={[0, 3.55, doorPostZ + 0.05]}>
        <boxGeometry args={[2.35, 0.22, 0.22]} />
        <meshToonMaterial color="#4a3a2c" gradientMap={ramp} />
      </mesh>
      <mesh castShadow position={[doorPostX + 0.72, 1.62, doorPostZ + 0.35]} rotation-y={-1.15}>
        <boxGeometry args={[1.5, 3.1, 0.09]} />
        <meshToonMaterial color="#6b4a2f" gradientMap={ramp} />
      </mesh>
      {[2.1, 3.6, 5.2].map((a) => (
        <group key={a} position={[Math.sin(a) * (WALL_TOP_R + 0.05), 9.6, Math.cos(a) * (WALL_TOP_R + 0.05)]} rotation-y={a}>
          <mesh>
            <circleGeometry args={[0.34, 14]} />
            <meshToonMaterial color="#4a3a2c" gradientMap={ramp} />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <circleGeometry args={[0.24, 14]} />
            <meshBasicMaterial color="#ffd27a" toneMapped={false} />
          </mesh>
        </group>
      ))}
      <mesh castShadow position={[0, 13.6, 0]}>
        <coneGeometry args={[4.15, 2.7, 24]} />
        <meshToonMaterial color="#b5432e" gradientMap={ramp} />
      </mesh>
      <mesh castShadow position={[0, HUB_Y, -4.35]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.18, 0.22, 1.3, 10]} />
        <meshToonMaterial color="#4a3a2c" gradientMap={ramp} />
      </mesh>
      <group ref={sails} position={[0, HUB_Y, -4.75]}>
        <mesh geometry={sailsGeo} castShadow>
          <meshToonMaterial color="#7a5b3a" gradientMap={ramp} />
        </mesh>
      </group>
      <pointLight position={[0, 8.5, 0]} intensity={16} distance={13} decay={2} color="#ffcf8e" />
    </group>
  )
}

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { MILL, MILL_ARC, MILL_TOWER, WINDMILL, WINDMILL_Y, game } from '../lib/world'
import { getToonRamp } from './toonRamp'

const WALL_H = MILL_TOWER.h
const WALL_TOP_R = 4.5
const HUB_Y = MILL_TOWER.hubY

function buildSails() {
  const parts: THREE.BufferGeometry[] = []
  for (let i = 0; i < 4; i++) {
    const rot = new THREE.Matrix4().makeRotationZ((i * Math.PI) / 2)
    const spar = new THREE.BoxGeometry(0.16, MILL_TOWER.sailR, 0.16)
    spar.translate(0, MILL_TOWER.sailR / 2 + 0.4, 0)
    spar.applyMatrix4(rot)
    parts.push(spar)
    for (let j = 0; j < 8; j++) {
      const bar = new THREE.BoxGeometry(1.5, 0.09, 0.06)
      bar.translate(0, 0.95 + j * 0.72, 0.04)
      bar.applyMatrix4(rot)
      parts.push(bar)
    }
  }
  return mergeGeometries(parts, false)!
}

const STEPS = 34
const STEP_R = (MILL.rCenter + MILL.rIn) / 2
const STEP_W = MILL.rIn - MILL.rCenter + 0.1

export function Windmill() {
  const sails = useRef<THREE.Group>(null!)
  const sailsGeo = useMemo(buildSails, [])
  const spiral = useMemo(() => {
    const parts: THREE.BufferGeometry[] = []
    for (let k = 0; k < STEPS; k++) {
      const phi = MILL.doorPhi + ((k + 0.5) / STEPS) * MILL_ARC
      const y =
        MILL.floorH + 0.02 + ((phi - MILL.doorPhi) / MILL_ARC) * (MILL.top - MILL.floorH - 0.02)
      const g = new THREE.BoxGeometry(1.3, 0.42, STEP_W)
      g.rotateY(Math.PI - phi)
      g.translate(-Math.sin(phi) * STEP_R, y - 0.21, Math.cos(phi) * STEP_R)
      parts.push(g)
    }
    return mergeGeometries(parts, false)!
  }, [])
  const landingGeo = useMemo(() => {
    const thetaStart = MILL.doorPhi - Math.PI / 2
    const g = new THREE.RingGeometry(MILL.rCenter, MILL.rIn, 24, 1, thetaStart, MILL.topPhi)
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
  const doorPostX = Math.sin(doorHalf) * (MILL.rWall + 0.12)
  const doorPostZ = Math.cos(doorHalf) * (MILL.rWall + 0.12)
  return (
    <group position={[WINDMILL.x, WINDMILL_Y, WINDMILL.z]} rotation={[0, MILL.yaw, 0]} userData={{ cullId: 'windmill' }}>
      <mesh castShadow receiveShadow position={[0, 0.6, 0]}>
        <cylinderGeometry args={[5.7, 6.1, 1.2, 26]} />
        <meshToonMaterial color="#8d8578" gradientMap={ramp} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.6 + WALL_H / 2, 0]}>
        <cylinderGeometry args={[WALL_TOP_R, 5.5, WALL_H, 30, 1, true, doorHalf, Math.PI * 2 - doorHalf * 2]} />
        <meshToonMaterial color="#d8cdb4" gradientMap={ramp} side={THREE.DoubleSide} />
      </mesh>
      <mesh castShadow position={[0, MILL.floorH + 0.03, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[4.6, 40]} />
        <meshToonMaterial color="#7a5b3a" gradientMap={ramp} />
      </mesh>
      <mesh castShadow position={[0, MILL.step1Top / 2, 6.025]}>
        <boxGeometry args={[2.7, MILL.step1Top, 0.65]} />
        <meshToonMaterial color="#8d8578" gradientMap={ramp} />
      </mesh>
      <mesh castShadow position={[0, MILL.step2Top / 2, 6.675]}>
        <boxGeometry args={[2.7, MILL.step2Top, 0.65]} />
        <meshToonMaterial color="#8d8578" gradientMap={ramp} />
      </mesh>
      <mesh castShadow position={[0, 7.35, 0]}>
        <cylinderGeometry args={[0.35, 0.4, 13.7, 12]} />
        <meshToonMaterial color="#5d4430" gradientMap={ramp} />
      </mesh>
      <mesh geometry={spiral} castShadow receiveShadow>
        <meshToonMaterial color="#8f6c48" gradientMap={ramp} />
      </mesh>
      <mesh geometry={landingGeo} receiveShadow>
        <meshToonMaterial color="#8f6c48" gradientMap={ramp} side={THREE.DoubleSide} />
      </mesh>
      <mesh castShadow position={[doorPostX, 1.8, doorPostZ]}>
        <boxGeometry args={[0.22, 3.6, 0.22]} />
        <meshToonMaterial color="#4a3a2c" gradientMap={ramp} />
      </mesh>
      <mesh castShadow position={[-doorPostX, 1.8, doorPostZ]}>
        <boxGeometry args={[0.22, 3.6, 0.22]} />
        <meshToonMaterial color="#4a3a2c" gradientMap={ramp} />
      </mesh>
      <mesh castShadow position={[0, 3.75, doorPostZ + 0.06]}>
        <boxGeometry args={[2.6, 0.24, 0.24]} />
        <meshToonMaterial color="#4a3a2c" gradientMap={ramp} />
      </mesh>
      <mesh castShadow position={[doorPostX + 0.86, 1.7, doorPostZ + 0.4]} rotation-y={-1.15}>
        <boxGeometry args={[1.7, 3.3, 0.1]} />
        <meshToonMaterial color="#6b4a2f" gradientMap={ramp} />
      </mesh>
      {[2.1, 3.6, 5.2].map((a) => (
        <group key={a} position={[Math.sin(a) * (WALL_TOP_R + 0.06), 11.5, Math.cos(a) * (WALL_TOP_R + 0.06)]} rotation-y={a}>
          <mesh>
            <circleGeometry args={[0.38, 14]} />
            <meshToonMaterial color="#4a3a2c" gradientMap={ramp} />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <circleGeometry args={[0.27, 14]} />
            <meshBasicMaterial color="#ffd27a" toneMapped={false} />
          </mesh>
        </group>
      ))}
      <mesh castShadow position={[0, 0.6 + WALL_H + 1.6, 0]}>
        <coneGeometry args={[5.15, 3.2, 26]} />
        <meshToonMaterial color="#b5432e" gradientMap={ramp} />
      </mesh>
      <mesh castShadow position={[0, HUB_Y, -5.0]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.2, 0.26, 1.4, 10]} />
        <meshToonMaterial color="#4a3a2c" gradientMap={ramp} />
      </mesh>
      <group ref={sails} position={[0, HUB_Y, -5.4]}>
        <mesh geometry={sailsGeo} castShadow>
          <meshToonMaterial color="#7a5b3a" gradientMap={ramp} />
        </mesh>
      </group>
      <pointLight position={[0, 10, 0]} intensity={20} distance={15} decay={2} color="#ffcf8e" />
    </group>
  )
}

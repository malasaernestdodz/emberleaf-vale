import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { MILL, MILL_ARC, MILL_BALCONY, MILL_LOOKOUT, MILL_LOOKOUT_MID_PHI, MILL_TOWER, WINDMILL, WINDMILL_Y, game } from '../lib/world'
import { getToonRamp } from './toonRamp'

const WALL_H = MILL_TOWER.h
const WALL_TOP_R = 4.5
const HUB_Y = MILL_TOWER.hubY
const LINTEL_TOP = 3.87
const BAND1_H = LINTEL_TOP - 0.6
const BAND2_H = MILL.top - LINTEL_TOP
const BAND3_H = WALL_H - BAND1_H - BAND2_H
const BAND_R = (y: number) => 5.5 + ((WALL_TOP_R - 5.5) * (y - 0.6)) / WALL_H
const R1 = BAND_R(LINTEL_TOP)
const R2 = BAND_R(MILL.top)

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
    // Vista balcony: deck, guard rail, doorway jambs, support brackets.
    const deck = new THREE.RingGeometry(
      MILL_BALCONY.r0,
      MILL_BALCONY.r1,
      24,
      1,
      Math.PI * 1.5 - MILL_BALCONY.phi1,
      MILL_BALCONY.phi1 - MILL_BALCONY.phi0
    )
    deck.rotateX(-Math.PI / 2)
    deck.translate(0, MILL.top + 0.02, 0)
    parts.push(deck)
    const railR = MILL_BALCONY.r1 - 0.12
    const SEG = 6
    for (let i = 0; i <= SEG; i++) {
      const phi = MILL_BALCONY.phi0 + 0.12 + ((MILL_BALCONY.phi1 - MILL_BALCONY.phi0 - 0.24) * i) / SEG
      const post = new THREE.BoxGeometry(0.1, MILL_BALCONY.railH, 0.1)
      post.translate(0, MILL_BALCONY.railH / 2, 0)
      post.translate(-Math.sin(phi) * railR, MILL.top, Math.cos(phi) * railR)
      parts.push(post)
      if (i < SEG) {
        const phi2 = MILL_BALCONY.phi0 + 0.12 + ((MILL_BALCONY.phi1 - MILL_BALCONY.phi0 - 0.24) * (i + 1)) / SEG
        const am = (phi + phi2) / 2
        const chord = 2 * railR * Math.sin((phi2 - phi) / 2) + 0.12
        const rm = railR * Math.cos((phi2 - phi) / 2)
        for (const ry of [MILL_BALCONY.railH - 0.05, MILL_BALCONY.railH * 0.55]) {
          const bar = new THREE.BoxGeometry(chord, 0.09, 0.08)
          bar.translate(0, ry, 0)
          bar.rotateY(Math.PI - am)
          bar.translate(-Math.sin(am) * rm, MILL.top, Math.cos(am) * rm)
          parts.push(bar)
        }
      }
    }
    for (const edge of [MILL_BALCONY.phi0 + 0.06, MILL_BALCONY.phi1 - 0.06]) {
      const rm = (MILL.rIn + MILL_BALCONY.r1) / 2
      for (const ry of [MILL_BALCONY.railH - 0.05, MILL_BALCONY.railH * 0.55]) {
        const panel = new THREE.BoxGeometry(MILL_BALCONY.r1 - MILL.rIn, 0.09, 0.08)
        panel.translate(0, ry, 0)
        panel.rotateY(Math.PI * 1.5 - edge)
        panel.translate(-Math.sin(edge) * rm, MILL.top, Math.cos(edge) * rm)
        parts.push(panel)
      }
    }
    for (const edge of [MILL_BALCONY.phi0, MILL_BALCONY.phi1]) {
      const jamb = new THREE.BoxGeometry(0.24, 3.3, 0.24)
      jamb.translate(0, 1.65, 0)
      jamb.translate(-Math.sin(edge) * (MILL.rWall + 0.12), MILL.top, Math.cos(edge) * (MILL.rWall + 0.12))
      parts.push(jamb)
    }
    const midPhi = (MILL_BALCONY.phi0 + MILL_BALCONY.phi1) / 2
    const lintel = new THREE.BoxGeometry(
      2 * (MILL.rWall + 0.12) * Math.sin((MILL_BALCONY.phi1 - MILL_BALCONY.phi0) / 2) + 0.2,
      0.26,
      0.3
    )
    lintel.translate(0, 3.43, 0)
    lintel.rotateY(Math.PI * 1.5 - midPhi)
    lintel.translate(-Math.sin(midPhi) * (MILL.rWall + 0.12), MILL.top, Math.cos(midPhi) * (MILL.rWall + 0.12))
    parts.push(lintel)
    for (let i = 0; i < 3; i++) {
      const phi = MILL_BALCONY.phi0 + 0.2 + ((MILL_BALCONY.phi1 - MILL_BALCONY.phi0 - 0.4) * i) / 2
      const brace = new THREE.BoxGeometry(0.16, 0.16, 2.4)
      brace.rotateX(-0.62)
      brace.rotateY(Math.PI * 1.5 - phi)
      brace.translate(-Math.sin(phi) * 6.0, MILL.top - 0.72, Math.cos(phi) * 6.0)
      parts.push(brace)
    }
    return mergeGeometries(parts, false)!
  }, [])
  const landingGeo = useMemo(() => {
    const thetaStart = MILL.doorPhi - Math.PI / 2
    const g = new THREE.RingGeometry(MILL.rCenter, MILL.rIn, 24, 1, thetaStart, MILL.topPhi)
    g.rotateX(-Math.PI / 2)
    g.translate(0, MILL.top + 0.001, 0)
    return g
  }, [])
  useFrame((_, delta) => {
    sails.current.rotation.z -= 0.6 * Math.min(delta, 0.5)
    game.windmill = sails.current.rotation.z
  })
  const ramp = getToonRamp()
  const doorHalf = MILL.doorHalf
  const doorPostX = Math.sin(doorHalf) * (MILL.rWall + 0.12)
  const doorPostZ = Math.cos(doorHalf) * (MILL.rWall + 0.12)
  // Cylinder theta runs opposite to the walkable phi convention (theta = -phi),
  // so the balcony arc [phi0, phi1] opens the upper band at cylinder thetas
  // [2π − phi0, 2π − phi0 + phi0 + doorHalf]; the length wraps past 2π so the
  // door slit stays closed above the deck and only the balcony arc shows sky.
  const balcThetaStart = Math.PI * 2 - MILL_BALCONY.phi0
  const balcThetaLen = MILL_BALCONY.phi0 + MILL.doorHalf
  return (
    <group position={[WINDMILL.x, WINDMILL_Y, WINDMILL.z]} rotation={[0, MILL.yaw, 0]} userData={{ cullId: 'windmill' }}>
      <mesh castShadow receiveShadow position={[0, 0.6, 0]}>
        <cylinderGeometry args={[5.7, 6.1, 1.2, 26]} />
        <meshToonMaterial color="#8d8578" gradientMap={ramp} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.6 + BAND1_H / 2, 0]}>
        <cylinderGeometry args={[R1, 5.5, BAND1_H, 30, 1, true, doorHalf, Math.PI * 2 - 2 * doorHalf]} />
        <meshToonMaterial color="#d8cdb4" gradientMap={ramp} side={THREE.DoubleSide} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, LINTEL_TOP + BAND2_H / 2, 0]}>
        <cylinderGeometry args={[R2, R1, BAND2_H, 30, 1, true]} />
        <meshToonMaterial color="#d8cdb4" gradientMap={ramp} side={THREE.DoubleSide} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, MILL.top + BAND3_H / 2, 0]}>
        <cylinderGeometry args={[WALL_TOP_R, R2, BAND3_H, 30, 1, true, balcThetaStart, balcThetaLen]} />
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
        <meshToonMaterial color="#8f6c48" gradientMap={ramp} side={THREE.DoubleSide} />
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
      <group position={[-Math.sin(MILL_LOOKOUT_MID_PHI) * MILL_LOOKOUT.r, MILL.top, Math.cos(MILL_LOOKOUT_MID_PHI) * MILL_LOOKOUT.r]} rotation-y={MILL_LOOKOUT_MID_PHI}>
        <mesh castShadow position={[0, 0.62, 0]}>
          <cylinderGeometry args={[0.2, 0.28, 1.15, 8]} />
          <meshToonMaterial color="#4a3a2c" gradientMap={ramp} />
        </mesh>
        <mesh castShadow position={[0, 1.42, 0]} rotation-x={-0.5}>
          <cylinderGeometry args={[0.13, 0.17, 0.85, 10]} />
          <meshToonMaterial color="#c9a24a" gradientMap={ramp} />
        </mesh>
        <mesh position={[0, 1.8, 0.36]}>
          <circleGeometry args={[0.12, 10]} />
          <meshBasicMaterial color="#ffd27a" toneMapped={false} />
        </mesh>
      </group>
      <pointLight position={[0, 10, 0]} intensity={20} distance={15} decay={2} color="#ffcf8e" />
    </group>
  )
}

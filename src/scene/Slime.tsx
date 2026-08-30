import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { slime, updateSlime } from '../lib/slime'
import { endSys } from '../lib/trace'
import { game } from '../lib/world'
import { getToonRamp } from './toonRamp'

const FILL_W = 0.7
const FILL_H = 0.07
const GREEN = 0x45c0e8
const EMBER = 0xf4a63a
const WOUND = 0xe05d4f

export function Slime() {
  const root = useRef<THREE.Group>(null!)
  const body = useRef<THREE.Group>(null!)
  const bar = useRef<THREE.Group>(null!)
  const fill = useRef<THREE.Mesh>(null!)
  const ghost = useRef<THREE.Mesh>(null!)
  const fillMat = useRef<THREE.MeshBasicMaterial>(null!)
  const fillFrac = useRef(1)
  const ghostFrac = useRef(1)
  const ramp = getToonRamp()

  useFrame((state, delta) => {
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

    const target = s.maxHp > 0 ? Math.max(0, s.hp / s.maxHp) : 0
    fillFrac.current += (target - fillFrac.current) * (1 - Math.exp(-14 * dt))
    if (Math.abs(target - fillFrac.current) < 0.002) fillFrac.current = target
    if (ghostFrac.current < target) ghostFrac.current = target
    else ghostFrac.current += (target - ghostFrac.current) * (1 - Math.exp(-3.5 * dt))
    const shown = root.current.visible
    bar.current.visible = shown
    if (shown) {
      bar.current.position.set(0, 1.08 + breathe * 0.02, 0)
      bar.current.quaternion.copy(state.camera.quaternion)
      const ff = Math.max(fillFrac.current, 0.001)
      const gf = Math.max(ghostFrac.current, 0.001)
      fill.current.scale.x = ff
      fill.current.position.x = -(FILL_W / 2) * (1 - ff)
      ghost.current.scale.x = gf
      ghost.current.position.x = -(FILL_W / 2) * (1 - gf)
      fillMat.current.color.setHex(target > 0.66 ? GREEN : target > 0.33 ? EMBER : WOUND)
    }
    endSys('slime', t0)
  })

  return (
    <group ref={root}>
      <group ref={body}>
        <mesh castShadow>
          <sphereGeometry args={[0.45, 20, 16]} />
          <meshToonMaterial color="#45c0e8" gradientMap={ramp} transparent opacity={0.94} />
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
          <meshBasicMaterial color="#e6f7ff" transparent opacity={0.8} />
        </mesh>
      </group>
      <group ref={bar} position={[0, 1.08, 0]}>
        <mesh renderOrder={30}>
          <planeGeometry args={[0.8, 0.16]} />
          <meshBasicMaterial color="#241a10" transparent opacity={0.85} depthTest={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh renderOrder={31} position={[0, 0, 0.001]}>
          <planeGeometry args={[0.74, 0.1]} />
          <meshBasicMaterial color="#d8b56a" depthTest={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh ref={ghost} renderOrder={32} position={[0, 0, 0.002]}>
          <planeGeometry args={[FILL_W, FILL_H]} />
          <meshBasicMaterial color="#e05d4f" depthTest={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh ref={fill} renderOrder={33} position={[0, 0, 0.003]}>
          <planeGeometry args={[FILL_W, FILL_H]} />
          <meshBasicMaterial ref={fillMat} color="#45c0e8" depthTest={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  )
}

import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { mulberry32 } from '../lib/math'
import { FOUNTAIN } from '../lib/world'
import { makeWaterMaterial } from './Pond'
import { getToonRamp } from './toonRamp'

export function Fountain() {
  const poolWater = useMemo(() => makeWaterMaterial(1.62, 0.9), [])
  const upperWater = useMemo(() => makeWaterMaterial(0.56, 0.9), [])
  const droplets = useMemo(() => {
    const rng = mulberry32(4242)
    const N = 42
    const pos = new Float32Array(N * 3)
    const meta: { a: number; sp: number; ph: number }[] = []
    for (let i = 0; i < N; i++) {
      meta.push({ a: rng() * Math.PI * 2, sp: 0.5 + rng() * 0.6, ph: rng() })
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return { geo, meta, pos }
  }, [])
  const stoneGeo = useMemo(() => {
    const parts: THREE.BufferGeometry[] = []
    const pool = new THREE.CylinderGeometry(1.85, 2.0, 0.56, 14, 1, true)
    pool.translate(0, 0.28, 0)
    parts.push(pool)
    const column = new THREE.CylinderGeometry(0.22, 0.32, 1.3, 8)
    column.translate(0, 1.15, 0)
    parts.push(column)
    const bowl = new THREE.CylinderGeometry(0.66, 0.12, 0.4, 10)
    bowl.translate(0, 1.95, 0)
    parts.push(bowl)
    const finial = new THREE.SphereGeometry(0.15, 10, 8)
    finial.translate(0, 2.45, 0)
    parts.push(finial)
    return mergeGeometries(parts, false)!
  }, [])
  const rimGeo = useMemo(() => {
    const g = new THREE.RingGeometry(1.7, 2.02, 24)
    g.rotateX(-Math.PI / 2)
    g.translate(0, 0.565, 0)
    return g
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    poolWater.uniforms.uTime.value = t
    upperWater.uniforms.uTime.value = t
    for (let i = 0; i < droplets.meta.length; i++) {
      const d = droplets.meta[i]
      const tt = ((t * 0.85 + d.ph) % 1) * 1.05
      const rad = d.sp * tt
      const y = 2.45 + 2.2 * tt - 7.5 * tt * tt
      droplets.pos[i * 3] = Math.cos(d.a) * rad
      droplets.pos[i * 3 + 1] = Math.max(y, 0.5)
      droplets.pos[i * 3 + 2] = Math.sin(d.a) * rad
    }
    droplets.geo.attributes.position.needsUpdate = true
  })

  const ramp = getToonRamp()
  return (
    <group position={[FOUNTAIN.x, 0, FOUNTAIN.z]} userData={{ cullId: 'fountain' }}>
      <mesh geometry={stoneGeo} castShadow receiveShadow>
        <meshToonMaterial color="#a8a29a" gradientMap={ramp} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={rimGeo} receiveShadow>
        <meshToonMaterial color="#a8a29a" gradientMap={ramp} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.5, 0]} material={poolWater}>
        <circleGeometry args={[1.62, 32]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 2.12, 0]} material={upperWater}>
        <circleGeometry args={[0.56, 24]} />
      </mesh>
      <points geometry={droplets.geo}>
        <pointsMaterial size={0.08} color="#aee6f5" transparent opacity={0.85} sizeAttenuation depthWrite={false} />
      </points>
    </group>
  )
}

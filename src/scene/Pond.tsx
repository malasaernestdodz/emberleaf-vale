import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { mulberry32 } from '../lib/math'
import { POND } from '../lib/world'
import { getToonRamp } from './toonRamp'

export function makeWaterMaterial(radius: number, alpha = 0.88) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uR: { value: radius },
      uAlpha: { value: alpha },
    },
    vertexShader: /* glsl */ `
      uniform float uR;
      varying vec2 vP;
      void main() {
        vP = position.xy / uR;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uAlpha;
      varying vec2 vP;
      void main() {
        float r = length(vP);
        float ripple = sin(r * 22.0 - uTime * 2.2) * 0.5 + 0.5;
        float bands = sin(vP.x * 7.0 + uTime * 0.7) * sin(vP.y * 7.0 - uTime * 0.55);
        vec3 col = mix(vec3(0.09, 0.32, 0.42), vec3(0.30, 0.70, 0.78), ripple * 0.30 + bands * 0.10 + 0.42);
        col = mix(col, vec3(0.85, 0.95, 0.95), smoothstep(0.82, 0.98, r) * 0.35);
        gl_FragColor = vec4(col, uAlpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  })
}

export function Pond() {
  const water = useMemo(() => makeWaterMaterial(POND.r - 0.4), [])
  const padGeo = useMemo(() => {
    const rng = mulberry32(88)
    const parts: THREE.BufferGeometry[] = []
    for (let i = 0; i < 7; i++) {
      const a = rng() * Math.PI * 2
      const r = rng() * (POND.r - 1.6)
      const g = new THREE.CircleGeometry(0.3 + rng() * 0.25, 10)
      g.rotateX(-Math.PI / 2)
      g.rotateY(rng() * Math.PI * 2)
      g.translate(POND.x + Math.cos(a) * r, -0.04, POND.z + Math.sin(a) * r)
      parts.push(g)
    }
    return mergeGeometries(parts, false)!
  }, [])
  const lotusGeo = useMemo(() => {
    const rng = mulberry32(89)
    const parts: THREE.BufferGeometry[] = []
    for (let i = 0; i < 2; i++) {
      const a = rng() * Math.PI * 2
      const r = 1.2 + rng() * 1.8
      const g = new THREE.ConeGeometry(0.09, 0.14, 6)
      g.translate(POND.x + Math.cos(a) * r, 0.04, POND.z + Math.sin(a) * r)
      parts.push(g)
    }
    return mergeGeometries(parts, false)!
  }, [])

  useFrame(({ clock }) => {
    water.uniforms.uTime.value = clock.elapsedTime
  })

  const ramp = getToonRamp()
  return (
    <group userData={{ cullId: 'pond' }}>
      <mesh rotation-x={-Math.PI / 2} position={[POND.x, -0.08, POND.z]} material={water}>
        <circleGeometry args={[POND.r - 0.4, 48]} />
      </mesh>
      <mesh geometry={padGeo} receiveShadow>
        <meshToonMaterial color="#2a5a28" gradientMap={ramp} />
      </mesh>
      <mesh geometry={lotusGeo}>
        <meshToonMaterial color="#e89ab8" gradientMap={ramp} />
      </mesh>
    </group>
  )
}

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry32 } from '../lib/math'
import { LITE } from '../lib/flags'
import { perfStore } from '../lib/perf'
import { settings } from '../lib/settings'
import { endSys } from '../lib/trace'
import {
  FOUNTAIN,
  PLAZA,
  POND,
  ROCKS,
  TREES,
  WELL,
  WINDMILL,
  game,
  houseLocal,
  mansionLocal,
  pathDistance,
  terrainHeight,
} from '../lib/world'

const GRASS_N = LITE ? 12000 : 70000

const grassVert = /* glsl */ `
attribute vec3 aOffset;
attribute float aYaw;
attribute float aScale;
attribute float aPhase;
attribute float aMix;
uniform float uTime;
uniform vec3 uPlayer;
uniform float uCull;
varying float vY;
varying float vMix;
varying float vDist;
void main() {
  vec3 world0 = position + aOffset;
  float d0 = distance(world0, cameraPosition);
  if (d0 > uCull) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vDist = d0;
    vY = uv.y;
    vMix = aMix;
    return;
  }
  vY = uv.y;
  vMix = aMix;
  vec3 p = position;
  p.xz *= 1.0 - uv.y * 0.32;
  p.y *= aScale;
  float c = cos(aYaw);
  float s = sin(aYaw);
  p.xz = mat2(c, -s, s, c) * p.xz;
  float bendW = pow(uv.y, 1.5) * aScale;
  float gust = 0.55 + 0.45 * sin(uTime * 0.5 + aOffset.x * 0.06 + aOffset.z * 0.045);
  float sway = sin(uTime * 1.6 + aPhase) * 0.6 + sin(uTime * 2.7 + aPhase * 1.3) * 0.25;
  vec2 wind = vec2(0.8, 0.35) * sway * gust * 0.22;
  vec2 toP = aOffset.xz - uPlayer.xz;
  float pl = length(toP);
  wind += (toP / max(pl, 0.001)) * (1.0 - smoothstep(0.1, 1.1, pl)) * 0.45;
  p.xz += wind * bendW;
  vec3 world = p + aOffset;
  vDist = distance(world, cameraPosition);
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
`

const grassFrag = /* glsl */ `
uniform vec3 uFogColor;
varying float vY;
varying float vMix;
varying float vDist;
void main() {
  vec3 root = mix(vec3(0.10, 0.27, 0.09), vec3(0.14, 0.36, 0.11), vMix);
  vec3 tip = mix(vec3(0.47, 0.64, 0.20), vec3(0.78, 0.76, 0.30), vMix);
  vec3 col = mix(root, tip, smoothstep(0.05, 0.95, vY));
  col *= mix(0.55, 1.05, vY);
  col = mix(col, uFogColor, smoothstep(48.0, 76.0, vDist));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

const flowerVert = /* glsl */ `
attribute vec3 aOffset;
attribute vec3 aCol;
attribute float aPhase;
uniform float uTime;
uniform float uCull;
varying vec3 vCol;
varying float vDist;
void main() {
  vec3 world0 = position + aOffset;
  float d0 = distance(world0, cameraPosition);
  if (d0 > uCull) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vDist = d0;
    vCol = aCol;
    return;
  }
  vCol = aCol;
  vec3 p = position;
  p.x += sin(uTime * 1.3 + aPhase) * 0.012;
  vec3 world = p + aOffset;
  vDist = distance(world, cameraPosition);
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
`

const flowerFrag = /* glsl */ `
uniform vec3 uFogColor;
varying vec3 vCol;
varying float vDist;
void main() {
  vec3 col = mix(vCol, uFogColor, smoothstep(48.0, 76.0, vDist));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

const FLOWER_COLORS: [number, number, number][] = [
  [1.0, 0.96, 0.91],
  [1.0, 0.84, 0.88],
  [0.81, 0.89, 1.0],
  [1.0, 0.91, 0.66],
]

export function Grass() {
  const grass = useMemo(() => {
    const rng = mulberry32(777)
    const offsets = new Float32Array(GRASS_N * 3)
    const yaws = new Float32Array(GRASS_N)
    const scales = new Float32Array(GRASS_N)
    const phases = new Float32Array(GRASS_N)
    const mixes = new Float32Array(GRASS_N)
    let n = 0
    let attempts = 0
    while (n < GRASS_N && attempts < 500000) {
      attempts++
      const a = rng() * Math.PI * 2
      const r = Math.sqrt(rng()) * 78
      const x = Math.cos(a) * r
      const z = Math.sin(a) * r
      // cheap rejects first, expensive pathDistance last
      if (Math.hypot(x - PLAZA.x, z - PLAZA.z) < 6.4) continue
      if (Math.hypot(x - FOUNTAIN.x, z - FOUNTAIN.z) < 2.4) continue
      const hl = houseLocal(x, z)
      if (Math.abs(hl.lx) < 4.4 && Math.abs(hl.lz) < 3.9) continue
      if (Math.hypot(x - POND.x, z - POND.z) < 6.6) continue
      if (Math.hypot(x - WINDMILL.x, z - WINDMILL.z) < 9.5) continue
      const mnl = mansionLocal(x, z)
      if (Math.abs(mnl.lx) < 8.4 && Math.abs(mnl.lz) < 8.9) continue
      if (Math.hypot(x - WELL.x, z - WELL.z) < 1.6) continue
      if (pathDistance(x, z) < 1.9) continue
      let near = false
      for (const t of TREES) {
        if (Math.hypot(t.x - x, t.z - z) < 1.1) {
          near = true
          break
        }
      }
      if (!near) {
        for (const k of ROCKS) {
          if (Math.hypot(k.x - x, k.z - z) < 1.4) {
            near = true
            break
          }
        }
      }
      if (near) continue
      offsets[n * 3] = x
      offsets[n * 3 + 1] = terrainHeight(x, z)
      offsets[n * 3 + 2] = z
      yaws[n] = rng() * Math.PI * 2
      scales[n] = 0.55 + rng() * 0.85
      phases[n] = rng() * Math.PI * 2
      mixes[n] = rng()
      n++
    }
    game.grass = n
    game.grassInst = n

    const base = new THREE.PlaneGeometry(0.1, 1, 1, 3)
    base.translate(0, 0.5, 0)
    const geo = new THREE.InstancedBufferGeometry()
    geo.index = base.index
    geo.setAttribute('position', base.attributes.position)
    geo.setAttribute('uv', base.attributes.uv)
    geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 3))
    geo.setAttribute('aYaw', new THREE.InstancedBufferAttribute(yaws, 1))
    geo.setAttribute('aScale', new THREE.InstancedBufferAttribute(scales, 1))
    geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1))
    geo.setAttribute('aMix', new THREE.InstancedBufferAttribute(mixes, 1))
    geo.instanceCount = n
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 250)

    const mat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uPlayer: { value: new THREE.Vector3() },
        uFogColor: { value: new THREE.Color('#bcd9ee') },
        uCull: { value: LITE ? 70 : 170 },
      },
      vertexShader: grassVert,
      fragmentShader: grassFrag,
    })
    return { geo, mat, count: n }
  }, [])

  const flowers = useMemo(() => {
    const stride = 47
    const cap = Math.floor(grass.count / stride)
    const offsets = new Float32Array(cap * 3)
    const cols = new Float32Array(cap * 3)
    const phases = new Float32Array(cap)
    const rng = mulberry32(4321)
    const src = grass.geo.attributes.aOffset as THREE.InstancedBufferAttribute
    let n = 0
    for (let i = 0; i < cap; i++) {
      const gi = i * stride
      const x = src.array[gi * 3]
      const y = src.array[gi * 3 + 1]
      const z = src.array[gi * 3 + 2]
      offsets[n * 3] = x
      offsets[n * 3 + 1] = y + 0.07
      offsets[n * 3 + 2] = z
      const c = FLOWER_COLORS[Math.floor(rng() * FLOWER_COLORS.length)]
      cols[n * 3] = c[0]
      cols[n * 3 + 1] = c[1]
      cols[n * 3 + 2] = c[2]
      phases[n] = rng() * Math.PI * 2
      n++
    }
    const base = new THREE.PlaneGeometry(0.16, 0.16)
    base.rotateX(-Math.PI / 2)
    const geo = new THREE.InstancedBufferGeometry()
    geo.index = base.index
    geo.setAttribute('position', base.attributes.position)
    geo.setAttribute('uv', base.attributes.uv)
    geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 3))
    geo.setAttribute('aCol', new THREE.InstancedBufferAttribute(cols, 3))
    geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1))
    geo.instanceCount = n
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 250)
    const mat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uFogColor: { value: new THREE.Color('#bcd9ee') },
        uCull: { value: LITE ? 70 : 170 },
      },
      vertexShader: flowerVert,
      fragmentShader: flowerFrag,
    })
    return { geo, mat, count: n }
  }, [grass])

  useEffect(() => {
    return () => {
      grass.geo.dispose()
      grass.mat.dispose()
      flowers.geo.dispose()
      flowers.mat.dispose()
    }
  }, [grass, flowers])

  const grassMesh = useRef<THREE.Mesh>(null)
  const flowerMesh = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    const t0 = performance.now()
    const dt = Math.min(delta, 0.05)
    const st = settings.get()
    grass.mat.uniforms.uTime.value += dt
    grass.mat.uniforms.uPlayer.value.set(game.x, game.y, game.z)
    grass.mat.uniforms.uCull.value = st.renderDistance
    flowers.mat.uniforms.uTime.value += dt
    flowers.mat.uniforms.uCull.value = st.renderDistance
    if (grassMesh.current) grassMesh.current.visible = st.showGrass
    if (flowerMesh.current) flowerMesh.current.visible = st.showGrass
    const gs = perfStore.get().grassScale
    const wantGrass = Math.floor(grass.count * gs)
    if (grass.geo.instanceCount !== wantGrass) {
      grass.geo.instanceCount = wantGrass
      game.grassInst = wantGrass
    }
    const wantFlowers = Math.floor(flowers.count * gs)
    if (flowers.geo.instanceCount !== wantFlowers) flowers.geo.instanceCount = wantFlowers
    endSys('grass', t0)
  })

  return (
    <group name="grass-root">
      <mesh ref={grassMesh} geometry={grass.geo} material={grass.mat} frustumCulled={false} />
      <mesh ref={flowerMesh} geometry={flowers.geo} material={flowers.mat} frustumCulled={false} />
    </group>
  )
}

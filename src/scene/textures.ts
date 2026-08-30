import * as THREE from 'three'
import { fbm } from '../lib/math'

const normalCache = new Map<string, THREE.DataTexture>()

function buildNormalData(size: number) {
  const h = new Float32Array(size * size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      h[y * size + x] = fbm(x * 0.09 + 3.7, y * 0.09 + 8.2, 4)
    }
  }
  const data = new Uint8Array(size * size * 4)
  const at = (x: number, y: number) => h[((y + size) % size) * size + ((x + size) % size)]
  const k = 2.2
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x - 1, y) - at(x + 1, y)) * k
      const dy = (at(x, y - 1) - at(x, y + 1)) * k
      const inv = 1 / Math.hypot(dx, dy, 1)
      const i = (y * size + x) * 4
      data[i] = Math.round((-dx * inv * 0.5 + 0.5) * 255)
      data[i + 1] = Math.round((-dy * inv * 0.5 + 0.5) * 255)
      data[i + 2] = Math.round(inv * 255)
      data[i + 3] = 255
    }
  }
  return data
}

let baseNormal: THREE.DataTexture | null = null

export function getNoiseNormalMap(repeatX: number, repeatY: number) {
  const key = `${repeatX}x${repeatY}`
  const hit = normalCache.get(key)
  if (hit) return hit
  if (!baseNormal) {
    baseNormal = new THREE.DataTexture(buildNormalData(128), 128, 128, THREE.RGBAFormat)
    baseNormal.wrapS = THREE.RepeatWrapping
    baseNormal.wrapT = THREE.RepeatWrapping
    baseNormal.needsUpdate = true
  }
  const tex = baseNormal.clone()
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeatX, repeatY)
  tex.needsUpdate = true
  normalCache.set(key, tex)
  return tex
}

let glassMat: THREE.MeshPhysicalMaterial | null = null
let envBuiltFor: THREE.WebGLRenderer | null = null

export function getGlassMaterial() {
  if (!glassMat) {
    glassMat = new THREE.MeshPhysicalMaterial({
      color: '#cfe4f2',
      metalness: 0.08,
      roughness: 0.06,
      transparent: true,
      opacity: 0.32,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.6,
      emissive: '#3a2408',
      emissiveIntensity: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  }
  return glassMat
}

export function buildGlassEnv(renderer: THREE.WebGLRenderer) {
  const mat = getGlassMaterial()
  if (envBuiltFor === renderer && mat.envMap) return
  envBuiltFor = renderer
  const pmrem = new THREE.PMREMGenerator(renderer)
  const scene = new THREE.Scene()
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(50, 16, 12),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {},
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `varying vec3 vP; void main(){ float h = clamp(normalize(vP).y, 0.0, 1.0); vec3 c = mix(vec3(0.78,0.86,0.92), vec3(0.32,0.58,0.92), pow(h,0.65)); gl_FragColor = vec4(c,1.0); }`,
    })
  )
  scene.add(sky)
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(40, 24).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: '#7d8a58' })
  )
  ground.position.y = -2
  scene.add(ground)
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(4, 12, 8),
    new THREE.MeshBasicMaterial({ color: '#fff0cc' })
  )
  sun.position.set(18, 30, 10)
  scene.add(sun)
  const rt = pmrem.fromScene(scene, 0.05)
  mat.envMap = rt.texture
  mat.needsUpdate = true
  pmrem.dispose()
  sky.geometry.dispose()
  ;(sky.material as THREE.Material).dispose()
  ground.geometry.dispose()
  ;(ground.material as THREE.Material).dispose()
  sun.geometry.dispose()
  ;(sun.material as THREE.Material).dispose()
}

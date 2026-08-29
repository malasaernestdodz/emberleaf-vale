import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const frag = /* glsl */ `
uniform float uTime;
uniform vec3 uSunDir;
varying vec3 vDir;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * noise(p); a *= 0.5; p *= 2.13; }
  return s;
}
void main() {
  vec3 d = normalize(vDir);
  float h = max(d.y, 0.0);
  vec3 col = mix(vec3(0.80, 0.90, 0.97), vec3(0.30, 0.56, 0.92), pow(h, 0.6));
  float sd = max(dot(d, uSunDir), 0.0);
  col += vec3(1.0, 0.85, 0.6) * (pow(sd, 600.0) * 1.4 + pow(sd, 24.0) * 0.14);
  if (d.y > 0.012) {
    vec2 cuv = d.xz / (d.y + 0.14) * 0.30;
    cuv += uTime * vec2(0.006, 0.002);
    float n = fbm(cuv);
    float cl = smoothstep(0.52, 0.80, n) * smoothstep(0.012, 0.10, d.y);
    vec3 cc = mix(vec3(0.74, 0.79, 0.88), vec3(1.02, 1.0, 0.98), smoothstep(0.45, 0.85, n));
    col = mix(col, cc, cl * 0.94);
  }
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export function Sky() {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(26, 42, 14).normalize() },
    }),
    []
  )
  useFrame((_, dt) => {
    uniforms.uTime.value += dt
  })
  return (
    <mesh frustumCulled={false} renderOrder={-10}>
      <sphereGeometry args={[185, 32, 16]} />
      <shaderMaterial side={THREE.BackSide} depthWrite={false} uniforms={uniforms} vertexShader={vert} fragmentShader={frag} />
    </mesh>
  )
}

import { useMemo } from 'react'
import * as THREE from 'three'
import { fbm, lerp, smoothstep } from '../lib/math'
import { HOUSE, PLAZA, POND, pathDistance, terrainHeight } from '../lib/world'
import { getToonRamp } from './toonRamp'

export function Terrain() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(190, 190, 150, 150)
    g.rotateX(-Math.PI / 2)
    const pos = g.attributes.position as THREE.BufferAttribute
    const colors = new Float32Array(pos.count * 3)
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const h = terrainHeight(x, z)
      pos.setY(i, h)
      const mottle = fbm(x * 0.11, z * 0.11, 2)
      const autumn = fbm(x * 0.045 + 31, z * 0.045 + 7, 2)
      let r = lerp(0.30, 0.42, mottle)
      let gg = lerp(0.55, 0.62, mottle)
      let b = lerp(0.24, 0.26, mottle)
      const au = smoothstep(0.6, 0.75, autumn) * 0.7
      r = lerp(r, 0.63, au)
      gg = lerp(gg, 0.66, au)
      b = lerp(b, 0.27, au)
      const dry = smoothstep(1.2, 2.2, h) * 0.5
      r = lerp(r, 0.55, dry)
      gg = lerp(gg, 0.58, dry)
      b = lerp(b, 0.30, dry)
      const pd = pathDistance(x, z)
      const pm = 1 - smoothstep(1.6, 2.6, pd)
      const sn = 0.92 + fbm(x * 0.35, z * 0.35, 2) * 0.16
      r = lerp(r, 0.85 * sn, pm)
      gg = lerp(gg, 0.70 * sn, pm)
      b = lerp(b, 0.47 * sn, pm)
      const pdz = Math.hypot(x - PLAZA.x, z - PLAZA.z)
      const zm = 1 - smoothstep(5.2, 6.0, pdz)
      r = lerp(r, 0.66 * sn, zm)
      gg = lerp(gg, 0.62 * sn, zm)
      b = lerp(b, 0.55 * sn, zm)
      const ring = 1 - smoothstep(2.0, 2.4, pdz)
      r = lerp(r, 0.45, ring)
      gg = lerp(gg, 0.42, ring)
      b = lerp(b, 0.38, ring)
      const ph = Math.hypot(x - HOUSE.x, z - HOUSE.z)
      const hm = 1 - smoothstep(4.5, 7.5, ph)
      r = lerp(r, 0.52, hm)
      gg = lerp(gg, 0.42, hm)
      b = lerp(b, 0.30, hm)
      const pw = Math.hypot(x - POND.x, z - POND.z)
      const wm = 1 - smoothstep(4.0, 6.0, pw)
      r = lerp(r, 0.55, wm)
      gg = lerp(gg, 0.48, wm)
      b = lerp(b, 0.36, wm)
      colors[i * 3] = r
      colors[i * 3 + 1] = gg
      colors[i * 3 + 2] = b
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    g.computeVertexNormals()
    return g
  }, [])

  return (
    <mesh geometry={geo} receiveShadow>
      <meshToonMaterial vertexColors gradientMap={getToonRamp()} />
    </mesh>
  )
}

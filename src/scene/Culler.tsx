import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CULL_DEFS, registerCullable, updateCulling } from '../lib/cull'
import { settings } from '../lib/settings'
import { game } from '../lib/world'

export function Culler() {
  const scene = useThree((s) => s.scene)
  const swept = useRef(false)

  useFrame(() => {
    if (!swept.current) {
      swept.current = true
      const defs = new Set(Object.keys(CULL_DEFS))
      scene.traverse((o) => {
        const id = o.userData?.cullId
        if (typeof id !== 'string' || !defs.has(id)) return
        const def = CULL_DEFS[id]
        const e = registerCullable(id, def.x, def.y, def.z, def.r)
        e.obj = o
      })
    }
    const st = settings.get()
    const fog = scene.fog as THREE.Fog | null
    if (fog) {
      const far = st.showFog ? st.renderDistance : 500
      if (Math.abs(fog.far - far) > 0.25) {
        fog.near = far * 0.35
        fog.far = far
      }
    }
    const res = updateCulling(game.camX, game.camY, game.camZ, st.renderDistance)
    game.cullTotal = res.total
    game.cullVisible = res.visible
  })

  return null
}

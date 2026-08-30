import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { circleWall, obbWall } from '../lib/camera'
import { clamp, damp, lerp } from '../lib/math'
import { notifyInput } from '../lib/input'
import { settings } from '../lib/settings'
import { HOUSE, MANSION, MILL, game, groundHeight, houseLocal, houseWorld, mansionLocal, mansionWorld } from '../lib/world'

export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const gl = useThree((s) => s.gl)
  const pos = useRef(new THREE.Vector3(game.x + 3, game.y + 5, game.z + 8))
  const look = useRef(new THREE.Vector3(game.x, game.y + 1.4, game.z))

  useEffect(() => {
    const el = gl.domElement
    let dragging = false
    let px = 0
    let py = 0
    let downX = 0
    let downY = 0
    const down = (e: PointerEvent) => {
      dragging = true
      px = downX = e.clientX
      py = downY = e.clientY
      el.setPointerCapture(e.pointerId)
      notifyInput()
    }
    const move = (e: PointerEvent) => {
      const st = settings.get()
      if (document.pointerLockElement === el) {
        game.camYaw -= e.movementX * 0.0026 * st.sensitivity
        game.camPitch = clamp(game.camPitch + e.movementY * 0.0022 * st.sensitivity * (st.invertY ? -1 : 1), 0.08, 1.25)
        return
      }
      if (!dragging) return
      game.camYaw -= (e.clientX - px) * 0.0052 * st.sensitivity
      game.camPitch = clamp(game.camPitch + (e.clientY - py) * 0.0045 * st.sensitivity * (st.invertY ? -1 : 1), 0.08, 1.25)
      px = e.clientX
      py = e.clientY
    }
    const up = (e: PointerEvent) => {
      dragging = false
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
      if (Math.hypot(e.clientX - downX, e.clientY - downY) < 6) {
        const p = el.requestPointerLock?.() as unknown as Promise<void> | undefined
        if (p && typeof p.catch === 'function') p.catch(() => {})
      }
    }
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      game.camDist = clamp(game.camDist * Math.exp(e.deltaY * 0.0011), 3, 11)
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('wheel', wheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('wheel', wheel)
    }
  }, [gl])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.25)
    const indoor = Math.max(game.interior, game.interior2, game.interior3)
    const pitch = game.camPitch + indoor * 0.2
    const cp = Math.cos(pitch)
    const dirX = Math.sin(game.camYaw) * cp
    const dirY = Math.sin(pitch)
    const dirZ = Math.cos(game.camYaw) * cp
    const tx = game.x
    const ty = game.y + 1.4
    const tz = game.z

    let allowed = game.camDist * lerp(1, 0.55, indoor)
    if (game.interior > 0.02) {
      const t = obbWall(tx, tz, dirX, dirZ, HOUSE.x, HOUSE.z, HOUSE.w / 2, HOUSE.d / 2, HOUSE.yaw, 0.35)
      if (t < Infinity) allowed = Math.min(allowed, lerp(game.camDist, Math.max(t, 0.5), game.interior))
    }
    if (game.interior2 > 0.02) {
      const t = obbWall(tx, tz, dirX, dirZ, MANSION.x, MANSION.z, MANSION.w / 2, MANSION.d / 2, MANSION.yaw, 0.35)
      if (t < Infinity) allowed = Math.min(allowed, lerp(game.camDist, Math.max(t, 0.5), game.interior2))
    }
    if (game.interior3 > 0.02) {
      const t = circleWall(tx, tz, dirX, dirZ, MILL.x, MILL.z, MILL.rIn - 0.25)
      if (t < Infinity) allowed = Math.min(allowed, lerp(game.camDist, Math.max(t, 0.5), game.interior3))
    }

    const camY = (t: number) => ty + dirY * t
    const wallHouse = obbWall(tx, tz, dirX, dirZ, HOUSE.x, HOUSE.z, HOUSE.w / 2, HOUSE.d / 2, HOUSE.yaw, 0)
    if (wallHouse < Infinity && camY(wallHouse) <= HOUSE.h + 0.2) {
      allowed = Math.min(allowed, Math.max(wallHouse - 0.5, 0.8))
    }
    const wallMansion = obbWall(tx, tz, dirX, dirZ, MANSION.x, MANSION.z, MANSION.w / 2, MANSION.d / 2, MANSION.yaw, 0)
    if (wallMansion < Infinity && camY(wallMansion) <= MANSION.floor2 + 3.1) {
      allowed = Math.min(allowed, Math.max(wallMansion - 0.5, 0.8))
    }
    const wallMill = circleWall(tx, tz, dirX, dirZ, MILL.x, MILL.z, MILL.rWall + 0.18)
    if (wallMill < Infinity && camY(wallMill) <= MILL.base + MILL.top + 0.2) {
      allowed = Math.min(allowed, Math.max(wallMill - 0.5, 0.8))
    }

    pos.current.x = damp(pos.current.x, tx + dirX * allowed, 7, dt)
    pos.current.y = damp(pos.current.y, ty + dirY * allowed, 7, dt)
    pos.current.z = damp(pos.current.z, tz + dirZ * allowed, 7, dt)
    look.current.x = damp(look.current.x, tx, 12, dt)
    look.current.y = damp(look.current.y, ty, 12, dt)
    look.current.z = damp(look.current.z, tz, 12, dt)

    pos.current.y = Math.max(pos.current.y, groundHeight(pos.current.x, pos.current.z, pos.current.y) + 0.35, 0.55)
    if (game.interior > 0.5 && game.inside) {
      const l = houseLocal(pos.current.x, pos.current.z)
      const clx = clamp(l.lx, -3.15, 3.15)
      const clz = clamp(l.lz, -2.65, 2.65)
      if (clx !== l.lx || clz !== l.lz) {
        const w = houseWorld(clx, clz)
        pos.current.x = w.x
        pos.current.z = w.z
      }
      pos.current.y = Math.min(pos.current.y, 2.55)
    }
    if (game.interior2 > 0.5 && game.insideMansion) {
      const m = mansionLocal(pos.current.x, pos.current.z)
      const cmx = clamp(m.lx, -MANSION.w / 2 + 0.35, MANSION.w / 2 - 0.35)
      const cmz = clamp(m.lz, -MANSION.d / 2 + 0.35, MANSION.d / 2 - 0.35)
      if (cmx !== m.lx || cmz !== m.lz) {
        const w = mansionWorld(cmx, cmz)
        pos.current.x = w.x
        pos.current.z = w.z
      }
      pos.current.y = Math.min(pos.current.y, MANSION.floor2 + 2.5)
    }
    if (game.interior3 > 0.5 && Math.hypot(tx - MILL.x, tz - MILL.z) < MILL.rIn + 0.5) {
      const mdx = pos.current.x - MILL.x
      const mdz = pos.current.z - MILL.z
      const dd = Math.hypot(mdx, mdz)
      const cap = MILL.rIn - 0.25
      if (dd > cap) {
        pos.current.x = MILL.x + (mdx / dd) * cap
        pos.current.z = MILL.z + (mdz / dd) * cap
      }
      pos.current.y = Math.min(pos.current.y, MILL.base + MILL.top + 5.5)
    }

    const holdClear = (tIn: number, roofY: number) => {
      const dx = pos.current.x - tx
      const dz = pos.current.z - tz
      if (tIn >= 1 || (dx === 0 && dz === 0)) return
      if (Math.min(pos.current.y, ty + (pos.current.y - ty) * tIn) >= roofY) return
      const s = Math.max(tIn - 0.08, 0)
      pos.current.x = tx + dx * s
      pos.current.y = ty + (pos.current.y - ty) * s
      pos.current.z = tz + dz * s
    }
    holdClear(obbWall(tx, tz, pos.current.x - tx, pos.current.z - tz, HOUSE.x, HOUSE.z, HOUSE.w / 2, HOUSE.d / 2, HOUSE.yaw, 0), HOUSE.h + 0.1)
    holdClear(obbWall(tx, tz, pos.current.x - tx, pos.current.z - tz, MANSION.x, MANSION.z, MANSION.w / 2, MANSION.d / 2, MANSION.yaw, 0), MANSION.floor2 + 3.1)
    holdClear(circleWall(tx, tz, pos.current.x - tx, pos.current.z - tz, MILL.x, MILL.z, MILL.rWall + 0.18), MILL.base + MILL.top + 0.2)

    camera.position.copy(pos.current)
    camera.lookAt(look.current)
    const targetFov = settings.get().fov + game.sprint * 8
    if (Math.abs(camera.fov - targetFov) > 0.05) {
      camera.fov = damp(camera.fov, targetFov, 6, dt)
      camera.updateProjectionMatrix()
    }
    game.camX = pos.current.x
    game.camY = pos.current.y
    game.camZ = pos.current.z
  })

  return null
}

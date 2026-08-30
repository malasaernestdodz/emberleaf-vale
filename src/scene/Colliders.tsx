import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLLIDERS, game } from '../lib/world'
import { colliderBlocks, colliderDims, PLAYER_H } from '../lib/collide'
import { consumeEdge } from '../lib/input'

const MAX_H = 14
const LABEL_RANGE = 6
const PLAYER_R = 0.32

function labelSprite(text: string) {
  const pad = 8
  const canvas = document.createElement('canvas')
  const font = '600 26px Consolas, "Courier New", monospace'
  let ctx = canvas.getContext('2d')!
  ctx.font = font
  const w = Math.ceil(ctx.measureText(text).width) + pad * 2
  const h = 40
  canvas.width = w
  canvas.height = h
  ctx = canvas.getContext('2d')!
  ctx.font = font
  ctx.fillStyle = 'rgba(8, 14, 24, 0.78)'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(150, 215, 255, 0.6)'
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, w - 2, h - 2)
  ctx.fillStyle = '#eaf6ff'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, pad, h / 2 + 1)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.minFilter = THREE.LinearFilter
  tex.generateMipmaps = false
  return { tex, aspect: w / h }
}

export function Colliders() {
  const group = useRef<THREE.Group>(null!)

  const { entries, mats, playerLine } = useMemo(() => {
    const mk = (color: string, opacity: number) =>
      new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthTest: false })
    const mats = {
      boxOn: mk('#ffb35c', 0.95),
      cylOn: mk('#4de3cc', 0.95),
      elevOn: mk('#f472d0', 0.95),
      off: mk('#9db2c7', 0.16),
    }

    const entries = COLLIDERS.map((c, i) => {
      const y0 = c.y0 ?? 0
      const top = c.top ?? Infinity
      const drawTop = Math.min(top, y0 + MAX_H)
      const h = Math.max(drawTop - y0, 0.3)

      const base =
        c.t === 'c'
          ? new THREE.CylinderGeometry(c.r, c.r, h, 12, 1)
          : new THREE.BoxGeometry(c.hw * 2, h, c.hd * 2)
      const line = new THREE.LineSegments(new THREE.EdgesGeometry(base), mats.off)
      line.position.set(c.x, y0 + h / 2, c.z)
      if (c.t === 'b') line.rotation.y = c.yaw
      line.renderOrder = 990
      const dims = colliderDims(c)
      const { tex, aspect } = labelSprite(`#${i} ${dims}${y0 > 0.01 ? ` y0 ${y0.toFixed(2)}` : ''}`)
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
      )
      sprite.scale.set(0.42 * aspect, 0.42, 1)
      sprite.position.set(c.x, drawTop + 0.4, c.z)
      sprite.renderOrder = 1000
      sprite.visible = false

      return { line, sprite, c, y0, r0: c.t === 'c' ? c.r : 0 }
    })

    const playerLine = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.CylinderGeometry(PLAYER_R, PLAYER_R, PLAYER_H, 12, 1)),
      mk('#ffffff', 1)
    )
    playerLine.renderOrder = 995
    return { entries, mats, playerLine }
  }, [])

  useFrame(() => {
    if (consumeEdge('KeyC')) game.showColliders = !game.showColliders
    if (group.current) group.current.visible = game.showColliders
    if (!game.showColliders) return
    const feet = game.y
    for (const e of entries) {
      const active = colliderBlocks(e.c, feet)
      e.line.material = !active
        ? mats.off
        : e.y0 > 0.01
          ? mats.elevOn
          : e.c.t === 'c'
            ? mats.cylOn
            : mats.boxOn
      e.line.position.x = e.c.x
      e.line.position.z = e.c.z
      let shown = true
      if (e.c.t === 'c') {
        const s = e.c.r / e.r0
        shown = s > 0.001
        e.line.visible = shown
        e.line.scale.set(s, 1, s)
      }
      const d = Math.hypot(game.x - e.c.x, game.z - e.c.z)
      e.sprite.visible = shown && d < LABEL_RANGE
      e.sprite.position.x = e.c.x
      e.sprite.position.z = e.c.z
    }
    playerLine.position.set(game.x, feet + PLAYER_H / 2, game.z)
  })

  return (
    <group ref={group} visible={false}>
      {entries.map((e, i) => (
        <primitive key={i} object={e.line} />
      ))}
      {entries.map((e, i) => (
        <primitive key={`s${i}`} object={e.sprite} />
      ))}
      <primitive object={playerLine} />
    </group>
  )
}

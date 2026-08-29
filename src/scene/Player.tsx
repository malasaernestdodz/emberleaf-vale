import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { resolveCollisions } from '../lib/collide'
import { consumeEdge, isDown } from '../lib/input'
import { clamp, damp, dampAngle } from '../lib/math'
import {
  INTERACTABLES,
  MANSION,
  MILL,
  POND,
  TREES,
  WORLD_R,
  game,
  groundHeight,
  mansionLocal,
} from '../lib/world'
import { SLOT_LABELS, SLOT_TYPES, inv, nearestPickup, selected, throwPickup } from '../lib/items'
import { getToonRamp } from './toonRamp'

export function Player() {
  const root = useRef<THREE.Group>(null!)
  const body = useRef<THREE.Group>(null!)
  const armL = useRef<THREE.Group>(null!)
  const armR = useRef<THREE.Group>(null!)
  const legL = useRef<THREE.Group>(null!)
  const legR = useRef<THREE.Group>(null!)
  const axe = useRef<THREE.Group>(null!)
  const rod = useRef<THREE.Group>(null!)
  const bobber = useRef<THREE.Group>(null!)
  const walk = useRef(0)
  const squash = useRef(0)
  const lastW = useRef(-1)
  const sprintLatch = useRef(false)
  const rng = useRef(Math.random)
  const fishT = useRef(0)
  const castTime = useRef(3)
  const biteT = useRef(0)
  const pkRef = useRef<ReturnType<typeof nearestPickup>>(null)
  const chopUntil = useRef(0)
  const woodGiven = useRef(false)

  useFrame((_, delta) => {
    const raw = Math.min(delta, 0.5)
    game.time += raw

    const wDown = isDown('KeyW')
    const wEdge = consumeEdge('KeyW')
    if (wEdge) {
      if (game.time - lastW.current < 0.3) sprintLatch.current = true
      lastW.current = game.time
    }
    if (!wDown) sprintLatch.current = false
    const spaceEdge = consumeEdge('Space')
    const eEdge = consumeEdge('KeyE')
    const gEdge = consumeEdge('KeyG')
    for (let i = 0; i < 4; i++) {
      if (consumeEdge(`Digit${i + 1}`)) selected.slot = i
    }

    if (game.sleeping) {
      game.sleepT += raw
      const t = game.sleepT
      game.sleepVeil = t < 0.9 ? t / 0.9 : t < 2.6 ? 1 : Math.max(0, (3.5 - t) / 0.9)
      if (t > 3.5) {
        game.sleeping = false
        game.sleepVeil = 0
        game.toast = 'You slept until morning'
        game.toastT = 3
      }
    } else {
      game.sleepVeil = Math.max(0, game.sleepVeil - raw * 2)
    }
    if (game.toastT > 0) game.toastT -= raw

    const uiOpen = game.book || game.sleeping

    if (gEdge && !uiOpen && !game.fishing && game.mode === 'walk') {
      const type = SLOT_TYPES[selected.slot]
      if (inv[type] > 0) {
        inv[type]--
        const hx = Math.sin(game.heading)
        const hz = Math.cos(game.heading)
        throwPickup(type, game.x + hx * 0.5, game.y + 1.0, game.z + hz * 0.5, hx, hz)
        game.toast = `Threw the ${SLOT_LABELS[type].toLowerCase()}`
        game.toastT = 1.6
      }
    }

    if (eEdge) {
      if (game.book) {
        game.book = false
      } else if (game.fishing) {
        if (game.bite) {
          inv.fish++
          game.toast = '+1 Fish'
        } else {
          game.toast = 'It got away…'
        }
        game.toastT = 2.5
        game.fishing = false
        game.bite = false
      } else if (game.chop > 0 && game.chop < 1) {
        // mid-swing, ignore
      } else if (!game.sleeping && (game.near === 'bed' || game.near === 'bed2')) {
        game.sleeping = true
        game.sleepT = 0
      } else if (!game.sleeping && game.near === 'book') {
        game.book = true
      } else if (game.near === 'pk' && pkRef.current) {
        const p = pkRef.current
        inv[p.type]++
        p.alive = false
        game.toast = `+1 ${SLOT_LABELS[p.type]}`
        game.toastT = 2
      } else if (game.near === 'chop' && chopUntil.current <= game.time) {
        chopUntil.current = game.time + 1.5
        woodGiven.current = false
      } else if (game.near === 'fish') {
        game.fishing = true
        game.bite = false
        fishT.current = 0
        castTime.current = 2 + rng.current() * 2.5
      }
    }

    if (chopUntil.current > game.time) {
      game.chop = 1 - (chopUntil.current - game.time) / 1.5
      if (!woodGiven.current && game.chop > 0.5) {
        woodGiven.current = true
        inv.wood++
        game.toast = '+1 Wood'
        game.toastT = 2
      }
    } else {
      game.chop = 0
    }

    if (game.fishing) {
      if (!game.bite) {
        fishT.current += raw
        if (fishT.current > castTime.current) {
          game.bite = true
          biteT.current = 1.5
        }
      } else {
        biteT.current -= raw
        if (biteT.current <= 0) {
          game.fishing = false
          game.bite = false
          game.toast = 'It got away…'
          game.toastT = 2.5
        }
      }
    }

    const frozen = uiOpen || game.fishing
    const f = frozen ? 0 : (isDown('ArrowUp', 'KeyW') ? 1 : 0) - (isDown('ArrowDown', 'KeyS') ? 1 : 0)
    const s = frozen ? 0 : (isDown('ArrowRight', 'KeyD') ? 1 : 0) - (isDown('ArrowLeft', 'KeyA') ? 1 : 0)
    const fx = -Math.sin(game.camYaw)
    const fz = -Math.cos(game.camYaw)
    let dx = fx * f - fz * s
    let dz = fz * f + fx * s
    const len = Math.hypot(dx, dz)
    const moving = len > 0.001
    if (moving) {
      dx /= len
      dz /= len
    }
    const ctrl = isDown('ControlLeft', 'ControlRight')
    const sprinting = !frozen && (ctrl || isDown('ShiftLeft', 'ShiftRight') || sprintLatch.current) && f > 0
    game.sprint = damp(game.sprint, sprinting ? 1 : 0, 8, raw)
    const inPond = Math.hypot(game.x - POND.x, game.z - POND.z) < 4.6
    const speed = inPond ? 2.0 : sprinting ? 6.2 : 3.4
    const tx = moving ? dx * speed : 0
    const tz = moving ? dz * speed : 0

    const steps = Math.max(1, Math.ceil(raw / 0.05))
    const sdt = raw / steps
    for (let i = 0; i < steps; i++) {
      game.vx = damp(game.vx, tx, 10, sdt)
      game.vz = damp(game.vz, tz, 10, sdt)
      let nx = game.x + game.vx * sdt
      let nz = game.z + game.vz * sdt
      if (game.grounded && groundHeight(nx, nz) > game.y + 0.55) {
        if (groundHeight(nx, game.z) <= game.y + 0.55) nz = game.z
        else if (groundHeight(game.x, nz) <= game.y + 0.55) nx = game.x
        else {
          nx = game.x
          nz = game.z
        }
      }
      ;[nx, nz] = resolveCollisions(nx, nz, 0.32, game.y)
      const rr = Math.hypot(nx, nz)
      if (rr > WORLD_R - 4) {
        nx = (nx / rr) * (WORLD_R - 4)
        nz = (nz / rr) * (WORLD_R - 4)
      }
      game.x = nx
      game.z = nz
    }

    const gh = groundHeight(game.x, game.z)
    if (spaceEdge && game.grounded && !frozen) {
      game.vy = 5.2
      game.grounded = false
    }
    if (!game.grounded) {
      game.vy -= 16 * raw
      game.y += game.vy * raw
      if (game.y <= gh) {
        if (game.vy < -7) squash.current = 1
        game.y = gh
        game.vy = 0
        game.grounded = true
      }
    } else if (gh < game.y - 0.5) {
      game.grounded = false
    } else {
      game.y = gh
    }
    game.mode = game.grounded ? 'walk' : 'air'

    const mn = mansionLocal(game.x, game.z)
    game.insideMansion = Math.abs(mn.lx) < MANSION.w / 2 - 0.1 && Math.abs(mn.lz) < MANSION.d / 2 - 0.1
    game.interior2 = damp(game.interior2, game.insideMansion ? 1 : 0, 4, raw)
    const mdMill = Math.hypot(game.x - MILL.x, game.z - MILL.z)
    game.interior3 = damp(game.interior3, mdMill < MILL.rIn + 0.5 ? 1 : 0, 4, raw)

    const sp = Math.hypot(game.vx, game.vz)
    if (game.mode === 'walk' && sp > 0.3) {
      game.heading = dampAngle(game.heading, Math.atan2(game.vx, game.vz), 12, raw)
    }
    const k = clamp(sp / 6.2, 0, 1)
    squash.current = Math.max(0, squash.current - raw * 4)
    const chopping = game.chop > 0 && game.chop < 1
    walk.current += raw * (5 + k * (9 + game.sprint * 3))

    if (!game.grounded) {
      armL.current.rotation.x = -0.7 + Math.sin(game.time * 9) * 0.15
      armR.current.rotation.x = -0.7 - Math.sin(game.time * 9) * 0.15
      legL.current.rotation.x = -0.5
      legR.current.rotation.x = 0.35
      body.current.position.y = 0
      body.current.rotation.x = 0.06
      body.current.scale.set(1, 1, 1)
    } else {
      const swing = Math.sin(walk.current) * (0.15 + k * (0.75 + game.sprint * 0.2))
      legL.current.rotation.x = swing
      legR.current.rotation.x = -swing
      armL.current.rotation.x = -swing * (0.8 + game.sprint * 0.5)
      if (game.tool === 'rod') armR.current.rotation.x = -1.0
      else if (chopping) armR.current.rotation.x = -1.6 + Math.sin(game.chop * Math.PI * 4) * 1.2
      else armR.current.rotation.x = swing * (0.8 + game.sprint * 0.5)
      body.current.position.y =
        Math.abs(Math.cos(walk.current)) * (0.045 + game.sprint * 0.02) * k + Math.sin(game.time * 2) * 0.012
      body.current.rotation.x = k * (0.1 + game.sprint * 0.08)
      body.current.scale.set(1 + squash.current * 0.12, 1 - squash.current * 0.18, 1 + squash.current * 0.12)
    }

    root.current.position.set(game.x, game.y, game.z)
    root.current.rotation.y = game.heading

    game.tool = game.fishing ? 'rod' : chopping ? 'axe' : ''
    if (axe.current) axe.current.visible = game.tool === 'axe'
    if (rod.current) rod.current.visible = game.tool === 'rod'
    if (bobber.current) {
      bobber.current.position.y = game.bite ? -0.22 : Math.sin(game.time * 3) * 0.04
      const fishOn = bobber.current.children[1] as THREE.Mesh
      fishOn.visible = game.bite
    }

    let near = ''
    let nearLabel = ''
    if (game.fishing) {
      near = 'fish'
      nearLabel = game.bite ? 'Reel it in!' : 'Fishing…'
    } else if (!uiOpen && game.mode === 'walk') {
      let best = Infinity
      for (const it of INTERACTABLES) {
        const d = Math.hypot(game.x - it.x, game.z - it.z)
        if (d < it.r && d < best) {
          best = d
          near = it.id
          nearLabel = it.label
        }
      }
      pkRef.current = nearestPickup(game.x, game.z)
      if (pkRef.current) {
        const d = Math.hypot(pkRef.current.x - game.x, pkRef.current.z - game.z)
        const word = pkRef.current.type === 'wood' ? 'log' : pkRef.current.type
        if (d < best) {
          near = 'pk'
          nearLabel = `Pick up the ${word}`
        }
      }
      let treeD = Infinity
      for (const t of TREES) {
        const d = Math.hypot(game.x - t.x, game.z - t.z) - 0.5 * t.s
        if (d < 0.85 && d < treeD) treeD = d
      }
      if (treeD < best) {
        near = 'chop'
        nearLabel = 'Chop the tree'
      }
      const pd = Math.hypot(game.x - POND.x, game.z - POND.z)
      if (pd > 4.5 && pd < 8.5) {
        near = 'fish'
        nearLabel = 'Fish'
      }
    } else {
      pkRef.current = null
    }
    game.near = near
    game.nearLabel = nearLabel
  })

  const ramp = getToonRamp()
  return (
    <group ref={root}>
      <group ref={body}>
        <mesh castShadow position={[0, 0.62, 0]}>
          <capsuleGeometry args={[0.26, 0.3, 6, 12]} />
          <meshToonMaterial color="#3fa7a0" gradientMap={ramp} />
        </mesh>
        <mesh castShadow position={[0, 1.18, 0]}>
          <sphereGeometry args={[0.34, 16, 12]} />
          <meshToonMaterial color="#ffe3c2" gradientMap={ramp} />
        </mesh>
        <mesh castShadow position={[0, 1.32, -0.05]} scale={[1, 0.62, 1]}>
          <sphereGeometry args={[0.37, 16, 12]} />
          <meshToonMaterial color="#6b4a2f" gradientMap={ramp} />
        </mesh>
        <mesh position={[-0.12, 1.2, 0.3]}>
          <sphereGeometry args={[0.045, 8, 6]} />
          <meshBasicMaterial color="#2e2a28" />
        </mesh>
        <mesh position={[0.12, 1.2, 0.3]}>
          <sphereGeometry args={[0.045, 8, 6]} />
          <meshBasicMaterial color="#2e2a28" />
        </mesh>
        <group ref={armL} position={[-0.34, 0.82, 0]}>
          <mesh castShadow position={[0, -0.16, 0]}>
            <capsuleGeometry args={[0.08, 0.24, 4, 8]} />
            <meshToonMaterial color="#3fa7a0" gradientMap={ramp} />
          </mesh>
        </group>
        <group ref={armR} position={[0.34, 0.82, 0]}>
          <mesh castShadow position={[0, -0.16, 0]}>
            <capsuleGeometry args={[0.08, 0.24, 4, 8]} />
            <meshToonMaterial color="#3fa7a0" gradientMap={ramp} />
          </mesh>
          <group ref={axe} visible={false} position={[0, -0.36, 0.05]} rotation-x={0.5}>
            <mesh castShadow position={[0, 0.16, 0]}>
              <boxGeometry args={[0.05, 0.62, 0.05]} />
              <meshToonMaterial color="#7a5b3a" gradientMap={ramp} />
            </mesh>
            <mesh castShadow position={[0, 0.44, 0.03]}>
              <boxGeometry args={[0.09, 0.16, 0.22]} />
              <meshToonMaterial color="#8d8578" gradientMap={ramp} />
            </mesh>
          </group>
          <group ref={rod} visible={false} position={[0, -0.34, 0.08]} rotation-x={-1.1}>
            <mesh castShadow position={[0, 0.5, 0]}>
              <cylinderGeometry args={[0.018, 0.024, 1.15, 6]} />
              <meshToonMaterial color="#7a5b3a" gradientMap={ramp} />
            </mesh>
            <mesh position={[0, 1.06, 0.02]}>
              <cylinderGeometry args={[0.008, 0.008, 0.9, 4]} />
              <meshBasicMaterial color="#e8e4d8" />
            </mesh>
            <group ref={bobber} position={[0, 0.62, 0.02]}>
              <mesh>
                <sphereGeometry args={[0.055, 8, 6]} />
                <meshBasicMaterial color="#e86a3a" toneMapped={false} />
              </mesh>
              <mesh visible={false} position={[0, -0.12, 0.14]} rotation-z={1.4}>
                <coneGeometry args={[0.05, 0.2, 6]} />
                <meshToonMaterial color="#5fb8c9" gradientMap={ramp} />
              </mesh>
            </group>
          </group>
        </group>
        <group ref={legL} position={[-0.13, 0.38, 0]}>
          <mesh castShadow position={[0, -0.17, 0]}>
            <capsuleGeometry args={[0.09, 0.2, 4, 8]} />
            <meshToonMaterial color="#4a5a6a" gradientMap={ramp} />
          </mesh>
        </group>
        <group ref={legR} position={[0.13, 0.38, 0]}>
          <mesh castShadow position={[0, -0.17, 0]}>
            <capsuleGeometry args={[0.09, 0.2, 4, 8]} />
            <meshToonMaterial color="#4a5a6a" gradientMap={ramp} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

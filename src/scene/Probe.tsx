import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { aliveCount, inv, selected } from '../lib/items'
import { audioSnapshot } from '../lib/audio'
import { cullEntries, cullVisible } from '../lib/cull'
import { ENTITIES } from '../lib/entities'
import { health } from '../lib/health'
import { perfStore } from '../lib/perf'
import { settings } from '../lib/settings'
import { frameStats } from '../lib/trace'
import { quests, questsDone } from '../lib/quests'
import { SLIME_MAX_HP, SLIME_SPAWN, skipSlimeRespawn, slime, slimeHud } from '../lib/slime'
import { game, houseLocal, mansionLocal, millLocal, MILL } from '../lib/world'
import { wield } from './Player'

const round = (v: number) => Math.round(v * 1000) / 1000
const DOWN = new THREE.Vector3(0, -1, 0)
const rayOrigin = new THREE.Vector3()
const raycaster = new THREE.Raycaster()

export function Probe() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const first = useRef(false)

  useEffect(() => {
    gl.info.autoReset = false
  }, [gl])

  useEffect(() => {
    ;(window as unknown as { __Ghibli: unknown }).__Ghibli = {
      snapshot: () => ({
        ready: game.ready,
        t: round(game.time),
        x: round(game.x),
        y: round(game.y),
        z: round(game.z),
        heading: round(game.heading),
        camYaw: round(game.camYaw),
        camPitch: round(game.camPitch),
        camDist: round(game.camDist),
        camX: round(game.camX),
        camY: round(game.camY),
        camZ: round(game.camZ),
        lx: round(houseLocal(game.x, game.z).lx),
        lz: round(houseLocal(game.x, game.z).lz),
        mlx: round(mansionLocal(game.x, game.z).lx),
        mlz: round(mansionLocal(game.x, game.z).lz),
        mllx: round(millLocal(game.x, game.z).lx),
        mllz: round(millLocal(game.x, game.z).lz),
        inside: game.inside,
        insideMansion: game.insideMansion,
        interior: round(game.interior),
        mode: game.mode,
        grounded: game.grounded,
        sprint: round(game.sprint),
        buff: round(game.buff),
        tool: game.tool,
        chop: round(game.chop),
        attack: round(game.attack),
        colliders: game.showColliders,
        colSolid: game.colliderSolid,
        near: game.near,
        nearLabel: game.nearLabel,
        fishing: game.fishing,
        bite: game.bite,
        veil: round(game.sleepVeil),
        inv: { ...inv },
        slot: selected.slot,
        pickups: aliveCount(),
        menu: game.menu,
        quests: {
          ver: game.questVer,
          done: questsDone(),
          list: quests.map((q) => ({ id: q.id, progress: q.progress, target: q.target, done: q.done })),
        },
        audio: audioSnapshot(),
        hp: health.hp,
        maxHp: health.maxHp,
        hurt: round(health.hurtT),
        invuln: round(health.invulnT),
        fainted: health.fainted,
        faintVeil: round(health.faintVeil),
        wield: { ...wield },
        slime: {
          x: round(slime.x),
          y: round(slime.y),
          z: round(slime.z),
          state: slime.state,
          maxHp: slime.maxHp,
          hp: slime.hp,
          hits: slime.hits,
          visible: slime.state !== 'hidden',
          spawnX: round(SLIME_SPAWN.x),
          spawnZ: round(SLIME_SPAWN.z),
        },
        slimeHud: { ...slimeHud },
        slimeMaxHp: SLIME_MAX_HP,
        millBase: round(MILL.base),
        windmill: round(game.windmill),
        fps: Math.round(game.fps),
        wallFps: Math.round(game.wallFps),
        culled: { visible: game.cullVisible, total: game.cullTotal },
        settings: { ...settings.get() },
        fov: round(camera.fov),
        fogFar: round((scene.fog as THREE.Fog | null)?.far ?? 0),
        grass: game.grass,
        grassInst: game.grassInst,
        drawCalls: game.drawCalls,
        tris: game.tris,
        trees: game.trees,
        rocks: game.rocks,
        tier: perfStore.get().tier,
        autoTune: perfStore.get().auto,
        dpr: round(gl.getPixelRatio()),
        frameP50: round(frameStats().p50),
        frameP95: round(frameStats().p95),
        showPerf: game.showPerf,
      }),
      teleport: (x: number, z: number, high = false) => game.teleport(x, z, high),
      raycastDown: (x: number, z: number, fromY: number) => {
        rayOrigin.set(x, fromY, z)
        raycaster.set(rayOrigin, DOWN)
        raycaster.far = fromY + 30
        const meshes: THREE.Mesh[] = []
        scene.traverse((o) => {
          const m = o as THREE.Mesh
          if (!m.isMesh) return
          if ((m as THREE.InstancedMesh).isInstancedMesh) return
          let p: THREE.Object3D | null = o
          while (p) {
            if (!p.visible) return
            p = p.parent
          }
          meshes.push(m)
        })
        const hits = raycaster.intersectObjects(meshes, false)
        return hits.length ? round(hits[0].point.y) : null
      },
      setCamYaw: (y: number) => {
        game.camYaw = y
      },
      face: (x: number, z: number) => {
        game.heading = Math.atan2(x - game.x, z - game.z)
      },
      setMenu: (open: boolean) => {
        game.menu = open
        if (open) document.exitPointerLock()
      },
      cullList: () =>
        cullEntries().map((e) => ({
          id: e.id,
          visible: e.visible,
          r: e.r,
          dist: round(Math.hypot(e.x - game.camX, e.y - game.camY, e.z - game.camZ)),
        })),
      entityAudit: () => {
        const inScene = new Set<string>()
        scene.traverse((o) => {
          const id = o.userData?.cullId
          if (typeof id === 'string') inScene.add(id)
        })
        const registered = new Set(cullEntries().map((e) => e.id))
        return {
          entities: ENTITIES.map((def) => ({
            id: def.id,
            name: def.name,
            kind: def.kind,
            description: def.description,
            features: [...def.features],
            meshPresent: inScene.has(def.id),
            cullRegistered: registered.has(def.id),
            cullVisible: cullVisible(def.id),
          })),
          sceneOnlyIds: [...inScene].filter((id) => !ENTITIES.some((def) => def.id === id)),
        }
      },
      cullVisible: (id: string) => cullVisible(id),
      setRenderDistance: (v: number) => settings.set({ renderDistance: v }),
      objectVisible: (name: string, child = -1) => {
        const o = scene.getObjectByName(name)
        if (!o) return null
        if (child < 0) return o.visible
        return o.children[child]?.visible ?? null
      },
      skipSlimeRespawn: () => skipSlimeRespawn(),
    }
  }, [])

  useFrame((_, delta) => {
    const dt = Math.max(delta, 1e-4)
    game.fps += (1 / dt - game.fps) * 0.05
    game.drawCalls = gl.info.render.calls
    game.tris = gl.info.render.triangles
    gl.info.reset()
    if (!first.current && game.drawCalls > 0) {
      first.current = true
      game.ready = true
    }
  })

  return null
}

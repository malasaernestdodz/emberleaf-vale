import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { aliveCount, inv, selected } from '../lib/items'
import { audioSnapshot } from '../lib/audio'
import { quests, questsDone } from '../lib/quests'
import { SLIME_SPAWN, skipSlimeRespawn, slime } from '../lib/slime'
import { game, houseLocal, mansionLocal, millLocal, MILL } from '../lib/world'

const round = (v: number) => Math.round(v * 1000) / 1000

export function Probe() {
  const gl = useThree((s) => s.gl)
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
        mode: game.mode,
        grounded: game.grounded,
        sprint: round(game.sprint),
        buff: round(game.buff),
        tool: game.tool,
        chop: round(game.chop),
        attack: round(game.attack),
        colliders: game.showColliders,
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
        slime: {
          x: round(slime.x),
          y: round(slime.y),
          z: round(slime.z),
          state: slime.state,
          hits: slime.hits,
          visible: slime.state !== 'hidden',
          spawnX: round(SLIME_SPAWN.x),
          spawnZ: round(SLIME_SPAWN.z),
        },
        millBase: round(MILL.base),
        windmill: round(game.windmill),
        fps: Math.round(game.fps),
        grass: game.grass,
        drawCalls: game.drawCalls,
        tris: game.tris,
        trees: game.trees,
        rocks: game.rocks,
      }),
      teleport: (x: number, z: number) => game.teleport(x, z),
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

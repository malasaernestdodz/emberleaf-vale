import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Lights } from './Lights'
import { Sky } from './Sky'
import { Terrain } from './Terrain'
import { Grass } from './Grass'
import { Trees } from './Trees'
import { Pond } from './Pond'
import { House } from './House'
import { Mansion } from './Mansion'
import { Windmill } from './Windmill'
import { Fountain } from './Fountain'
import { Well } from './Well'
import { FishingFx } from './FishingFx'
import { Slime } from './Slime'
import { SlashFx } from './SlashFx'
import { Air, Butterflies } from './Air'
import { Pickups } from './Pickups'
import { Player } from './Player'
import { Colliders } from './Colliders'
import { CameraRig } from './CameraRig'
import { Culler } from './Culler'
import { Perf } from './Perf'
import { Probe } from './Probe'
import { Effects } from './Effects'
import { buildGlassEnv } from './textures'

function SceneEnv() {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    buildGlassEnv(gl)
  }, [gl])
  return null
}

export function World() {
  return (
    <>
      <fog attach="fog" args={['#bcd9ee', 60, 170]} />
      <SceneEnv />
      <Lights />
      <Sky />
      <Terrain />
      <Grass />
      <Trees />
      <Pond />
      <House />
      <Mansion />
      <Windmill />
      <Fountain />
      <Well />
      <Air />
      <Butterflies />
      <FishingFx />
      <Slime />
      <Pickups />
      <Player />
      <SlashFx />
      <Colliders />
      <CameraRig />
      <Culler />
      <Perf />
      <Probe />
      <Effects />
    </>
  )
}

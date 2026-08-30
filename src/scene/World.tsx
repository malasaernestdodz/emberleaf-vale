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
import { Air, Butterflies } from './Air'
import { Pickups } from './Pickups'
import { Player } from './Player'
import { Colliders } from './Colliders'
import { CameraRig } from './CameraRig'
import { Probe } from './Probe'
import { Effects } from './Effects'

export function World() {
  return (
    <>
      <fog attach="fog" args={['#bcd9ee', 60, 170]} />
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
      <Colliders />
      <CameraRig />
      <Probe />
      <Effects />
    </>
  )
}

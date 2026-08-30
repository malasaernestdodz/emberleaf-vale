import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { LITE } from '../lib/flags'
import { QUALITY_MAP, settings } from '../lib/settings'

export function Effects() {
  const q = QUALITY_MAP[settings.get().quality]
  return (
    <EffectComposer multisampling={LITE ? 0 : q.msaa}>
      {q.bloom && !LITE ? (
        <Bloom mipmapBlur intensity={0.5} luminanceThreshold={0.72} luminanceSmoothing={0.15} radius={0.7} />
      ) : null}
      <Vignette offset={0.28} darkness={0.62} />
    </EffectComposer>
  )
}

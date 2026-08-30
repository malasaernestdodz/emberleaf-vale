import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { LITE } from '../lib/flags'
import { QUALITY_MAP, useSettings } from '../lib/settings'
import { usePerf } from '../lib/perf'

export function Effects() {
  const q = QUALITY_MAP[useSettings().quality]
  const perf = usePerf()
  const bloom = !LITE && perf.auto ? perf.bloom && q.bloom : q.bloom && !LITE
  const msaa = LITE ? 0 : q.msaa
  return (
    <EffectComposer multisampling={msaa} key={`${bloom ? 'b' : 'n'}-${msaa}`}>
      {bloom ? (
        <Bloom mipmapBlur intensity={0.5} luminanceThreshold={0.72} luminanceSmoothing={0.15} radius={0.7} />
      ) : null}
      <Vignette offset={0.28} darkness={0.62} />
    </EffectComposer>
  )
}

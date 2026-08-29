import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

export function Effects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom mipmapBlur intensity={0.5} luminanceThreshold={0.72} luminanceSmoothing={0.15} radius={0.7} />
      <Vignette offset={0.28} darkness={0.62} />
    </EffectComposer>
  )
}

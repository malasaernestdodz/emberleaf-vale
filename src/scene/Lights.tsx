import { LITE } from '../lib/flags'
import { QUALITY_MAP, useSettings } from '../lib/settings'

export function Lights() {
  const q = QUALITY_MAP[useSettings().quality]
  return (
    <>
      <hemisphereLight args={['#bfe3ff', '#8a7a55', 1.1]} />
      <directionalLight
        castShadow={!LITE && q.shadows}
        position={[26, 42, 14]}
        intensity={3}
        color="#fff2d8"
        shadow-mapSize-width={q.shadowSize}
        shadow-mapSize-height={q.shadowSize}
        shadow-camera-left={-36}
        shadow-camera-right={36}
        shadow-camera-top={36}
        shadow-camera-bottom={-36}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-bias={-0.0004}
        shadow-normalBias={0.5}
      />
    </>
  )
}

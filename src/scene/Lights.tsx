export function Lights() {
  return (
    <>
      <hemisphereLight args={['#bfe3ff', '#8a7a55', 1.1]} />
      <directionalLight
        castShadow
        position={[26, 42, 14]}
        intensity={3}
        color="#fff2d8"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
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

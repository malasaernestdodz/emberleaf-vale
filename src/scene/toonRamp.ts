import * as THREE from 'three'

let ramp: THREE.DataTexture | null = null

export function getToonRamp() {
  if (!ramp) {
    const data = new Uint8Array([90, 150, 210, 255])
    ramp = new THREE.DataTexture(data, 4, 1, THREE.RedFormat)
    ramp.minFilter = THREE.NearestFilter
    ramp.magFilter = THREE.NearestFilter
    ramp.generateMipmaps = false
    ramp.needsUpdate = true
  }
  return ramp
}

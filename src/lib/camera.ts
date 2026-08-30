export function obbWall(
  px: number,
  pz: number,
  dx: number,
  dz: number,
  cx: number,
  cz: number,
  hw: number,
  hd: number,
  yaw: number,
  margin: number
) {
  const c = Math.cos(yaw)
  const s = Math.sin(yaw)
  const lx = c * (px - cx) - s * (pz - cz)
  const lz = s * (px - cx) + c * (pz - cz)
  const ldx = c * dx - s * dz
  const ldz = s * dx + c * dz
  const ax = hw - margin
  const az = hd - margin
  const inside = Math.abs(lx) < ax && Math.abs(lz) < az
  let tNear = -Infinity
  let tFar = Infinity
  if (Math.abs(ldx) < 1e-6) {
    if (Math.abs(lx) >= ax) return Infinity
  } else {
    const t1 = (-ax - lx) / ldx
    const t2 = (ax - lx) / ldx
    tNear = Math.max(tNear, Math.min(t1, t2))
    tFar = Math.min(tFar, Math.max(t1, t2))
  }
  if (Math.abs(ldz) < 1e-6) {
    if (Math.abs(lz) >= az) return Infinity
  } else {
    const t1 = (-az - lz) / ldz
    const t2 = (az - lz) / ldz
    tNear = Math.max(tNear, Math.min(t1, t2))
    tFar = Math.min(tFar, Math.max(t1, t2))
  }
  if (tFar < tNear) return Infinity
  if (inside) return tFar
  return tNear >= 0 ? tNear : Infinity
}

export function circleWall(px: number, pz: number, dx: number, dz: number, cx: number, cz: number, R: number) {
  const ox = px - cx
  const oz = pz - cz
  const bq = ox * dx + oz * dz
  const cq = ox * ox + oz * oz - R * R
  const disc = bq * bq - cq
  if (disc < 0) return Infinity
  if (cq <= 0) return -bq + Math.sqrt(disc)
  const t = -bq - Math.sqrt(disc)
  return t >= 0 ? t : Infinity
}

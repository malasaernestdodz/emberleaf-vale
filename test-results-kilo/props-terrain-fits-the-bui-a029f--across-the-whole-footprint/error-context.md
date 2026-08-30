# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: props.spec.ts >> terrain fits the buildings >> grade stays below the house floor across the whole footprint
- Location: e2e\props.spec.ts:111:3

# Error details

```
Error: expect(received).toBeLessThanOrEqual(expected)

Expected: <= 0.13
Received:    5.325822337803232
```

# Test source

```ts
  17  | const circleClearOfSegment = (ax: number, az: number, bx: number, bz: number, c: P2, r: number) => {
  18  |   const abx = bx - ax
  19  |   const abz = bz - az
  20  |   const l2 = abx * abx + abz * abz || 1e-9
  21  |   let t = ((c.x - ax) * abx + (c.z - az) * abz) / l2
  22  |   t = Math.max(0, Math.min(1, t))
  23  |   return dist2(ax + abx * t, az + abz * t, c.x, c.z) - r
  24  | }
  25  | 
  26  | const leafPose = (d: typeof HOUSE_DOOR) => ({
  27  |   ax: d.hingeLX,
  28  |   az: d.leafZ,
  29  |   bx: d.hingeLX + Math.cos(d.swing) * d.openW,
  30  |   bz: d.leafZ - Math.sin(d.swing) * d.openW,
  31  | })
  32  | 
  33  | test.describe('house door assembly', () => {
  34  |   const d = HOUSE_DOOR
  35  | 
  36  |   test('leaf fills the wall opening edge to edge', () => {
  37  |     expect(d.openW).toBe(HOUSE.doorW)
  38  |     expect(d.openH).toBeCloseTo(2.1, 6)
  39  |     expect(d.hingeLX).toBeCloseTo(HOUSE.doorLX - HOUSE.doorW / 2, 6)
  40  |     expect(d.hingeLX + d.openW).toBeCloseTo(HOUSE.doorLX + HOUSE.doorW / 2, 6)
  41  |     expect(d.openH).toBeLessThanOrEqual(2.1 + 1e-9)
  42  |   })
  43  | 
  44  |   test('open leaf lies flat inside, clear of wall, frame, walk corridor and furniture', () => {
  45  |     expect(d.swing).toBeGreaterThan(2.5)
  46  |     expect(d.swing).toBeLessThanOrEqual(Math.PI)
  47  |     const p = leafPose(d)
  48  |     expect(p.bz).toBeLessThan(p.az)
  49  |     expect(p.bz).toBeLessThan(HOUSE.d / 2 - 0.32)
  50  |     expect(d.leafZ + d.leafT / 2).toBeLessThanOrEqual(HOUSE.d / 2 - 0.11)
  51  |     expect(d.frameZ - (d.leafZ + d.leafT / 2)).toBeGreaterThanOrEqual(0.02)
  52  |     const walk: P2 = { x: HOUSE.doorLX, z: HOUSE.d / 2 - 0.6 }
  53  |     expect(circleClearOfSegment(p.ax, p.az, p.bx, p.bz, walk, 0.37)).toBeGreaterThan(0)
  54  |     const obstacles: (P2 & { r: number })[] = [
  55  |       { x: 1.9, z: 0.8, r: 0.85 },
  56  |       { x: 2.6, z: 0.2, r: 0.28 },
  57  |       { x: 2.5, z: 1.4, r: 0.28 },
  58  |       { x: -2.4, z: -1.5, r: 1.45 },
  59  |       { x: 0.3, z: 0.4, r: 1.6 },
  60  |     ]
  61  |     for (const o of obstacles) {
  62  |       expect(circleClearOfSegment(p.ax, p.az, p.bx, p.bz, o, o.r + 0.05)).toBeGreaterThan(0)
  63  |     }
  64  |   })
  65  | })
  66  | 
  67  | test.describe('mansion door assembly', () => {
  68  |   const d = MANSION_DOOR
  69  | 
  70  |   test('leaf fills the wall opening edge to edge', () => {
  71  |     expect(d.openW).toBeCloseTo(1.8, 6)
  72  |     expect(d.openH).toBeCloseTo(2.6, 6)
  73  |     expect(d.hingeLX).toBeCloseTo(-1.8, 6)
  74  |     expect(d.hingeLX + d.openW).toBeCloseTo(0, 6)
  75  |   })
  76  | 
  77  |   test('jamb posts flank the opening instead of standing in it', () => {
  78  |     expect(d.jambPosts[0] + d.jambPostHalfW).toBeLessThanOrEqual(d.hingeLX + 1e-9)
  79  |     expect(d.jambPosts[1] - d.jambPostHalfW).toBeGreaterThanOrEqual(d.hingeLX + d.openW - 1e-9)
  80  |   })
  81  | 
  82  |   test('open leaf lies flat inside, clear of wall, frame, walk corridor and furniture', () => {
  83  |     expect(d.swing).toBeGreaterThan(2.5)
  84  |     expect(d.swing).toBeLessThanOrEqual(Math.PI)
  85  |     const p = leafPose(d)
  86  |     expect(p.bz).toBeLessThan(p.az)
  87  |     expect(p.bz).toBeLessThan(MANSION.d / 2 - 0.32)
  88  |     expect(d.leafZ + d.leafT / 2).toBeLessThanOrEqual(MANSION.d / 2 - 0.11)
  89  |     expect(d.frameZ - (d.leafZ + d.leafT / 2)).toBeGreaterThanOrEqual(0.02)
  90  |     expect(d.lintelY).toBeGreaterThanOrEqual(d.openH + 0.05)
  91  |     const walk: P2 = { x: d.hingeLX + d.openW / 2, z: MANSION.d / 2 - 0.6 }
  92  |     expect(circleClearOfSegment(p.ax, p.az, p.bx, p.bz, walk, 0.37)).toBeGreaterThan(0)
  93  |     const obstacles: (P2 & { r: number })[] = [
  94  |       { x: -1.9, z: 0.95, r: 0.3 },
  95  |       { x: -1.9, z: 2.05, r: 0.3 },
  96  |       { x: 1.9, z: 0.95, r: 0.3 },
  97  |       { x: 1.9, z: 2.05, r: 0.3 },
  98  |       { x: 0, z: 1.5, r: 2.0 },
  99  |       { x: 3.5, z: -3.0, r: 1.3 },
  100 |       { x: -7.05, z: 0.5, r: 1.6 },
  101 |       { x: -6.8, z: 5.2, r: 0.4 },
  102 |       { x: -6.8, z: -0.8, r: 0.4 },
  103 |     ]
  104 |     for (const o of obstacles) {
  105 |       expect(circleClearOfSegment(p.ax, p.az, p.bx, p.bz, o, o.r + 0.05)).toBeGreaterThan(0)
  106 |     }
  107 |   })
  108 | })
  109 | 
  110 | test.describe('terrain fits the buildings', () => {
  111 |   test('grade stays below the house floor across the whole footprint', () => {
  112 |     for (let ix = 0; ix <= 13; ix++) {
  113 |       for (let iz = 0; iz <= 11; iz++) {
  114 |         const lx = -3.4 + (ix / 13) * 6.8
  115 |         const lz = -2.9 + (iz / 11) * 5.8
  116 |         const w = houseWorld(lx, lz)
> 117 |         expect(terrainHeight(w.x, w.z)).toBeLessThanOrEqual(0.13)
      |                                         ^ Error: expect(received).toBeLessThanOrEqual(expected)
  118 |         expect(groundHeight(w.x, w.z)).toBeGreaterThanOrEqual(0.18)
  119 |       }
  120 |     }
  121 |   })
  122 | 
  123 |   test('grade stays below the mansion floor across the whole footprint', () => {
  124 |     for (let ix = 0; ix <= 15; ix++) {
  125 |       for (let iz = 0; iz <= 13; iz++) {
  126 |         const lx = -7.3 + (ix / 15) * 14.6
  127 |         const lz = -5.8 + (iz / 13) * 11.6
  128 |         const w = mansionWorld(lx, lz)
  129 |         expect(terrainHeight(w.x, w.z)).toBeLessThanOrEqual(0.2)
  130 |         expect(groundHeight(w.x, w.z)).toBeGreaterThanOrEqual(MANSION.floorY - 0.001)
  131 |       }
  132 |     }
  133 |   })
  134 | 
  135 |   test('grade hugs the walls so bases are neither buried nor floating', () => {
  136 |     for (const s of [-1, 1]) {
  137 |       const w1 = houseWorld(s * (HOUSE.w / 2 - 0.3), HOUSE.d / 2 + 0.6)
  138 |       const w2 = houseWorld(s * (HOUSE.w / 2 - 0.3), -HOUSE.d / 2 - 0.6)
  139 |       const w3 = houseWorld(HOUSE.w / 2 + 0.6, s * (HOUSE.d / 2 - 0.3))
  140 |       for (const w of [w1, w2, w3]) {
  141 |         expect(terrainHeight(w.x, w.z)).toBeLessThanOrEqual(0.18)
  142 |       }
  143 |       const m1 = mansionWorld(s * (MANSION.w / 2 - 0.4), MANSION.d / 2 + 0.6)
  144 |       const m2 = mansionWorld(s * (MANSION.w / 2 - 0.4), -MANSION.d / 2 - 0.6)
  145 |       const m3 = mansionWorld(MANSION.w / 2 + 0.6, s * (MANSION.d / 2 - 0.4))
  146 |       for (const m of [m1, m2, m3]) {
  147 |         expect(terrainHeight(m.x, m.z)).toBeLessThanOrEqual(MANSION.floorY)
  148 |       }
  149 |     }
  150 |   })
  151 | 
  152 |   test('door thresholds are walkable with no collider in the opening', () => {
  153 |     for (const frac of [-0.35, 0, 0.35]) {
  154 |       const h = houseWorld(HOUSE.doorLX + frac * HOUSE.doorW, HOUSE.d / 2)
  155 |       expect(groundHeight(h.x, h.z, 0.2)).toBeLessThan(0.2)
  156 |       const m = mansionWorld(MANSION_DOOR.hingeLX + MANSION_DOOR.openW / 2 + frac * MANSION_DOOR.openW, MANSION.d / 2)
  157 |       const g = groundHeight(m.x, m.z, MANSION.floorY)
  158 |       expect(g).toBeGreaterThanOrEqual(MANSION.floorY - 0.35)
  159 |       expect(g).toBeLessThan(0.6)
  160 |     }
  161 |   })
  162 | 
  163 |   test('door thresholds stay walkable end to end', () => {
  164 |     for (const frac of [-0.35, 0, 0.35]) {
  165 |       const h = houseWorld(HOUSE.doorLX + frac * HOUSE.doorW, HOUSE.d / 2)
  166 |       expect(groundHeight(h.x, h.z, 0.2)).toBeLessThan(0.2)
  167 |       const m = mansionWorld(MANSION_DOOR.hingeLX + MANSION_DOOR.openW / 2 + frac * MANSION_DOOR.openW, MANSION.d / 2)
  168 |       const g = groundHeight(m.x, m.z, MANSION.floorY)
  169 |       expect(g).toBeGreaterThanOrEqual(MANSION.floorY - 0.35)
  170 |       expect(g).toBeLessThan(0.6)
  171 |     }
  172 |   })
  173 | })
  174 | 
```
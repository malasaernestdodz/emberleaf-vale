# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: math.spec.ts >> windmill porch, skirt and entry steps match the plinth mesh
- Location: e2e\math.spec.ts:87:1

# Error details

```
Error: expect(received).toBeLessThan(expected)

Expected: < 5.66174935026625
Received:   6.36174935026625
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | import {
  3   |   FOUNTAIN,
  4   |   HOUSE,
  5   |   HOUSE_ROOF_PROFILE,
  6   |   MANSION,
  7   |   MANSION_STAIR,
  8   |   MANSION_STAIRWELL,
  9   |   MILL,
  10  |   MILL_ARC,
  11  |   WELL,
  12  |   WORLD_R,
  13  |   groundHeight,
  14  |   houseRoofY,
  15  |   houseWorld,
  16  |   mansionWorld,
  17  |   millWorld,
  18  |   terrainHeight,
  19  | } from '../src/lib/world'
  20  | 
  21  | const TAU = Math.PI * 2
  22  | 
  23  | test('house floor height applies inside the footprint', () => {
  24  |   const c = houseWorld(0, 0)
  25  |   expect(groundHeight(c.x, c.z, 0.19)).toBeCloseTo(0.19, 2)
  26  |   const roof = groundHeight(c.x, c.z, 5.0)
  27  |   expect(roof).toBeGreaterThan(3)
  28  |   const outside = houseWorld(HOUSE.w, 0)
  29  |   expect(groundHeight(outside.x, outside.z)).toBeLessThan(0.19)
  30  | })
  31  | 
  32  | test('mansion has two distinct floor heights and a continuous stair', () => {
  33  |   const hall = mansionWorld(-3, 2)
  34  |   expect(groundHeight(hall.x, hall.z)).toBeCloseTo(MANSION.floorY, 2)
  35  |   const slab = mansionWorld(4.5, -4)
  36  |   expect(groundHeight(slab.x, slab.z, MANSION.floor2)).toBeCloseTo(MANSION.floor2, 2)
  37  |   expect(groundHeight(slab.x, slab.z, 0.3)).toBeCloseTo(MANSION.floorY, 2)
  38  |   const well = mansionWorld(-0.2, -5)
  39  |   const wellH = groundHeight(well.x, well.z, MANSION.floor2)
  40  |   expect(wellH).toBeGreaterThan(MANSION.floorY)
  41  |   expect(wellH).toBeLessThan(MANSION.floor2 - 0.3)
  42  |   const st = MANSION_STAIR
  43  |   let prev = MANSION.floorY
  44  |   for (let i = 1; i <= 12; i++) {
  45  |     const lx = st.lx0 + 0.2 + (i / 12) * (st.lx1 - st.lx0 - 0.4)
  46  |     const p = mansionWorld(lx, (st.lz0 + st.lz1) / 2)
  47  |     const h = groundHeight(p.x, p.z, MANSION.floor2)
  48  |     expect(h).toBeGreaterThanOrEqual(prev - 0.01)
  49  |     expect(h).toBeLessThanOrEqual(MANSION.floor2 + 0.01)
  50  |     prev = h
  51  |   }
  52  |   expect(prev).toBeGreaterThan(MANSION.floor2 - 0.25)
  53  |   const holeEdge = mansionWorld(MANSION_STAIRWELL.lx1 - 0.05, -5)
  54  |   expect(groundHeight(holeEdge.x, holeEdge.z, MANSION.floor2)).toBeCloseTo(MANSION.floor2, 2)
  55  | })
  56  | 
  57  | test('windmill spiral rises monotonically with no seams above step height', () => {
  58  |   let prev = MILL.base
  59  |   for (let i = 0; i <= 60; i++) {
  60  |     const phi = MILL.doorPhi + 0.05 + (i / 60) * (MILL_ARC - 0.1)
  61  |     const p = millWorld(-Math.sin(phi) * 2.05, Math.cos(phi) * 2.05)
  62  |     const h = groundHeight(p.x, p.z)
  63  |     expect(h).toBeGreaterThanOrEqual(prev - 0.01)
  64  |     expect(h).toBeLessThanOrEqual(MILL.base + MILL.top + 0.01)
  65  |     prev = h
  66  |   }
  67  |   expect(prev).toBeGreaterThan(MILL.base + MILL.top - 0.3)
  68  |   const center = millWorld(0, 0)
  69  |   expect(groundHeight(center.x, center.z)).toBeCloseTo(MILL.base + MILL.floorH, 1)
  70  |   const doorWedge = millWorld(-Math.sin(0.1) * 2.0, Math.cos(0.1) * 2.0)
  71  |   expect(groundHeight(doorWedge.x, doorWedge.z)).toBeCloseTo(MILL.base + MILL.floorH, 1)
  72  |   const underSpiral = millWorld(-Math.sin(Math.PI) * 1.5, Math.cos(Math.PI) * 1.5)
  73  |   expect(groundHeight(underSpiral.x, underSpiral.z)).toBeCloseTo(MILL.base + MILL.floorH, 1)
  74  |   const rampMid = millWorld(-Math.sin(Math.PI) * 2.5, Math.cos(Math.PI) * 2.5)
  75  |   const midRamp = groundHeight(rampMid.x, rampMid.z)
  76  |   expect(midRamp).toBeGreaterThan(MILL.base + MILL.floorH + 2)
  77  |   expect(groundHeight(rampMid.x, rampMid.z, MILL.base + 0.2)).toBeCloseTo(MILL.base + MILL.floorH, 1)
  78  |   const landingPhi = TAU - MILL.doorPhi - MILL.topPhi / 2
  79  |   const landing = millWorld(-Math.sin(landingPhi) * 2.05, Math.cos(landingPhi) * 2.05)
  80  |   expect(groundHeight(landing.x, landing.z)).toBeCloseTo(MILL.base + MILL.top, 2)
  81  |   const gap = Math.abs(
  82  |     MILL.top - MILL.floorH - ((MILL_ARC - MILL.topPhi) / MILL_ARC) * (MILL.top - MILL.floorH)
  83  |   )
  84  |   expect(gap).toBeLessThan(0.55)
  85  | })
  86  | 
  87  | test('windmill porch, skirt and entry steps match the plinth mesh', () => {
  88  |   const porch = millWorld(0, MILL.porchR - 0.2)
  89  |   expect(groundHeight(porch.x, porch.z)).toBeCloseTo(MILL.base + MILL.floorH, 2)
  90  |   const skirt = millWorld(2, Math.sqrt((MILL.porchR + MILL.skirtR) ** 2 / 4 - 4))
  91  |   expect(groundHeight(skirt.x, skirt.z)).toBeCloseTo(MILL.base + MILL.floorH / 2, 2)
  92  |   const skirtEdge = millWorld(0, MILL.skirtR - 0.02)
> 93  |   expect(groundHeight(skirtEdge.x, skirtEdge.z)).toBeLessThan(MILL.base + 0.1)
      |                                                  ^ Error: expect(received).toBeLessThan(expected)
  94  |   const step1 = millWorld(0, 6.0)
  95  |   expect(groundHeight(step1.x, step1.z)).toBeCloseTo(MILL.base + MILL.step1Top, 2)
  96  |   const step2 = millWorld(0, 6.6)
  97  |   expect(groundHeight(step2.x, step2.z)).toBeCloseTo(MILL.base + MILL.step2Top, 2)
  98  |   const ground = millWorld(0, 7.4)
  99  |   expect(groundHeight(ground.x, ground.z)).toBeLessThan(MILL.base + 0.05)
  100 |   const porchSide = millWorld(2.6, 4.0)
  101 |   expect(groundHeight(porchSide.x, porchSide.z)).toBeCloseTo(MILL.base + MILL.floorH, 2)
  102 | })
  103 | 
  104 | test('cottage roof walkable equals the shared profile', () => {
  105 |   expect(houseRoofY(0)).toBeCloseTo(5.6, 2)
  106 |   expect(houseRoofY(6.16)).toBeCloseTo(3.0, 2)
  107 |   for (const [i, p] of HOUSE_ROOF_PROFILE.entries()) {
  108 |     if (i === 0) continue
  109 |     expect(houseRoofY(p.r - 1e-6)).toBeCloseTo(p.y, 2)
  110 |   }
  111 |   const under = houseWorld(5.5, 0)
  112 |   expect(groundHeight(under.x, under.z, 0.2)).toBeLessThan(0.3)
  113 |   const onTop = houseWorld(5.5, 0)
  114 |   expect(groundHeight(onTop.x, onTop.z, 5.2)).toBeCloseTo(houseRoofY(5.5), 2)
  115 | })
  116 | 
  117 | test('fountain rim and water heights match the mesh', () => {
  118 |   const rim = { x: FOUNTAIN.x + 1.9, z: FOUNTAIN.z }
  119 |   expect(groundHeight(rim.x, rim.z)).toBeCloseTo(0.56, 2)
  120 |   const water = { x: FOUNTAIN.x + 0.9, z: FOUNTAIN.z }
  121 |   expect(groundHeight(water.x, water.z)).toBeCloseTo(0.48, 2)
  122 |   const outside = { x: FOUNTAIN.x + 2.4, z: FOUNTAIN.z }
  123 |   expect(groundHeight(outside.x, outside.z)).toBeLessThan(0.1)
  124 | })
  125 | 
  126 | test('well rim is standable and the inside drops to the bottom', () => {
  127 |   const rim = { x: WELL.x + 0.9, z: WELL.z }
  128 |   expect(groundHeight(rim.x, rim.z)).toBeCloseTo(0.78, 2)
  129 |   const inside = { x: WELL.x, z: WELL.z }
  130 |   expect(groundHeight(inside.x, inside.z)).toBeLessThan(0.2)
  131 | })
  132 | 
  133 | test('every walkable height is reachable or intentional (no NaN, sane bounds)', () => {
  134 |   for (let x = -60; x <= 60; x += 7) {
  135 |     for (let z = -60; z <= 60; z += 7) {
  136 |       const h = groundHeight(x, z)
  137 |       expect(Number.isFinite(h)).toBe(true)
  138 |       expect(h).toBeGreaterThan(-3)
  139 |       expect(h).toBeLessThan(14)
  140 |     }
  141 |   }
  142 | })
  143 | 
  144 | test('terrain stays inside the world radius', () => {
  145 |   for (let a = 0; a < TAU; a += 0.4) {
  146 |     const h = terrainHeight(Math.cos(a) * WORLD_R, Math.sin(a) * WORLD_R)
  147 |     expect(Number.isFinite(h)).toBe(true)
  148 |     expect(Math.abs(h)).toBeLessThan(6)
  149 |   }
  150 | })
  151 | 
```
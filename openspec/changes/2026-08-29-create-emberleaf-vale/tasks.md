# Tasks — Create Emberleaf Vale

## 1. Scaffold

- [x] 1.1 Project skeleton: `package.json` (pinned stack), `tsconfig.json` (strict),
      `vite.config.ts`, `index.html`, `src/index.css`, `.gitignore`
- [x] 1.2 `npm.cmd install`; background `npx playwright install chromium`

## 2. Core libraries

- [x] 2.1 `src/lib/math.ts`: clamp/lerp/smoothstep, `damp`, `dampAngle` (shortest
      arc), `mulberry32`, value-noise `fbm`
- [x] 2.2 `src/lib/world.ts`: layout constants, house local↔world transforms,
      path polylines + `pathDistance`, `terrainHeight`, seeded tree/rock scatter,
      collider registry, `game` singleton (spawn + heading toward plaza)
- [x] 2.3 `src/lib/collide.ts`: circle + OBB resolution, 3 passes, returns clamped XZ
- [x] 2.4 `src/lib/input.ts`: key set (arrows/WASD/Shift), arrow scroll
      prevent-default, blur reset, first-input signal for the intro overlay

## 3. Scene

- [x] 3.1 `Lights.tsx` (sun + shadows, hemisphere, interior point light),
      `Effects.tsx` (bloom + vignette, multisampling 4)
- [x] 3.2 `Sky.tsx`: gradient dome, sun glow, fbm cloud shader
- [x] 3.3 `Terrain.tsx`: displaced plane from `terrainHeight`, vertex colors
      (grass/autumn/path sand/plaza stone/pond bed), toon gradient ramp
- [x] 3.4 `Grass.tsx`: instanced blades + wind + player-bend + fog; flowers subset
- [x] 3.5 `Trees.tsx`: 3 merged variants, autumn palette; merged rocks with moss tops
- [x] 3.6 `Pond.tsx`: ripple water shader, lily pads, ring rocks
- [x] 3.7 `House.tsx`: walls + door gap + timber + lathe roof + windows + chimney;
      interior (rug, table, stools, teapot, bed, bookshelf, lantern, ceiling)
- [x] 3.8 `Windmill.tsx`: mound placement, rotating sails (probe angle)
- [x] 3.9 `Fountain.tsx`: pool + bowls + droplets; `Well.tsx` ring/posts/roof/bucket
- [x] 3.10 `Air.tsx`: falling instanced leaves; CPU butterflies

## 4. Character & camera

- [x] 4.1 `Player.tsx`: chibi rig, procedural walk/idle animation, controller
      (camera-relative input, damping, heading, substepped collisions, terrain Y)
- [x] 4.2 `CameraRig.tsx`: spherical follow (drag look, zoom, interior distance
      easing + footprint clamp, terrain clamp)
- [x] 4.3 `Probe.tsx`: `window.__Ghibli` snapshot + test hooks, fps/draw-call stats

## 5. Verification

- [x] 5.1 `npm run build` passes (`tsc --noEmit` + vite build)
- [x] 5.2 `playwright.config.ts` (webServer preview :4173, SwiftShader flags)
- [x] 5.3 `e2e/world.spec.ts`: boot/probe, movement, camera, house entry/exit,
      wall blocking, windmill, perf budgets
- [x] 5.4 Screenshot artifacts reviewed (exterior + interior)
- [x] 5.5 Issues found by tests fixed and re-verified:
      - mergeGeometries indexed/non-indexed mix crashed boot
      - house transform mismatch (colliders mirrored vs visuals) — aligned to
        three.js rotation.y convention
      - draw-call probe under-counted (info.autoReset) — manual accumulation
      - low-fps movement dilation — substepped integration
      - door lane blocked by furniture — table/stools moved
      - open band between wall top and roof — interior ceiling added
      - lantern bloom on player's head — moved to corner

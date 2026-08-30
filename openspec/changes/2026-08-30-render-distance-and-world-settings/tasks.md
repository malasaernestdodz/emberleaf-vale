# Tasks: Render distance culling and world settings

## 1. Culling core

- [x] 1.1 `lib/cull.ts` with registry, pure `withinRenderDistance`, single-writer `updateCulling`, landmark `CULL_DEFS`
- [x] 1.2 `scene/Culler.tsx` sweep + per-frame culling + fog coupling, mounted in `World`
- [x] 1.3 Trees register themselves; landmarks tagged via `userData.cullId`

## 2. Settings and camera

- [x] 2.1 Settings store: `renderDistance`, `fov`, `sensitivity`, `invertY`, `showGrass`, `showFog` with clamped load
- [x] 2.2 CameraRig: sensitivity + invert-Y on pointer-lock and drag look, FOV from settings
- [x] 2.3 Grass: `uCull` uniform from render distance, `showGrass` toggle, named `grass-root`

## 3. UI

- [x] 3.1 Menu: World section (render distance, fog, grass), Graphics (FOV, Show FPS), Controls (sensitivity, invert-Y)
- [x] 3.2 HUD info row + perf panel show drawn/culled counts behind Show FPS

## 4. Verification

- [x] 4.1 Probe: `culled`/`settings`/`fov`/`fogFar` snapshot + `cullList`/`cullVisible`/`setRenderDistance`/`objectVisible`
- [x] 4.2 `e2e/cull.spec.ts` (math invariants, culling states, fog coupling, grass toggle)
- [x] 4.3 `e2e/settings-extended.spec.ts` (FOV, sensitivity/invert-Y, Show FPS, persistence)
- [x] 4.4 ast-grep rules: `camera-fov-only-in-rig`, `fog-range-only-in-culler`, `no-hardcoded-grass-cutoff`, `cull-visibility-single-writer`
- [x] 4.5 `scripts/validate-spec.mjs` + `spec:validate` script; OpenSpec tree validates
- [x] 4.6 `npm run build`, `lint:sg`, `spec:validate`, full e2e suite green

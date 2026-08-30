# Change: Render distance culling and world settings

- **Date:** 2026-08-30
- **Type:** Capability extension of the existing Emberleaf Vale scene

## Why

The vale renders every tree and landmark regardless of how far away it is; only
grass has a distance cutoff, and that cutoff is a hardcoded shader literal the
player cannot control. There is also no way to tune how the world renders or how
the camera feels beyond quality presets. The player wants Minecraft-style
control: a render distance that actually stops drawing what is far away, fog
that matches it, and toggles for grass, fog, FOV, look sensitivity, invert-Y,
and the FPS badge.

## What Changes

- New `lib/cull.ts`: a cullable registry (trees + landmarks) with a pure
  `withinRenderDistance` decision (distance minus radius vs render distance) and
  a single-writer `updateCulling` that toggles `Object3D.visible`.
- New `scene/Culler.tsx`: sweeps the scene once for `userData.cullId` landmark
  roots, applies distance culling every frame from the camera position, and
  drives scene fog near/far from the render distance setting (fog off lifts the
  cap).
- Settings store grows: `renderDistance` (40–220 m), `fov` (40–90),
  `sensitivity` (0.3–2×), `invertY`, `showGrass`, `showFog` — persisted with the
  existing store.
- CameraRig honors `fov`, `sensitivity`, and `invertY` for both pointer-lock and
  drag look; FOV keeps the sprint kick.
- Grass shader cutoff becomes the `uCull` uniform fed by `renderDistance`
  (replaces the hardcoded 74 m literal), and the grass/flower meshes gain a
  `showGrass` visibility toggle on a named `grass-root` group.
- Menu gains World, Graphics (FOV, Show FPS), and Controls sections; the HUD
  info row and perf panel show drawn/culled counts behind the Show FPS toggle.
- Probe grows: `culled`, `settings`, `fov`, `fogFar` in the snapshot plus
  `cullList`, `cullVisible`, `setRenderDistance`, `objectVisible` API.
- Verification: `e2e/cull.spec.ts` and `e2e/settings-extended.spec.ts`; new
  ast-grep rules pin the single-writer boundaries; `npm run spec:validate`
  checks the OpenSpec tree.

## Impact

- Affected specs: `specs/culling-system`, `specs/world-settings`,
  `specs/e2e-verification` are ADDED.
- Affected code: `emberleaf-vale/src` (lib + scene + App), `rules/`, `e2e/`,
  `scripts/validate-spec.mjs`, `package.json`. No other project is touched.

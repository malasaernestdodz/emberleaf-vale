# Change: Create Emberleaf Vale (Ghibli walking scene)

- **Date:** 2026-08-29
- **Type:** Greenfield capability (new standalone project)

## Why

The user wants a fantasy/Ghibli-style 3D scene they can actually walk around in,
running on the highest-performing practical 3D stack available in 2026, inside a
fresh React + Vite project (separate from `ernestdev-portfolio`). The result must
be verifiable end to end: arrow-key movement, camera look, grass, landmarks, and
walking inside the house — all probed and E2E-tested, not just "looks fine".

## What Changes

- New project `emberleaf-vale/` — Vite + React 19 + TypeScript strict.
- Rendering: three.js ^0.185 + @react-three/fiber ^9.7 (WebGL2), toon shading,
  bloom + vignette, custom GLSL for sky/grass/water.
- World: analytic terrain with sand paths, plaza + stone fountain, windmill on a
  mound, well, pond with lily pads, autumn trees, rocks, ~70k instanced grass
  blades in one draw call, falling leaves, butterflies, flowers.
- Gameplay: chibi player character, camera-relative movement (arrows/WASD,
  Shift = run), third-person orbit camera (drag to look, wheel to zoom), kinematic
  capsule collision (walls with a door gap, furniture, trees, landmarks), and a
  walkable house interior with warm interior lighting.
- Verification: `window.__Ghibli` probe + Playwright E2E suite asserting movement
  math, camera look, wall blocking, door entry/exit, animation, and perf budgets,
  with screenshot artifacts.

## Impact

- Affected specs: all capabilities under `specs/` are ADDED.
- Affected code: only the new `emberleaf-vale/` directory. No existing project,
  config, or global state is modified.

# Change: Slime pack + boss, per-slime bars, windmill door & interior perspective

- **Date:** 2026-09-01
- **Type:** Feature + bug fix (reconciles the four open 2026-09-01 rows in
  `openspec/defects.md` and supersedes the stale 2026-08-31 windmill rows)

## Why

User report (2026-09-01, with screenshot): the windmill reads sealed — no
open door — and the committed geometry drifts from the walkable-height
constants (5 deterministic test failures); being inside the mill zooms too
hard and the camera can leave the drum; the vale needs more slimes and a
big boss; and the top-center HUD bar should belong to the boss only, while
regular slimes carry flat 2D bars pinned above them that never billboard.

## What Changes

- **Windmill door + enclosure (`scene/Windmill.tsx`, `lib/world.ts`):**
  bands, balcony arc, and landing/deck heights re-derived from
  `MILL.doorHalf`/`MILL_BALCONY.phi0` so the ground door is open
  (porch → lintel), the balcony doorway is bounded, the crown is solid, and
  `groundHeight` matches the mesh at every radius. e2e invariants pin mesh
  theta spans against the collider arc and deck heights at 3 radii.
- **Mill interior perspective (`scene/CameraRig.tsx`, `lib/world.ts`):**
  new `game.insideMill`; the circle clamp applies from `interior3 > 0.02`,
  clamps hard when inside, interior distance share 0.8 with a 2.6 floor —
  a normal third-person zoom that can never leave the drum. Spawn camera
  seeds facing the mill door. e2e sweeps camYaw at max zoom and asserts the
  camera stays inside.
- **Slime pack (`lib/slime.ts`, `scene/Slime.tsx`):** 3 regular slimes
  (existing state machine, per-entity spawn/respawn/wander, seeded rng) +
  1 boss slime (2.2× size, 12 HP, bigger splash, stronger knockback, 6-gel
  pop, 90 s respawn). One slash hits exactly one slime (nearest in arc).
- **Bars split (`App.tsx`, `index.css`, new `scene/SlimeBars.tsx`):** the
  top-center HUD bar becomes the BOSS bar (`BOSS SLIME`, same
  always-visible/red contract, `0/12` while hidden); regular slimes get
  flat 2D bars projected above them each frame (fixed pixel size, no
  rotation/billboard, hidden beyond 18 m or off-screen), rendered as
  pooled DOM overlays driven by direct style writes.
- **Observability:** `slime` now mirrors the boss; new `pack` array in the
  snapshot; `slimeHud` keeps mirroring the boss for the HUD bar.

## Impact

- Spec deltas: `health-hud` (MODIFIED: HUD bar = boss bar; ADDED: per-slime
  projected bars), `combat-health` (MODIFIED: pack combat semantics),
  `windmill-shell` (MODIFIED: door open + height re-derivation),
  `camera-mill` invariants folded into `e2e` contract.
- Code: `src/lib/world.ts`, `src/lib/slime.ts`, `src/scene/Windmill.tsx`,
  `src/scene/Slime.tsx`, `src/scene/SlimeBars.tsx` (new),
  `src/scene/CameraRig.tsx`, `src/scene/Player.tsx`, `src/scene/SlashFx.tsx`,
  `src/scene/Probe.tsx`, `src/App.tsx`, `src/index.css`.
- Tests: `e2e/combat.spec.ts` (bars/pack/boss), `e2e/health.spec.ts`
  (untouched — boss mirrors the old single-slime contract),
  `e2e/math.spec.ts` + `e2e/props.spec.ts` (mill invariants),
  `e2e/world.spec.ts` (walk-in green again), camera sweep test.
- Validation: `npm run spec:validate`, `openspec validate --all --strict`,
  `npm run build`, `npm run lint:sg`, full Playwright suite green (the 6
  windmill baseline failures are EXPECTED to flip green with this change).

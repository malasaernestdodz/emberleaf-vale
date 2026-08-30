# Change: Real-world scale, collision fixes, sword combat, collider debug view

- **Date:** 2026-08-29 (supersedes windmill/mansion sizing from 2026-08-29-expand-gameplay)
- **Type:** Feature + collision-model upgrade

## Why

Playtesting against the player reference (1.55 m tall, 0.32 m radius, 0.845 m jump
apex) showed the buildings undersized and a structural height-field conflict in the
windmill: the spiral's top wedge occupied the same angular sector as the door
wedge, so the doorway floor jumped to balcony height on one side (walk-through /
fall-through feel). The mansion staircase started at the entrance beside the well
sight-line with a cramped 3.8 m run. Combat input (attack on left click) and a
debug view of collision shapes were requested to validate the world end to end.

## What Changes

- **Windmill rescale (1.4x, real mill proportions):** tower wall r 4.1 / h 12.2 on
  a 4.6 m mound, spiral rise 5.2 m over one turn (grade 0.29, unchanged feel),
  hub at 10 m, sail radius 5.2 m, 1.6 m clear door (2.5x player diameter).
- **Windmill sector fix:** the spiral now spans φ ∈ [0.45, 2π−0.9]; the top landing
  is its own sector [2π−0.9, 2π−0.45) at base+top; the door wedge |φ| < 0.45 is
  floor-level across the whole annulus. No sector serves two heights — the
  door/top overlap is structurally impossible now.
- **Solid spiral annulus:** the ramp fills r ∈ [0.55, 3.6] (inner plinth to wall),
  eliminating the inner-edge fall-through the player reported as "going through
  the floor". Wall colliders are contiguously tiled tangent boxes (chord ≥ arc)
  with an exact 1.6 m clear gap.
- **Mansion rescale + stair placement:** footprint 15 x 12 m at (−21.5, −16)
  (moved away from the well), floor-to-floor 3.05 m (floorY 0.25, floor2 3.3),
  wall height 9.3 m. The grand staircase is now an enclosed 2 m-wide run along the
  east wall, rising 7.1 m of run (23°, 16 visual steps of 0.19 m rise / 0.44 m
  run — real stair proportions), starting 5.2 m inside the entrance so it is no
  longer beside the door / well axis. A cantilevered back balcony (y0 = floor2
  colliders + ground-level corner posts only) is walkable-under with no invisible
  wall.
- **Sword combat:** the sword is the default held tool; left click (movement <
  6 px) swings it — 0.45 s arm-swing animation driven by `game.attack` progress.
- **Input buffering:** key/click edges survive 500 ms (`recent` map), so quick
  presses register even when a SwiftShader frame runs late; jump/gravity
  integration is sub-stepped at 16 ms so the 0.845 m apex is frame-rate
  independent.
- **Collider debug view:** `C` toggles wireframe shapes for every collider
  (cylinders for circles, yaw-aligned boxes for boxes, y0→top spans) via
  `src/scene/Colliders.tsx`; state exposed as `snapshot().colliders`.
- **Tests:** full e2e realignment — teleports derived from world constants, three
  new tests (sword, collider toggle, stair/slab height consistency), workers=1;
  32/32 green.

## Impact

- Spec deltas: `windmill-interior`, `mansion`, `character-control`,
  `interactions`, `e2e-verification`.
- Validation: `npm run build` + `npm run lint:sg` + `npm run test:e2e` (32 tests)
  all green; `openspec validate --all --strict` clean.

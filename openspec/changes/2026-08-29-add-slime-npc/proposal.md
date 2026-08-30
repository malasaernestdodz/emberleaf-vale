# Change: Add a slime companion NPC

- **Date:** 2026-08-29
- **Type:** Feature (planned — implementation deferred)

## Why

The valley needs its first living creature. A slime is the right first NPC: one
merged squishy mesh, height-field-friendly movement, and a natural target for the
new left-click sword attack. This change is specified and validated now, but
implementation is intentionally deferred (tasks unchecked).

## What Changes

- A slime entity spawns near the plaza path (seeded, deterministic): a squashed
  sphere body (~0.45 m radius, 0.55 m resting height — knee-high vs the 1.55 m
  player), toon-shaded with translucent green tint and idle squash-and-stretch.
- Behaviour loop: idle (squish breathing) → hop toward a wander point every
  1.4–2.6 s (ballistic arc: vy 3.2, landing snapped to `groundHeight`) → idle.
  Movement uses the same circle-collision model as the player (r 0.45) and never
  enters buildings or the pond.
- Interaction: the sword swing (left click) within a 1.4 m frontal arc squishes
  the slime (scale punch + knockback impulse away from the player); after three
  hits it pops into 1–2 pickup drops (slime gel — new item type) and respawns at
  its spawn point after 20 s.
- A soft body-follow collider keeps the player from standing inside it; the slime
  yields to the player's push.

## Impact

- Spec deltas: `slime-npc` (new capability).
- Validation (when implemented): e2e — hop keeps it grounded and outside
  buildings; sword hit squishes and knocks back; third hit drops gel pickups;
  ast-grep clean; seeded spawn verified via snapshot (`slime: {x, y, z, state,
  hits}`).

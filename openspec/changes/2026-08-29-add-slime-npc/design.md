# Design — Slime companion NPC

## Shape research (following the per-object collision table)

| Aspect          | Decision                          | Math / rationale                                                                   |
| --------------- | --------------------------------- | ---------------------------------------------------------------------------------- |
| Body            | sphere r 0.45, rest height 0.55   | knee-high vs the 1.55 m player; squash-and-stretch is a visual scale, not collision |
| Ground collider | circle r 0.45 in `COLLIDERS`      | same circle-vs-circle resolve as rocks; no y0/top (always solid at its span)        |
| Movement        | ballistic hops on the height-field| vy 3.2, g 16 -> apex 0.32 m, range ~0.8 m; landing snaps to `groundHeight`          |
| Push resolve    | slime yields to the player        | resolve slime out of the player circle (r 0.32 + 0.45) after the player's own pass   |
| Hit probe       | frontal arc vs circle             | hit if dist(player, slime) < 1.4 and dot(playerForward, toSlime) > 0.5 during swing  |
| Knockback       | horizontal impulse + squish punch | v = 4.5 m/s away from player, decays with damp(…, 6, dt); no vertical component     |
| Drops           | reuse `spawnPickup('gel', …)`     | new `Item` type; hotbar gains a slot or gel maps to an existing stack — decided at implementation |
| Determinism     | seeded mulberry32 for hop timing  | project convention; snapshot exposes slime state for e2e                            |

## States

```
idle ──(timer 1.4–2.6 s)──> hop ──(landed)──> idle
any  ──(sword hit)──> squish (0.3 s) ──> knockback slide ──> idle
hits == 3 ──> pop (spawn gel) ──> hidden 20 s ──> respawn at spawn point
```

## Keep-out rules

Hops reject landing points inside: house/mansion footprints, mill interior
(r < rWall + 1), pond (r + 0.8), fountain/well rims, any collider overlap, and
path distance > 2 (stays near the plaza). Candidate sampling uses the seeded rng
with 8 attempts, else stays idle.

## E2E plan (when implemented)

1. `snapshot().slime` exists at a deterministic spawn near the plaza path.
2. After 3 s, the slime has hopped at least once (position changed, y returns to
   ground).
3. Teleport next to it, swing (mouse click) -> `slime.hits` increments and it
   moves away from the player.
4. Three swings -> `pickups` count increases by 1–2 and the slime hides; after
   20 s it is back at the spawn point.
5. ast-grep clean; no new draw-call budget breach (one merged mesh + shadow).

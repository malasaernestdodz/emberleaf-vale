# slime-npc Specification

## ADDED Requirements

### Requirement: Deterministic slime entity

A slime SHALL exist as a knee-high (rest height 0.55 m, body r 0.45) squishy
sphere at a seeded spawn point near the plaza path, breathing with idle
squash-and-stretch, colliding as a circle (r 0.45) that yields to the player's
push, and hopping ballistically (vy 3.2) toward seeded wander points every
1.4–2.6 s, landing snapped to `groundHeight` and never entering buildings, the
pond, rims, or paths.

#### Scenario: Hops stay grounded and outside keep-out zones

- **WHEN** the world runs for several seconds
- **THEN** the slime changes position at least once, always rests exactly on the
  ground height, and never stands inside a building footprint, the pond, or the
  fountain

### Requirement: Sword hits squish, knock back, and pop

The left-click sword swing SHALL hit the slime within a 1.4 m frontal arc
(dot(playerForward, toSlime) > 0.5): each hit squishes the body, applies a 4.5 m/s
knockback away from the player, and increments a hit counter; the third hit SHALL
pop the slime into 1–2 gel pickups and hide it for 20 s before it respawns at its
spawn point.

#### Scenario: Three swings pop the slime into gel

- **WHEN** the player lands three left-click swings on the slime
- **THEN** each hit visibly squishes and displaces it away, the third hit spawns
  1–2 gel pickups, the slime disappears for 20 s, and it then respawns at its
  seeded spawn point

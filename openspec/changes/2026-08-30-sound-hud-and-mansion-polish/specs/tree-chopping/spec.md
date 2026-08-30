# tree-chopping Specification

## ADDED Requirements

### Requirement: Multi-hit chop with real fall

Each tree SHALL require 3 completed axe swings to fall. Every completed swing SHALL
shake the tree, play hit audio, and grant +1 wood at swing mid-point (preserving the
existing E2E chop contract). On the 3rd hit the tree SHALL tip away from the player with
an accelerating rotation around its base (≈88° over ~1.4 s) and a damped landing bounce,
drop 2 bonus wood pickups at the trunk, then remain fallen for 40 s before regrowing
(scale 0.25 → 1 over ~2.5 s) with its collider restored.

#### Scenario: Three chops fell the tree
- **WHEN** the player lands the 3rd swing
- **THEN** the tree rotates away from the player, lands with a bounce, and two wood pickups appear

#### Scenario: Fallen trees stop blocking
- **WHEN** a tree is fallen
- **THEN** its trunk collider radius shrinks to ~0.06 so the player walks past it

#### Scenario: Regrow
- **WHEN** 40 s have elapsed since the fall
- **THEN** the tree scales back up over ~2.5 s and becomes choppable again

### Requirement: Determinism and budget

All tree randomization (fall direction seeds, regrow timing) SHALL use the seeded PRNG.
Trees SHALL render as individual meshes with 3 shared variant geometries, keeping total
draw calls within the existing e2e budget (≤190 in lite).

#### Scenario: Deterministic layout
- **WHEN** the app boots twice
- **THEN** tree positions, variants, and animation timing are identical

### Requirement: Prompt feedback

While near a choppable tree the interaction prompt SHALL show hit progress
(`Chop the tree (n/3)`), and the axe SHALL be the equipped tool. Fallen or growing trees
SHALL NOT be choppable and SHALL NOT appear in prompts.

#### Scenario: No chop on a fallen tree
- **WHEN** the player stands next to a fallen trunk
- **THEN** no chop prompt appears and `E` does not swing the axe

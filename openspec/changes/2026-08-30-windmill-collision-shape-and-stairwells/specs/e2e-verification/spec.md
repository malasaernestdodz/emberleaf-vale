# e2e-verification Specification

## ADDED Requirements

### Requirement: Collision acceptance suite gates every collision-shape change

A dedicated Playwright suite (`e2e/collision.spec.ts`) SHALL verify the player-experienced
collision truths with honest input (held keys, coarse camera steering — no per-frame
teleport cheating) and visual truth (scene raycasts through `__Ghibli.raycastDown`):

1. Windmill door walk-in asserts the standing height at the threshold — this test MUST
   fail on a build where the player is buried in the plinth.
2. Windmill spiral climb with held keys reaches the landing; sampled positions match
   visible step tops via raycast within 0.3 u.
3. Mansion floor 2 raycasts into an open stairwell (hit below slab level — MUST fail on
   the old solid slab) and walking off the edge lands grounded on the mid-stairs.
4. Cottage roof walk tracks the visible profile; eave fall lands grounded.
5. Draw-call budget holds after the interior tour.

The suite SHALL run in the standard lite mode and poll generously for SwiftShader.

#### Scenario: Regression tripwires

- **WHEN** the suite runs against a build where the plinth, slab, or roof regression
  exists (buried threshold, solid slab over stairs, roofless collision)
- **THEN** the corresponding test fails, naming the broken surface

#### Scenario: Green baseline

- **WHEN** the full e2e suite runs after this change
- **THEN** the collision suite passes alongside the existing contracts (boot budgets,
  movement, interiors, camera clamps, chop, pickups), with updated pinned heights where
  the old model's numbers were asserted

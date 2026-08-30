# surface-fidelity Specification

## ADDED Requirements

### Requirement: Cottage roof collision matches its visible mesh

The cottage roof lathe and its walkable surface SHALL be generated from one shared
profile (`HOUSE_ROOF_PROFILE`) exported by `lib/world.ts`, so the standable surface
equals the visible silhouette by construction. The roof surface SHALL apply only when
the player's current height is within 0.9 u of it, so ground-level movement under the
eaves is unaffected. The roof chimney SHALL have an elevated collider matching its
stone box.

#### Scenario: Roof walk tracks the silhouette

- **WHEN** the player stands on the roof and walks from the apex toward the eave
- **THEN** the feet track the visible profile within 0.35 u at sampled radii, stay
  grounded, and a downward ray at each sample matches the walkable height within 0.3 u

#### Scenario: Eaves and under-roof behavior

- **WHEN** the player walks off the eave, or walks/jumps on the ground beside the house
- **THEN** falling off the eave lands grounded on the terrain, and ground-level movement
  never snaps up to the roof

#### Scenario: Chimney is solid

- **WHEN** a downward ray is cast at the chimney from above the roof
- **THEN** the first hit is the chimney cap top (±0.15) rather than the roof slope

### Requirement: Fidelity work stays inside the performance budget

All collision-fidelity geometry SHALL join existing merged color buckets (no per-part
meshes), `groundHeight` SHALL remain allocation-free pure math with at most a
precomputed profile lookup, and the total collider count SHALL grow by no more than
four boxes. The boot draw-call budget (`drawCalls ≤ 190` in lite e2e) SHALL not change,
and the budget SHALL still hold after touring every interior.

#### Scenario: Budget holds after an interior tour

- **WHEN** the e2e suite tours windmill top, mansion floor 2, and the cottage roof,
  then samples performance
- **THEN** draw calls remain within budget and frames continue to advance

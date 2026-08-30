# terrain-clearance

## ADDED Requirements

### Requirement: Landmark pads override the mill mound

The terrain height function SHALL apply terrain features in one explicit order —
the windmill pad first, then every flatten-to-zero landmark (well, plaza, house,
mansion) — such that a landmark's pad is fully flat at its target height
everywhere inside its flatten radius, even when the mill pad's influence radius
overlaps that zone. Feature ordering SHALL be deterministic array order (no
find-based reordering or force-last application).

#### Scenario: Cottage sits on flat ground next to the relocated mill

- **WHEN** the windmill stands 27.2 u from the house center and the mill pad
  reaches 18 u
- **THEN** `terrainHeight` at every house footprint corner equals the house pad
  target (0) within 0.05, and terrain just outside the walls slopes toward the
  mill without forming a step taller than 1.2 u inside the pad blend zone

#### Scenario: Ordering regression is caught without a browser

- **WHEN** the mill pad's target changes or a feature is reordered so the
  mound wins inside the house zone
- **THEN** the math invariant in `e2e/math.spec.ts` fails naming the violated
  footprint corner

# e2e-verification Specification

## ADDED Requirements

### Requirement: Culling is verified end to end

The Playwright suite SHALL verify through the probe that far landmarks are
hidden and near ones visible, that the render distance setting reveals them,
that the registry obeys its distance invariant per entry, that fog far tracks
the setting and the fog toggle lifts it, and that the grass toggle flips the
`grass-root` visibility — plus unit-level probes of the pure distance decision.

#### Scenario: Culling spec covers the contract

- **WHEN** `npm run test:e2e` runs `e2e/cull.spec.ts`
- **THEN** every assertion above passes against the built app

### Requirement: New settings are verified end to end

The Playwright suite SHALL verify the FOV slider retargets the camera and
persists across reload, that sensitivity scales drag look and invert-Y flips
its sign, and that Show FPS toggles the HUD fps segment.

#### Scenario: Settings spec covers the contract

- **WHEN** `npm run test:e2e` runs `e2e/settings-extended.spec.ts`
- **THEN** every assertion above passes against the built app

### Requirement: OpenSpec tree stays valid

A structural validator SHALL check that every spec file declares at least one
requirement, every requirement declares at least one scenario, and change specs
declare their deltas with `## ADDED Requirements`, failing the
`npm run spec:validate` script otherwise.

#### Scenario: Validator gates the spec tree

- **WHEN** `npm run spec:validate` runs on the current tree
- **THEN** it exits zero and reports the validated spec and requirement counts

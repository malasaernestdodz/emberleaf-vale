# e2e-verification

## ADDED Requirements

### Requirement: Relocation and balcony acceptance run

The windmill relocation and vista balcony SHALL ship only when the math
invariants, the collision end-to-end climb, and the visual gallery are green
together.

#### Scenario: Acceptance suite

- **WHEN** the agent validates this change
- **THEN** `npm run spec:validate`, `npm run build`,
  `npx playwright test e2e/math.spec.ts e2e/collision.spec.ts e2e/gallery.spec.ts`
  all pass, and the gallery/collision screenshots show the cottage free of
  terrain clipping and the balcony door visible from the windmill pose

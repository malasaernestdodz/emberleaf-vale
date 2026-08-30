# Tasks: Entity audit registry + portico centered on the mansion door

## 1. Portico constants and facade fix

- [ ] 1.1 `lib/world.ts` — add `MANSION_PORTICO` (`cx` from `MANSION_DOOR` center,
      `halfW`, `depth0/depth1`, `roofY`, `colR`, `stepW`) derived from `MANSION_DOOR`
- [ ] 2.1 `scene/Mansion.tsx` — rebuild the portico block from `MANSION_PORTICO`
      (columns, caps, roof slab, cornice, steps centered on `cx`); delete the roof
      balustrade ring (posts + rail)

## 3. Entity registry and audit

- [ ] 3.1 `lib/entities.ts` — `FEATURE_VOCAB` + `ENTITIES` registry (unique ids matching
      `cullId`s, unique descriptions, features per entity) for house, mansion,
      windmill, well, fountain, pond
- [ ] 3.2 `scene/Probe.tsx` — `__Ghibli.entityAudit()` returning
      `{ id, description, features, meshPresent, cullRegistered, cullVisible }` per entity

## 4. Acceptance tests

- [ ] 4.1 `e2e/entity-audit.spec.ts` — registry uniqueness, registry ↔ cullId parity,
      runtime audit all-green, description/features echoed back
- [ ] 4.2 `e2e/entity-audit.spec.ts` — portico column symmetry about the doorway center;
      façade screenshot shows the doorway between the two columns
- [ ] 4.3 `e2e/props.spec.ts` — portico constants invariant (columns equidistant from
      doorway center, clear of the opening and of the open-leaf swing)

## 5. Guardrails

- [ ] 5.1 `rules/cull-id-must-be-literal.yml` — `cullId` must be a string literal
- [ ] 5.2 `rules/no-hardcoded-portico-offset.yml` — the old `px0 −1.8` literal stays out
      of `Mansion.tsx`

## 6. Validation

- [ ] 6.1 `npm.cmd run spec:validate` clean
- [ ] 6.2 `npm.cmd run build` (tsc strict + vite) clean
- [ ] 6.3 `npm.cmd run lint:sg` clean (incl. the two new rules)
- [ ] 6.4 Full Playwright suite green; façade screenshot reviewed (door centered
      between columns, no fake roof balustrade)

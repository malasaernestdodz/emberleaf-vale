# Tasks: Windmill relocation + vista balcony

## 1. Terrain clearance

- [x] 1.1 `lib/world.ts` — `WINDMILL` → (34, -26); single ordered FEATURES pass
      (mill first, then well/plaza/house/mansion flattens); delete the
      last-applied mill special case; document ordering as load-bearing
- [x] 1.2 Math invariant: house footprint + interior stay at pad height even
      with the mill pad present (e2e/math.spec.ts)

## 2. Vista balcony

- [x] 2.1 `lib/world.ts` — `MILL_BALCONY`/`MILL_LOOKOUT` constants; deck
      walkable in `groundHeight` gated on curY; wall colliders skip the doorway
      arc; guard-rail + end-panel colliders; `MILL.doorHalf` promoted to MILL
- [x] 2.2 `scene/Windmill.tsx` — deck/rails/jambs/lintel/brackets merged into
      the spiral mesh (no new draw calls); wall cylinder rebuilt as one segment
      around the doorway; landing ring double-base offset fixed; telescope prop
      at the lookout spot
- [x] 2.3 `lib/quests.ts` — `lookout` quest (The Keeper's Watch) + completion
      flavor override in `questEvent`; `game.vista` latch in `lib/world.ts`;
      interact branch in `scene/Player.tsx`

## 3. Acceptance tests (agent must run all green)

- [x] 3.1 `e2e/collision.spec.ts` — climb → step out onto the balcony → walk to
      the telescope → E → quest `lookout` progress 1/1; rail stops the player
      at the outer edge (grounded, inside r1)
- [x] 3.2 `e2e/math.spec.ts` — balcony deck height matches `MILL.base + MILL.top`
      across the arc; outside the arc no lift; underneath (low curY) no lift
- [x] 3.3 `e2e/gallery.spec.ts` — windmill shot from the balcony side

## 4. Validation

- [x] 4.1 `npm run spec:validate` clean
- [x] 4.2 `npm run build` (tsc strict + vite) clean
- [x] 4.3 Playwright math + collision + gallery green; screenshots reviewed
      (house free of terrain, balcony door visible, deck reachable)

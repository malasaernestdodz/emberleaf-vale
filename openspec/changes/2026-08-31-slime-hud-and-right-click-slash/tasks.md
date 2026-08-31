# Tasks: Slime vitality HUD bar + right-click fast slash

## 0. Grilling

- [x] 0.1 `grilling.md` — 16 questions asked and answered against the root
      context (both 2026-08-31 defect rows reconciled; niche cases: always-on
      visibility across states, fixed-position stability, slash restart
      semantics, buffered-edge leak, contextmenu/clickable-ui guards,
      no-wall-clock e2e strategy, scope fidelity)
- [x] 0.2 Answers folded into proposal/design/spec deltas — nothing silently
      cut; defects rows stay open until e2e proves the fixes

## 1. Input — right-click edge

- [ ] 1.1 `lib/input.ts` — register button 2 on `mousedown` (with the
      `.clickable-ui` guard) into `clickEdges`/`clickRecent`; `preventDefault`
      the global `contextmenu` event
- [ ] 1.2 `lib/input.ts` — export a small helper to consume-and-discard both
      click edges (used by blocked states)

## 2. Combat — instant fast slash

- [ ] 2.1 `scene/Player.tsx` — `SLASH_TIME = 0.22` / `HEAVY_TIME = 0.9`;
      right-click edge applies `applySlimeHit` immediately and restarts the
      slash timer per click (no lockout); left-click heavy path unchanged
- [ ] 2.2 `scene/Player.tsx` — blocked states (menu/book/fishing/chop) and
      the sit/faint early returns consume-and-discard click edges (buttons 0
      and 2) so stale clicks never fire
- [ ] 2.3 `lib/world.ts` + `scene/Probe.tsx` — `game.attackDur` written by
      the player each frame; snapshot exposes `attackDur`

## 3. HUD — screen-fixed slime vitality bar

- [ ] 3.1 `scene/Slime.tsx` — remove the world-space billboard bar group
      (`bar`/`fill`/`ghost`) and its per-frame easing
- [ ] 3.2 `App.tsx` — poll `slimeHud` into `Stats`; render the fixed bar
      (testids `slime-health`, `slime-health-fill`, `slime-hp`) outside the
      `hudHidden` gate; update the intro card control hints
- [ ] 3.3 `index.css` — `.slime-health` styles: fixed top-center, gold
      frame on bark, red `#e0483e` fill, label, count

## 4. Tests

- [ ] 4.1 `e2e/combat.spec.ts` — right-click lands instantly (HP drop in
      snapshot polls; `attackDur <= 0.35`); heavy left-click still `0.9`
- [ ] 4.2 `e2e/combat.spec.ts` — rapid right-click slashes: HP 3 → 0, pop,
      gel pickups, quest progress, slime `hidden` with bar reading 0/3
- [ ] 4.3 `e2e/combat.spec.ts` — bar fixed on screen (boundingBox stable
      while `slime.x` changes), red fill, always visible (pre-input, hidden
      slime, fishing/book)
- [ ] 4.4 `e2e/combat.spec.ts` — UI guards: right-click on gear and during
      the menu never attacks; buffered clicks don't fire after the menu
      closes; facing away misses

## 5. Validation

- [ ] 5.1 `npm run spec:validate` clean (grilling ≥ 8 enforced)
- [ ] 5.2 `openspec validate --all --strict` clean
- [ ] 5.3 `npm run build` (tsc strict + vite) clean
- [ ] 5.4 `npm run lint:sg` clean
- [ ] 5.5 Full Playwright suite green (`playwright.kilo.config.ts` on :4322)
- [ ] 5.6 Close both 2026-08-31 defect rows once e2e proves the fixes

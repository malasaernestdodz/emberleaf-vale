# Tasks: Sound, menu/HUD states, falling trees, mansion depth

## 1. Foundations

- [ ] 1.1 `lib/settings.ts` — defaults, localStorage load/save, subscribe, quality map, lite pinning
- [ ] 1.2 `lib/audio.ts` — WebAudio graph (master/music/sfx buses), seeded variation, unlock on first input, safe no-ops
- [ ] 1.3 SFX bank: swing, chop, creak, fall crash, thud, step, pickup, throw, eat, cast, bite, reel, catch, sleep, wake, page, sit, ui hover/click, toast blip
- [ ] 1.4 Ambience (wind bed + seeded birds) and music pad; volume application on settings change; mute

## 2. Flow, menus, HUD

- [ ] 2.1 `game.flow`/`game.paused` state + Esc/pointer-lock/P handling, lite auto-play
- [ ] 2.2 `ui/Menu.tsx` — title screen, pause menu, settings modal (audio sliders + meters, quality, fps toggle, controls)
- [ ] 2.3 `ui/Hud.tsx` — location cluster, status cluster (fps chip, volume chip, gear), crosshair, prompt with key chip, toasts, angular hotbar with SVG glyphs
- [ ] 2.4 `index.css` retheme (corner-cut panels, ember accent, tabular nums) + `App.tsx` wiring (canvas key remount on quality, settings persistence)

## 3. World feel

- [ ] 3.1 `lib/world.ts` — export `treeColliderRefs`; `game.paused` gate respected by Player/Trees frame loops
- [ ] 3.2 `lib/trees.ts` — lifecycle state + pure fall-curve helpers
- [ ] 3.3 `scene/Trees.tsx` — per-tree groups, shake/fall/down/grow animation, bonus wood on fall, prompt hit count
- [ ] 3.4 `scene/Player.tsx` — per-swing chop registration (3 hits), sounds (steps/swing/chop/throw/pickup/eat/fishing/sleep/book/sit), pause gate

## 4. Visual fidelity

- [ ] 4.1 `scene/textures.ts` — `makeNoiseNormalMap`, `makeGlassEnv`, shared glass material
- [ ] 4.2 House + Mansion glass swap (physical material + mullions + warm interior tint)
- [ ] 4.3 Mansion depth: portico, balcony + balustrade, quoins, string course, cornice, chimneys, window pediments/sills, dormers; normal maps on plaster/roof; house door trim
- [ ] 4.4 Quality wiring: `Effects.tsx` bloom gate, `Lights.tsx` shadow size, Canvas dpr/shadows/MSAA

## 5. Validation

- [ ] 5.1 `npm.cmd run build` (tsc strict) and `npm.cmd run lint:sg` clean
- [ ] 5.2 E2E suite green: perf budgets, chop contract (1 E → ≥1 wood), pickups = 23 pre-fall, all movement/interior/camera tests
- [ ] 5.3 Manual pass: title → play → pause → settings (volumes audible, indicators move), tree falls + regrows, glass reads as glass, mansion reads as manor

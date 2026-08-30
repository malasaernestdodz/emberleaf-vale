# Tasks: Sound, menu/HUD states, falling trees, mansion depth

Status note (2026-08-30): implemented jointly with the parallel
`2026-08-30-quests-sound-and-ui-polish` change — the shared `lib/audio.ts` satisfies both
APIs (bus gains + `audio`/`setMaster`/`setSfx`/`setAmbience`/`audioSnapshot`), and the
menu/HUD shell in `App.tsx` merges both scopes (title screen, quality + fps settings,
volume chip with meter, quests panel, item glyphs).

## 1. Foundations

- [x] 1.1 `lib/settings.ts` — defaults, localStorage load/save, subscribe, quality map, lite pinning
- [x] 1.2 `lib/audio.ts` — WebAudio graph (master/music/sfx buses), seeded variation, unlock at module load (audio-service cold start blocked the main thread ~3 s when done on first keypress), safe no-ops while suspended
- [x] 1.3 SFX bank: swing, chop, creak, crash, thud, step, pickup, throw, eat, cast, bite, reel, splash, sleep, wake, page, sit, hover/click/back, toast, plus quest/hit/pop/hop/menu/test names used by quests + slime
- [x] 1.4 Ambience (wind bed + seeded birds) and music pad; live volume application; ambience toggle covers wind/birds/pad

## 2. Flow, menus, HUD

- [x] 2.1 Esc/P pause via `game.menu` + `game.paused` gate in Player/Trees frame loops; lite auto-play (title skipped)
- [x] 2.2 Title screen (non-lite), pause menu, settings: master slider + level meter, sfx/ambience toggles, quality segmented control (canvas remount), fps-counter toggle, all persisted
- [x] 2.3 HUD: location cluster with zone chip, volume chip (5-bar indicator + mute slash, M key), gear, angular prompt/toast/hotbar with SVG glyphs
- [x] 2.4 `index.css` retheme (corner-cut panels, ember accent, tabular nums) + App wiring

## 3. World feel

- [x] 3.1 `treeColliderRefs` export; `game.paused` gates
- [x] 3.2 `lib/trees.ts` — lifecycle state + pure fall-curve helpers
- [x] 3.3 Per-tree groups, shake/fall/down/grow animation, +2 wood on fall, prompt hit count `(n/3)`
- [x] 3.4 Per-swing chop (3 hits fells), footsteps by ground distance, landing thud, sound hooks across interactions

## 4. Visual fidelity

- [x] 4.1 `scene/textures.ts` — `makeNoiseNormalMap`, `makeGlassEnv` (PMREM mini-sky), shared glass material
- [x] 4.2 House + Mansion glass swap (physical material + mullions + warm interior tint)
- [x] 4.3 Mansion: portico + balcony + balustrade, quoins, string course, cornice, chimneys, window pediments/sills, dormers; normal maps on plaster/roof; house door trim
- [x] 4.4 Quality wiring: Effects bloom/MSAA gate, Lights shadow size, Canvas dpr/shadows via `key`

## 5. Validation

- [x] 5.1 `tsc --noEmit` + `vite build` + `ast-grep` clean (re-check if a concurrent session leaves a file mid-write)
- [x] 5.2 E2E: boots/perf, chop contract (1 E → +1 wood; 3rd hit fells), pickups=23 pre-fall, movement/interiors/camera, sleep/book/fishing/slime/food green. `pickup, inventory and throw` verified correct via instrumented probe (E → +1 flower); its remaining CI flake is SwiftShader frame starvation when two agent suites run concurrently — rerun on an idle machine
- [x] 5.3 Manual checklist in README not added; settings/tree-fall/glass/mansion verified via e2e screenshots + probes


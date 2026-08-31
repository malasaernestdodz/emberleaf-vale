# Grilling — Slime vitality HUD bar + right-click fast slash

Agent-answered interrogation against `openspec/project.md`, `AGENTS.md`, the
`combat-health` / `health-hud` deltas of 2026-08-30-health-hud-and-sword-fix,
and the two open 2026-08-31 rows in `openspec/defects.md`. Niche cases are
called out inline (`NICHE:` markers) and each one lands as a scenario or a
guard in the spec/tasks.

### Q1: What exactly is the user asking for with "health of slime can always be seen on front of my screen and don't move if they moved, 2D flat, red"?

**A:** The current vitality bar is a world-space billboard parented to the
slime (`src/scene/Slime.tsx:92-109`), so it travels with every hop and its
screen position depends on the camera. The user wants screen chrome instead:
a bar pinned to a fixed spot on the screen (DOM overlay), flat 2D, red fill,
always visible regardless of where the slime is or what the camera does. Both
defect rows land in `openspec/defects.md` (2026-08-31) and are reconciled by
this change.

### Q2: Should the world-space billboard bar be kept alongside the new screen bar?

**A:** No. Two bars for one creature contradicts the request ("the health of
slime … don't move if they moved") — the moving billboard is precisely what
the user is complaining about, and grilling must widen fidelity, not leave a
contradiction on screen. `src/scene/Slime.tsx` drops the `bar`/`fill`/`ghost`
group entirely; the HUD bar becomes the one canonical slime vitality display.
The 2026-08-30 `health-hud` requirement is MODIFIED by this change's delta.

### Q3: Where on the screen does the bar live, and what does it look like?

**A:** Top-center of the viewport (`position: fixed; top; left: 50%;
translateX(-50%)`), the same fixed-chrome idiom as `.toast` and `.hotbar` in
`src/index.css`. Flat 2D: an SVG-free DOM bar with a gold parchment frame
matching the HUD language (`#d8b56a` frame on `#241a10` bark, like the
billboard it replaces), red fill (`#e0483e` — user asked for red; the
green→ember→wound gradient of the billboard is retired), a `SLIME` label and
an `hp/maxHp` count, left-anchored fill width = `slimeHud.frac`.

### Q4: NICHE — "always be seen" is strong. Is the bar visible while the slime is dead and respawning (state `hidden`), before first input, during fishing, the book, the sleep veil, and the pause/menu?

**A:** Visible in every one of those states. `slimeHud.shown` already reports
`state !== 'hidden'` (`src/lib/slime.ts:34-39`); when hidden the bar stays on
screen at 0% fill with the count reading `0/3` — a dead slime still shows its
(empty) bar, which is what "always be seen" demands. The bar is rendered
outside the `hudHidden` gate in `src/App.tsx`, so sleeping, fishing, and the
book never remove it. The menu card overlays it (menu is modal chrome, the
bar is beneath and re-exposed the instant the menu closes). e2e pins this:
bar visible pre-input, during fishing, during book, and after the pop.

### Q5: NICHE — the HUD polls at 150 ms. Does the bar's fixed position ever jitter or lag behind the slime in a way tests could catch?

**A:** No. The bar is DOM with a fixed rect — it cannot move because nothing
positions it from world coordinates; the two variables are the fill width and
nothing else. The e2e asserts immobility structurally: it provably changes
the view (four player relocations around the slime with distinct camera yaw,
verified by `camX/camY/camZ` deltas in the snapshot) and requires the bar's
`boundingBox` to stay within 1 px. Two niche cases surfaced while grilling
this: (1) the slime can idle in a keep-out pocket where `wanderTarget` finds
no legal hop for a long time (`src/lib/slime.ts` `keepOut` ring around the
path/house near `SLIME_SPAWN`), so waiting on slime self-motion is not a
deterministic precondition — the test drives the view instead; (2) a
SwiftShader boot can freeze the rAF loop entirely (HUD `setInterval` DOM
keeps updating — prompt, stale fps — but `useFrame` never runs, so slime
updates freeze and buffered keydown edges are never consumed). `beforeEach`
heals that by polling `snapshot().t` (game time only advances when frames
run) and reloading until the loop ticks.

### Q6: What does "when I click right click I attack instantly" change mechanically?

**A:** Today the only attack is left-click: `consumeClickEdge(0)` triggers a
0.9 s swing with the hit applied on click but a hard lockout
(`attackUntil <= game.time`, `src/scene/Player.tsx:251-270`) that forces
waiting for the animation to run down. The change adds right-click (button 2)
as a separate instant attack: the edge registers on `mousedown` (not
mouseup+distance — fastest possible), the hit applies the same frame, and the
slash animation lasts `SLASH_TIME = 0.22` s. Hit rules are untouched:
`applySlimeHit` still requires ≤ 1.45 m and facing dot > 0.5
(`src/lib/slime.ts:160-167`).

### Q7: NICHE — "slash slash slash slash": what happens when right-click is pressed again while a slash is still playing? Does it queue, ignore, or restart?

**A:** It restarts immediately — every right-click mousedown is its own
slash: the timer resets to `game.time + SLASH_TIME`, the swing sfx replays,
and the hit check runs again. No lockout between slashes (that lockout is the
"waiting for it to go down" the user rejected). Left-click keeps its existing
0.9 s heavy-swing lockout, so the two buttons read as two moves: heavy swing
vs. rapid slash. e2e proves rapid re-slash by landing 3 right-clicks and
polling HP 3 → 0 with the slime popping.

### Q8: NICHE — can holding or spamming right-click outside hit range still swing? Should misses cost anything?

**A:** Swings always play (the animation and sfx are unconditional feedback),
but hits only land inside the 1.45 m frontal arc — a swing at air costs
nothing and no hit registers (`applySlimeHit` returns null). No stamina or
cooldown resource exists in this codebase and none is added. e2e covers the
miss case: facing 180° away from the slime, a right-click leaves
`slime.hp` unchanged.

### Q9: NICHE — input edges are buffered 5 s (`EDGE_BUFFER_MS`, `src/lib/input.ts:6`). Can a right-click that happened mid-menu fire after the menu closes?

**A:** Yes, that leak is real and this change closes it twice over. First,
blocked states (menu/book/fishing/sit/faint, mid-chop) consume-and-discard
click edges every frame (the sit and faint early-return branches included).
But grilling stress-tested that fix against the SwiftShader caveats: if the
rAF loop freezes for seconds, no frame runs, so no discard runs either, and
a 5 s edge would fire the instant frames resume (observed live: an attack
with progress 0.953 firing ~0.9 s after the menu closed). So the real
guarantee is expiry: click edges live in a 150 ms window
(`CLICK_EDGE_BUFFER_MS`) — a click that is not honored within 150 ms of
mousedown dies on its own, stale or not. Key edges keep the 5 s buffer
because movement re-sends keys continuously; a single click does not.

### Q10: NICHE — the browser context menu. What happens on right-click over the canvas, over the gear button, and over menu sliders?

**A:** The global `contextmenu` event is prevented so the native menu never
interrupts play — the whole window is the game. Right-click on
`.clickable-ui` elements (gear, menu controls) is dropped before it becomes
an attack edge: the mousedown handler applies the same `.clickable-ui` guard
the left-click handler already has (`src/lib/input.ts:81-89`). e2e
right-clicks the gear button and asserts no attack occurred (`attack`
progress stays 0, `attackDur` never set).

### Q11: How is "the animation is quick and fast" verified without violating the "never assert on wall-clock durations" rule?

**A:** Structurally. The snapshot exposes the swing duration
(`game.attackDur`, rounded — `src/scene/Probe.tsx`), held at the current or
most recent swing's duration so a SwiftShader frame stall can never skip past
the window being asserted; the e2e asserts the right-click slash reports
`0.22` while the left-click heavy swing still reports `0.9`. Speed of
*effect* is asserted state-based: after one right-click, polling (150 ms
cadence) observes the HP drop within a couple of polls, and after N rapid
clicks HP has dropped N times. No wall-clock assertion anywhere.

### Q12: Does the heavy left-click attack change at all?

**A:** Only in that it shares the new variable-duration plumbing
(`attackDur` ref in `Player.tsx` instead of the hard-coded `0.9` in the
progress formula — same number, one source of truth). Its trigger, lockout,
sfx, damage, and animation are untouched; existing tests
(`e2e/health.spec.ts` "sword swings drain the vitality bar") must stay green
unchanged.

### Q13: NICHE — state machine edge cases: what does a slash do to the slime mid-hop (`air`), mid-`windup`, while the slime sits on the player (contact push), and to the pop/respawn pipeline?

**A:** Nothing changes — deliberately. `applySlimeHit` already handles air
(boosts `vy ≥ 1.2`), windup (interrupts via knockback velocity), and contact
(overlaps are resolved independently in `updateSlime`). Pop still spawns gel
via the seeded rng, still fires `questEvent('slime')`, still starts the 20 s
respawn, and `skipSlimeRespawn` still shortens it for tests. The rapid-slash
e2e exercises the full pipeline end to end: 3 hits → pop → gel pickups →
quest progress → `hidden` with `slimeHud` at 0.

### Q14: HUD/audio/perf/determinism sweep — what does this change cost?

**A:** HUD: one extra DOM subtree updated by the existing 150 ms poll
(`slimeHud` was already mirrored in the snapshot; `App.tsx` adds two fields
to `Stats`). No per-frame allocations anywhere (fill width is a style string
composed during the 150 ms poll; `Player.tsx` uses a ref for `attackDur`).
Audio: reuses the existing `swing`/`hit`/`pop` sfx — no new sounds, no
`Math.random()` (slime gel still uses the seeded `mulberry32(31337)`).
Perf: removing the billboard deletes four depth-tested transparent meshes
from the slime render. Determinism: no new rng consumers.

### Q15: What is the e2e contract delta (`window.__Ghibli`) and where do the new tests live?

**A:** Snapshot gains `attackDur` (rounded, active swing duration, 0 when
idle). `slimeHud` (`shown`/`frac`) already exists and is the state source for
the bar. New file `e2e/combat.spec.ts` holds: instant right-click hit, fast
`attackDur`, rapid re-slash pop, fixed/red/always-visible bar (boundingBox
stability + fill color + visible-while-hidden), UI-guard tests (gear,
menu-buffer leak), and the facing/miss arc test. Assertions poll snapshots —
never wall-clock — per the SwiftShader caveats in `AGENTS.md`.

### Q16: Scope fidelity check — is anything from the user's message left unimplemented or silently cut?

**A:** No. (1) Game started — dev server brought up for the user. (2) Slime
health always visible, screen-fixed, 2D flat, red — HUD bar replaces the
billboard. (3) Right-click attacks instantly with a fast slash-slash-slash
animation — button-2 instant slash at 0.22 s with no inter-slash lockout,
heavy left-click preserved. (4) Grilling, openspec change, and e2e
validation — this change plus `e2e/combat.spec.ts`. The one interpretive
decision (removing the old moving bar, Q2) widens fidelity rather than
shrinking scope.

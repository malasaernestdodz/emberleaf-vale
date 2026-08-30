# Grilling — Enclose the windmill shell

Worked example installed with `/grill-me` (adapted from mattpocock/skills
`grilling`). Every answer is grounded in the repo's own files.

### Q1: Does "enclose" also mean the door slit must not stay open above the lintel, or only the balcony gap?

**A:** Both openings are in scope: the door slit currently runs full height
above the lintel (3.87 u) and the balcony gap runs full height below the deck
(proposal "Why", items 1 and 2). The change closes the door slit above the
lintel and the balcony gap below the deck, leaving exactly two openings: the
ground-level door slit and the above-deck balcony doorway
(`specs/windmill-shell` requirement 1).

### Q2: Does capping the balcony-arc colliders at deck height create a cheat path, e.g. jumping from the porch over the capped boxes?

**A:** No — `jumpApex ≈ 0.85` cannot clear the ~5.2 u cap
(`MILL.base + MILL.top` minus plinth), and vertical gating in `collide.ts`
(`feetY > top − 0.05 → skip`) means a deck-level player (feet ≈
`MILL.base + MILL.top + 0.02`) crosses unblocked while a porch-level player is
stopped (design "Collider caps").

### Q3: Do the three stacked wall bands follow the project conventions on dimensions and materials?

**A:** Yes — all band boundaries derive from existing `MILL` constants in
`src/lib/world.ts` (lintel top 3.87, `MILL.top`, per-band interpolated radii
of the same 5.5 → 4.5 taper), same material, no new material or texture work,
matching `openspec/project.md` conventions and the rejected alpha-mask
alternative in design "Alternatives rejected".

### Q4: Do the band seams introduce slivers of sky or z-fighting at 3.87 and `MILL.top`?

**A:** Bands share exact boundary heights with the lintel (3.87) and the deck
(`MILL.top`), and the deck ring (`r0 = 4.35 → r1 = 7.3`) covers the wall
radius (~5.1 at that height) at the mid/upper seam, so no slivers appear
(design "Band layout"); the gallery shell pose reviews the silhouette in
practice.

### Q5: What is the perf cost of replacing one wall cylinder with three bands, and does it conflict with the culling/governor work?

**A:** Two extra draw calls for the two added bands — accepted here and
explicitly preferred over the "one full-height cylinder per opening (6
segments)" alternative rejected for draw calls (design "Alternatives
rejected"); no per-frame allocations, no instancing changes, so the perf
governor and culling work are untouched (`openspec/project.md` conventions).

### Q6: Does the change introduce any nondeterminism that could break the e2e suite?

**A:** No — geometry is derived from fixed constants (no new rng calls), so
`mulberry32` determinism is preserved and the world layout stays identical
between runs and between app and tests (`AGENTS.md` hard rules,
`openspec/project.md` conventions).

### Q7: Which existing paths must stay green, and could the new colliders break them?

**A:** The walk-in (ground door), the climb-to-vista (spiral + deck doorway),
and the collider ring checks at `millWorld(MILL.rWall, 0)` (phi = 3π/2, far
from the arc) are all unaffected because only segments inside the balcony arc
change and they keep full-height tops elsewhere (proposal "What Changes",
design "Collider caps" final paragraph).

### Q8: Which e2e assertions prove each requirement, and are they state-based per the test contract?

**A:** `e2e/collision.spec.ts` gains the porch-level wall-stop run along the
arc plus a collider-top invariant (capped arc vs full-height outside it), and
`e2e/gallery.spec.ts` gains the windmill shell pose; all drive the player via
`window.__Ghibli` teleport/poll snapshots — state-based, never wall-clock
(`specs/e2e-verification`, `openspec/project.md` conventions).

### Q9: Playtest reports "no floor when I go up the staircase" — what exactly is see-through along the spiral climb?

**A:** The walk surface is a smooth phi-ramp in `groundHeight`
(`src/lib/world.ts`, `d > MILL.rampR0`) while the visual is 34 separate step
boxes (`src/scene/Windmill.tsx`, `STEPS = 34`) whose tops track the ramp but
which have no continuous under-surface, so gaps show through between/under
the treads. Two more faces render single-sided the wrong way: the roof cone
(FrontSide → sky visible from inside the tower) and the ground-floor
`circleGeometry` (vanishes from below). Fix set: a continuous spiral
under-surface (helical ribbon/skirt under the treads), double-sided or
dedicated interior faces for roof and ground floor, gated by a tower-interior
gallery pose reviewed by screenshot (`openspec/defects.md` row 1).

### Q10: Is the ground doorway visually consistent with its walkable width?

**A:** No — the walkable corridor is `|lx| < MILL.doorStepW` (1.35 → 2.7 u
wide) and the wall slit is `2 · doorHalf · rWall ≈ 2.5` u, but the frame
posts sit at `±sin(doorHalf) · (rWall + 0.12)` (≈ 2.53 u apart) and the single
1.7-wide leaf box is offset and rotated (-1.15) inside the slit, so the
opening looks unframed and half-covered ("no proper door"). Fix: derive post,
jamb, and leaf widths from `MILL.doorStepW` / `MILL.doorHalf` so the frame
fills the slit exactly and the leaf hinges at one post
(`openspec/defects.md` row 2).

### Q11: After Q9/Q10, is any interior see-through path left in the shell?

**A:** Bands 1–3 already close the wall slit above the lintel and below the
deck (implemented in `Windmill.tsx`); the remaining see-throughs are exactly
the roof cone and floor circle from Q9. They become explicit requirements in
this change so the gallery pose, a tower-interior screenshot, and the full
Playwright suite gate them.

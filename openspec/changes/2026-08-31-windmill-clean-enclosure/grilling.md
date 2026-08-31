# Grilling — Windmill clean enclosure (door-height openings only)

Agent-answered interrogation against `openspec/project.md`, `AGENTS.md`, the
archived `windmill-shell` / `e2e-verification` specs, and the 2026-08-31
defect row in `openspec/defects.md`.

### Q1: The 2026-08-30 enclosure landed green — what exactly is still wrong with the mesh?

**A:** The user reports the mesh is still not a clean enclosure ("just door
open"). The archived spec itself carved out an exception: "the vista-balcony
arc (from the deck to the wall top)". In `src/scene/Windmill.tsx` the upper
band is one cylinder `[MILL.top, 0.6 + WALL_H]` whose theta range cuts the
balcony arc over its entire ~8.7 u height, so above the doorway lintel
(deck + 3.43) the tower is an open notch — sky and interior visible from
outside and from the deck (visible in `test-results/gallery/windmill-landing.png`).
The band split that closed the door slit above its lintel was never applied
above the balcony doorway.

### Q2: What does "have floor in top" require beyond what exists?

**A:** The floor at the top of the climb is the balcony deck ring
(`MILL_BALCONY.r0 → r1` at `MILL.top + 0.02`, plus the landing ring inside the
wall); the screenshot sweep shows both present and solid — no hole and no
see-through from the deck. What is missing is the wall above the doorway, not
a floor. The requirement is restated as: deck = walkable top floor, doorway
bounded deck → lintel, wall solid from the lintel to the wall top.

### Q3: "Just door open" — which openings may remain in the shell?

**A:** Exactly two door-sized openings: the ground door slit (plinth → lintel
top 3.87, leaf hinged open at 0.57 rad) and the balcony doorway (deck →
deck + `lintelH`, framed by jambs and a lintel, no leaf — it is the deck
threshold). Every other position on the tower silhouette shows wall or roof.

### Q4: Should the balcony move to the very top of the tower, under the roof?

**A:** No — the facts settle it: the spiral grade contract
(`e2e/scale.spec.ts`: 0.15–0.55) makes a climb to 15.1 u impossible on the
current arc (rise ≈ 13.9 over ≈ 13.6 m path ≈ grade 1.02), the sail hub sits
at 12.2 u (`MILL_TOWER.hubY`) so a deck there would sit inside the sails, and
the archived collision spec requires "the existing climb-to-vista path stays
green". "Balcony in top" = the top of the climb, which the deck at `MILL.top`
already is; the defect is the wall above it.

### Q5: Does bounding the doorway change any collision behavior?

**A:** No. The wall ring already emits the balcony arc with
`top = MILL.base + MILL.top` (deck height) and full-height tops elsewhere —
asserted by `e2e/collision.spec.ts`. The doorway opening lives below
deck + 3.43 while the player body is 1.55 u (`PLAYER.h`) with a 0.845 u jump
apex (`PLAYER.jumpApex`), so nothing reaches the newly solid band above the
lintel and no collider is added there. Walk-in, climb, deck-crossing, and
porch wall-stop paths are untouched.

### Q6: What new constants and conventions does the fix introduce?

**A:** One constant: `MILL_BALCONY.lintelH` in `src/lib/world.ts` (3.5 u,
doorway height above the deck). Jambs, lintel offset, and the split-band
heights derive from it; band radii keep the same linear 5.5 → 4.5 taper
(`BAND_R` interpolation split at deck + `lintelH`), same toon material, no
texture work — matching `openspec/project.md` conventions ("All prop
dimensions live in src/lib/world.ts").

### Q7: Does the upper band split create slivers or z-fighting at the new seam?

**A:** No — band 3a ends exactly at deck + `lintelH` and band 3b starts at the
same height with interpolated radii from the same `BAND_R` line, so the seam
is shared-exact like the existing 3.87 / `MILL.top` seams (design "Band
layout"); the lintel box (0.26 tall, centered deck + `lintelH` + 0.13, at
`rWall + 0.12`) covers the joint from outside the same way the ground lintel
covers 3.87. The gallery upper pose reviews the seam by screenshot.

### Q8: Perf and culling impact?

**A:** One extra draw call (four wall bands instead of three) — same class of
cost the previous change accepted; no per-frame allocations, no instancing or
governor changes, `userData.cullId: 'windmill'` untouched
(`openspec/project.md` perf conventions).

### Q9: Determinism — can the fix break the e2e suite between runs?

**A:** No. Geometry derives from fixed `MILL` constants; no rng calls are
added, so `mulberry32` determinism and the world layout are unchanged
(`AGENTS.md` hard rules).

### Q10: Which e2e assertions prove the fix, and are they state-based?

**A:** `e2e/entity-audit.spec.ts` gains constant invariants in the windmill
test: `MILL_BALCONY.lintelH ≥ PLAYER.h + 0.5` (headroom) and
`> PLAYER.jumpApex + 1` (a jump from the deck cannot reach the lintel bottom).
`e2e/gallery.spec.ts` gains a `windmill-upper` exterior pose recording the
tower from outside the balcony so the solid wall above the doorway lintel is
reviewed by screenshot; the existing `windmill-landing` pose doubles as the
interior review. All assertions stay state-based via `window.__Ghibli`
(`specs/e2e-verification`).

### Q11: Does the screenshot sweep expose any other see-through path in the shell?

**A:** No. Reviewed poses: `windmill-shell` (porch wall — solid),
`windmill-door` (frame fills the slit, leaf open),
`windmill-spiral` (continuous under-surface, no gaps), `windmill-landing`
(deck solid; the dark wedge is the doorway lintel seen from inside at close
range, re-verified after the fix), `collision-windmill-top/balcony` (roof and
deck present). The only sky-leak left in the shell is the Q1 notch above the
balcony doorway lintel.

### Q12: Scope fidelity — is anything from the user report quietly dropped?

**A:** No. Enclosed → bands 3a/3b close everything above the doorway lintel;
floor on top → deck verified solid (Q2); just door open → exactly the two
door-sized openings (Q3); functional end to end → walk-in → spiral → deck →
lookout quest path gated by the full Playwright suite; clean mesh → jambs and
lintel cover the raw cylinder cut edges; apply validate → `spec:validate`,
`build`, `lint:sg`, full `test:e2e` are the exit gates in `tasks.md`.

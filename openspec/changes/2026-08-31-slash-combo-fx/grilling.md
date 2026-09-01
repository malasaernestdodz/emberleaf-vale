# Grilling — One fast combo slash + procedural slash-arc VFX

Agent-answered interrogation against `openspec/project.md`, `AGENTS.md`, the
archived specs, the (unarchived) `combat-health` delta of
2026-08-31-slime-hud-and-right-click-slash, the user's 2026-08-31 report with
reference art (anime slash-arc sheet: cyan arcs, bright core, feathered
trail), and the two new open rows in `openspec/defects.md`. Niche cases are
marked `NICHE:` and each lands as a scenario, a guard, or a test.

### Q1: What exactly is "the drift" the user wants removed?

**A:** The previous change shipped two divergent attacks: a committed 0.9 s
heavy swing on left-click (`HEAVY_TIME` in `src/scene/Player.tsx`) and a fast
0.22 s slash on right-click. The user asks "why do I need right-click to see
the attack speed" — the fast attack must be THE attack, on both buttons. The
new change removes the heavy swing entirely: left-click and right-click both
trigger the same instant fast slash, one code path, one duration
(`SLASH_TIME = 0.25`), one `attackDur` in the snapshot. The heavy-only
scenarios from the prior delta are superseded by this change's delta.

### Q2: What does "combo based like Zelda handles it" mean mechanically?

**A:** Zelda-style light-attack chains: each press chains into the next combo
hit with no lockout, and consecutive hits alternate swing direction so the
blade sweeps horizontally one way then the other (two-stage chain: stage 0
sweeps right→left, stage 1 sweeps left→right, then repeats). `src/lib/slash.ts`
holds the state machine (`stage: 0 | 1`, `dir: 1 | -1`, `active`, `t`),
plain-module like `slime.ts`, updated from the player frame loop. The hit
check re-runs per click (unchanged `applySlimeHit` rules: 1.45 m, facing dot
> 0.5).

### Q3: NICHE — does the combo stage persist forever? What happens after a pause in attacking, a blocked state, sitting, fainting, or chopping?

**A:** A combo window (`COMBO_WINDOW = 1.1` s since the last slash started)
decides: press within the window chains to the other stage; press later
resets to stage 0 — the same pattern Zelda uses so a fresh encounter always
opens with the same swing. Blocked states (menu/book/fishing/sit/faint/
mid-chop) and the sit/faint early returns reset the stage to 0 and discard
click edges as before, so the chain never resumes out of a stale buffer.

### Q4: NICHE — how do AAA studios and indies handle slash effects in 3D, and what fits this repo's zero-downloaded-assets rule?

**A:** Industry practice for melee VFX in 3D, no sprites needed: (1) mesh
sword trails — a ribbon swept along the blade tip across the swing, the
Devil May Cry / Bayonetta idiom; (2) arc fans — a pre-shaped annulus-sector
mesh oriented along the swing plane, the common indie/shmup idiom and
exactly the reference art's look; (3) flipbook sprite sheets — needs
downloaded textures, banned here; (4) post-processing glow (bloom) layered
on top so the additive arc reads as energy. This change implements (2) +
(4): a procedural vertex-colored arc fan (annulus sector, feathered edges
via vertex alpha, cyan core like the reference) with additive blending,
picked up by the existing `Bloom` pass in `src/scene/Effects.tsx`. No
textures, no `Math.random` — all geometry and colors are constants, keeping
the zero-asset and determinism rules intact.

### Q5: What is the anatomy of the slash-arc VFX?

**A:** One pooled arc fan per combo stage (2 total, prebuilt at mount):
annulus sector in the XZ plane centered on the player's chest height, inner
radius 0.45, outer radius 1.25, span 150°, subdivided so vertex colors
feather the edges (bright `#9ff3ff` leading edge → `#2fa8ff` body →
transparent tail) — matching the reference sheet's cyan arcs. The mesh is
additive (`blending: AdditiveBlending`, `depthWrite: false`,
`side: DoubleSide`), `renderOrder` above the slime, yawed to the swing
direction (`dir` mirrors the fan) and follows the player position + heading
each frame while active. Life = the 0.25 s swing plus a 0.12 s fade-out
(opacity eases to 0), then the slot parks invisible. A second, thinner
counter-fan per stage gives the layered "wisps" look of the reference sheet.

### Q6: NICHE — what feedback exists on a HIT vs a WHIFF? Does the VFX play on misses?

**A:** The arc always plays — swing feedback is unconditional, otherwise a
miss reads as an unresponsive input. On a hit (`applySlimeHit` returns
'hit'), the existing squish + knockback still fire and a pooled hit-ring
(a small flat annulus at the impact point, 0.35→0.75 m over 0.18 s, additive
white-cyan) blooms once — the "impact frame" idiom. On a pop, gel spawn and
quest progress are unchanged. A dedicated hit-sound stays `playSfx('hit')`;
no new sfx are added (grilling decision: reuse, the audio vocabulary already
covers swing/hit/pop).

### Q7: How does the arm/body animation go horizontal instead of the old vertical chop?

**A:** During the swing progress `p` (0→1 over `SLASH_TIME`): the sword arm
sweeps across the body via `armR.rotation.y` from `dir * 1.9` to
`-dir * 1.6` (eased), with `rotation.x` held near a slight forward tilt and
a small `rotation.z` lift so the blade reads horizontal; the body adds a
counter-twist `body.rotation.y = dir * 0.45 * sin(p * PI)`. Airborne, the
same sweep plays (Zelda allows air slashes). Legs keep the walk cycle. No
per-frame allocations — the sweep is pure math on existing refs.

### Q8: NICHE — what happens when the player clicks during a swing, spam-clicks, holds the button, or attacks in mid-air over the pond?

**A:** Every press chains: `start()` restarts `t` and flips stage, so rapid
clicks read slash-slash-slash with alternating direction (exactly the
requested feel). Holding does nothing extra — edges fire on press only, no
auto-repeat is added (Zelda's light attack is also press-driven; hold-to-spin
is a different move and out of scope). Mid-air slashes play the full
animation and VFX; the pond slow-zone doesn't alter attack timing. The hit
check still requires the slime visible — swinging while it respawns is a
legal whiff.

### Q9: What is the perf budget and how is it tested (the user asked for fps testing)?

**A:** The VFX pool is 4 meshes total (2 stages × arc + counter-fan) plus 1
hit ring — worst case +5 draw calls during a swing, additive materials with
no depth writes are cheap, and bloom cost is unchanged (threshold 0.72
already catches bright pixels). No per-frame allocations; the fan geometry
and colors are built once. Tests mirror the `boots with perf budgets`
idiom: an e2e slash-burst test asserts the `fps` gauge stays > 2 and
`drawCalls` rise by at most 8 over a measured idle baseline while slashing,
using snapshot polls only (SwiftShader wall-clock is never asserted).

### Q10: NICHE — how is "make it look correct" validated without a human?

**A:** Three layers: (1) state — the snapshot exposes `slash` (`stage`,
`dir`, `active`) and the scene probe exposes `objectVisible('slash-arc-0')`
/ `'slash-arc-1'` / `'slash-hit-ring'`, so the e2e proves the VFX is
actually shown during a swing and parked after the fade; (2) pixels —
`?lite` keeps `preserveDrawingBuffer`, and the test arms a page-side
requestAnimationFrame sampler that scans the FULL canvas every rendered
frame (round-trip-free), takes a pre-click baseline of matched pixels, and
requires ≥ 100 new matched pixels after 8 slashes — a live run measured
~342 matching pixels mid-swing vs ~20 idle, so the threshold has huge
margin; frame stalls cannot hide the arc because the sampler only samples
frames that actually rendered; (3) artifacts — the test saves a mid-slash
screenshot under `test-results/slash-fx/` for human review.

### Q11: What changes in the e2e contract and the existing combat tests?

**A:** Snapshot gains `slash: { stage, dir, active, since }`; `attackDur`
now reports 0.25 for both buttons; the probe gains `probeClickEdge(button)`
(a non-expiring click edge through the exact same consume path, for
deterministic chains at SwiftShader's 1-2 fps where the 150 ms mouse-edge
window cannot survive a ~1 s frame gap). `e2e/combat.spec.ts` is updated:
the "heavy sword" test becomes "both buttons share the fast combo" (0.25 on
left-click too), combo alternation and the late-press reset are driven with
probe edges, the UI-guard and stale-buffer tests keep REAL mouse clicks
(still 0/never-fire — they exercise the expiring mouse path), and the
instant-hit and rapid-pop tests are unchanged in meaning. The old 0.9
assertion is deleted with the heavy swing.

### Q12: NICHE — interactions with the vitality bar, quests, respawn, pause, and the previous change's spec scenarios?

**A:** The bar/`slimeHud` pipeline is untouched (drains per hit, 0/3 while
hidden). `questEvent('slime')` still fires on pop; respawn and
`skipSlimeRespawn` unchanged. `game.paused` freezes the frame loop so the
VFX freezes with it (no timers of its own — everything is driven from the
player useFrame). The prior change's scenarios (instant hit, rapid slashes,
UI guards) remain true; this delta restates the slash requirement with both
buttons and the combo chain, superseding the two-button split.

### Q13: What about the failing windmill tests in the tree?

**A:** Pre-existing regressions from the peer-committed windmill geometry
refinements (recorded in `openspec/defects.md`, owned by
2026-08-31-windmill-clean-enclosure): `groundHeight` no longer matches
`MILL` constants at the deck/landing/wedge — math.spec.ts:59/:174,
scale.spec.ts:45, collision.spec.ts:436/:526, and world.spec.ts:802 (the
last verified failing on the clean committed tree via `git stash`). This
change must not touch windmill code (one agent per change — the peer also
has in-flight `Windmill.tsx` edits), so its full-suite gate tracks those
exactly 6 rows as known-failing and requires zero NEW failures anywhere
else. The peer's concurrent edits also invalidated one mid-run suite
earlier (source changed under the running tests) — suites are therefore
validated against a tree state, not across one.

### Q14: Scope fidelity check — is anything from the user's message left unimplemented?

**A:** No. (1) Grilling re-run — this document. (2) Drift removed — one
fast combo attack on both buttons, heavy swing deleted. (3) Horizontal
Zelda-style combo — alternating two-stage chain with horizontal arm/body
sweeps. (4) AAA/indie slash effect in 3D — procedural arc-fan VFX + counter
wisps + bloom + hit ring, with the industry-alternatives analysis in Q4.
(5) fps and visual testing — the perf-budget slash-burst test, VFX state/
pixel assertions, and saved mid-slash screenshots. (6) openspec + strict
e2e — this change and its gates.

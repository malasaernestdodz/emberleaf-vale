# Grilling — Slime pack + boss, per-slime bars, windmill door/perspective

Agent-answered interrogation against `openspec/project.md`, `AGENTS.md`, the
archived `combat-health`/`health-hud`/`slash-fx`/`windmill-shell` specs, and
the four open 2026-09-01 rows in `openspec/defects.md` (user report with
screenshot of the sealed windmill door). Niche cases are marked `NICHE:`.

### Q1: The screenshot shows NO open door. The commit message says "windmill geometry refinements" — what actually broke?

**A:** The committed peer change rebuilt the wall bands. Band 1 (plinth →
lintel) carries the door slit via `thetaStart=doorHalf, length=2π−2·doorHalf`
— that part is still correct. But the landing/deck `groundHeight` branches in
`world.ts` drifted from the mesh (math.spec 59/174, scale 45, collision
436/526, world 802 fail: deck 6.74 vs 11.94 at some radii, landing 11.90 vs
11.94), and `MILL_BALCONY.phi0 = 2π − 0.24` with the wrapped-arc test
`phi >= phi0 || phi <= phi1` combined with band-3's
`balcThetaStart = 2π − phi0; balcThetaLen = phi0 + doorHalf` makes the upper
band's hole cover the wrong theta span (it re-cuts the ground door arc above
the lintel instead of leaving the crown solid). This change re-derives every
band/branch from ONE pair of constants (`MILL.doorHalf`, `MILL_BALCONY.phi0`)
and adds e2e mesh-vs-collider invariants so this cannot silently drift again.

### Q2: NICHE — what exactly does "door open" require visually AND collision-wise?

**A:** Visually: the ground door leaf hinged open at 0.57 rad (as before),
door slit clear from porch to lintel, and from outside you can see the
interior floor through the opening. Collision-wise: the wall collider ring
must keep the door arc clear (it already does via `MILL_DOOR_CLEAR`), and the
e2e walk-in test (`world.spec:802`, `collision.spec:74`) must pass again.

### Q3: What does "when I'm inside the windmill the zoom-in is just normal, not so zoom" mean numerically?

**A:** Inside the mill, the camera distance multiplier for interior3
(`lerp(1, 0.55, indoor)` in CameraRig) compresses toward 0.55 too
aggressively when combined with the `circleWall` clamp at `MILL.rIn − 0.25`
(4.3), which at pitch 0.46 leaves a cramped over-the-shoulder view. The fix:
inside the mill the allowed distance floor rises (min 2.6 instead of 0.5) and
the interior distance share for interior3 is 0.8 (not 0.55), giving a "normal"
third-person distance that still stays inside the drum. e2e asserts
`camDist`-independent state: inside the mill, camera-to-player distance stays
within [1.5, 5.5] and the camera's horizontal position stays within
`MILL.rIn − 0.25` of the mill center.

### Q4: NICHE — "there should be a collision so if I'm inside I see the inside only" — how do you guarantee the camera NEVER leaves the drum while the player is inside?

**A:** Today the circle clamp runs only when `interior3 > 0.5`; between 0.02
and 0.5 (entering/leaving) the camera can pop outside through the wall. The
fix: (1) the `circleWall` clamp applies whenever `interior3 > 0.02` (matching
the house/mansion pattern); (2) the clamp is unconditional hard (position
reset, not damped) when `game.insideMill`; (3) a new `game.insideMill` flag
(dist < MILL.rIn − 0.1) mirrors `game.inside`/`insideMansion`. e2e: with the
player teleported inside and camDist forced to 11, sweeping camYaw 0→2π in 8
steps, the camera's XZ distance from the mill center never exceeds
`MILL.rIn + 0.05`.

### Q5: "I look where I look initially at windmill" — what does the initial camera orientation have to do with anything?

**A:** `game.camYaw` starts at 0.43 and SPAWN faces the plaza; the user's
first view is the windmill wall filling the frame with no context. The spawn
heading and camYaw are retargeted so the initial frame shows the windmill
from an angle where the door is visible (spawn-side approach view), not a
flat wall — camera `camYaw = MILL.yaw + π + 0.55` seed so the door faces the
camera at boot.

### Q6: "Add more slime and big boss slime" — what pack layout, and where does the boss live?

**A:** Three regular slimes (the existing one + 2 more) wandering the
meadow near the spawn-plaza path, and ONE boss slime — big (2.2× radius,
12 HP), slower windup, heavier knockback — parked at a fixed arena spot
(near the pond's north bank, clear of keep-out zones). All state lives in
`src/lib/slime.ts` as a `slimes: Slime[]` array plus a separate `boss`
object (same state-machine shape, different constants). Contacts/hits/pops
iterate the array; the boss is only damaged within its own (larger) hit
range. Keep-out for regular slimes is unchanged; the boss is stationary by
design (it hops in place), so no wander logic is needed for it — NICHE:
stationary boss avoids colliders/water entirely.

### Q7: NICHE — how do hit/knockback/contact work with multiple slimes? Does one slash hit all of them?

**A:** `applySlimeHit` becomes `applySlimeHit(px, pz, fx, fz)` returning the
FIRST slime hit within range (regulars checked in order, then the boss) —
one slash, one victim, exactly like Zelda. Contact damage: each slime
checks its own distance to the player (regular 1.35 m splash on landing,
boss 2.2 m heavier splash). i-frames are global (existing 1.2 s), so a pack
cannot chain-drain hearts in one bump. e2e covers: two slimes side by side,
a slash hits exactly one (the closer to the crosshair arc).

### Q8: NICHE — what happens when a regular slime pops while the boss is alive? Respawn timers? Does the boss respawn?

**A:** Each regular slime respawns independently at its own spawn point
after 20 s (existing logic, per-entity `respawnT`). The boss does NOT
respawn automatically — it pops into a gel fountain (6 gel pickups) and
stays hidden for 90 s, then returns (long cycle so the HUD bar visibility
contract is testable both ways). `skipSlimeRespawn` shortens all timers
(test hook unchanged).

### Q9: "The slime health bar above my HUD is only for the boss supposedly" — what is the exact bar contract now?

**A:** (1) The screen-fixed top-center HUD bar (`.slime-health`) becomes the
BOSS bar: it shows `slimeHud` state of the boss only, labeled `BOSS SLIME`,
visible always (0/12 while hidden), red fill — all previous HUD-bar
scenarios carry over with the boss as subject. (2) Regular slimes get a NEW
per-slime bar: a flat 2D bar that stays ABOVE the slime — screen-projected
from the slime's world position each frame (projected onto the viewport,
not billboarded in 3D), 2D flat styling identical to the HUD bar (gold
frame, red fill), ~46×7 px. "Not moving when they move" is interpreted as
the user's words for "it shouldn't wobble/rotate/parallax in 3D — it stays
a flat screen-space rectangle pinned above the creature": the bar
translates with the slime's projected position (that's what "on top of
them" requires) but never rotates, never scales with distance beyond a
clamped range, and keeps its fixed pixel size. NICHE: outside 18 m or
off-screen, the bar hides (it's attention UI, not radar); occluded slimes
still show their bar (depth reads wrong behind grass otherwise).

### Q10: NICHE — how are the projected bars rendered without breaking the zero-allocation rule?

**A:** A `SlimeBars.tsx` overlay inside the Canvas parent DOM (absolute
positioned divs updated in useFrame via direct style writes — no React
state per frame, no per-frame allocations: one div per slime created at
mount, `transform: translate(x, y)` strings composed into reused
`THREE.Vector3` scratch). Projection: `slime.position → project(camera) →
screen px`, clamped to viewport. The divs are pointer-events-none and skip
render entirely when `?lite` perf governor drops tier below 1.

### Q11: How does combat observability change in the snapshot?

**A:** `slime` (singular) stays for backward compat but now reports the
BOSS (state machine identical). New `pack: [{ x, z, state, hp, maxHp,
visible }]` lists the regular slimes. `slimeHud` continues to mirror the
boss for the HUD bar. `applySlimeHit`-driven tests in combat.spec keep
working against the boss; new tests use `pack`. NICHE: `health.spec.ts`
"damageUntil" walks teleport-to-slime — it targets `slime.x` (the boss
now) whose contact damage is unchanged, so it stays green without edits.

### Q12: NICHE — quest/interactions regressions?

**A:** `questEvent('slime')` fires on ANY pop (regular or boss). The quest
target stays 1. Gel pickups: regular 1–2, boss 6 — inventory economy
slightly richer, no quest math changes. Contact damage balance: regular
slimes unchanged (1 heart); the boss deals 1 heart too but with a larger
splash radius and stronger knockback (4.2 → 6.0 impulse) — hearts are
scarce, so one-damage-per-touch keeps the game gentle (grilling decision).

### Q13: What is the perf budget for the pack + bars?

**A:** +2 regular slime bodies (~2k tris each) + 1 boss body (~4k tris) +
3 DOM bars. Draw calls worst case +6. The e2e perf test (slash burst)
re-measures against the new baseline; budget stays ≤ +8 over idle. Grass
governor unchanged.

### Q14: Windmill scope — the peer has a change open for the enclosure. Do we collide?

**A:** `openspec/defects.md` rows dated 2026-08-31 for the windmill were
owned by 2026-08-31-windmill-clean-enclosure, but the tree is committed and
clean now; the user re-reports the door TODAY with a screenshot. This change
takes ownership of the mill door + perspective rows (they are
user-blocking), fixes the band geometry AND the groundHeight drift, and
archives the stale peer rows as superseded. The fix is constants-driven and
covered by new invariants (mesh theta spans vs collider arc, deck height at
3 radii, walk-in).

### Q15: What e2e contracts are added/changed?

**A:** (1) `combat.spec.ts`: boss-bar semantics (label/visible/frac), pack
bars exist as DOM elements with flat styling and track their slime's
projected position, one-slash-one-victim, boss 12 HP drain via probe edges,
boss pop → gel fountain → 90 s respawn. (2) `windmill` invariants in
`math.spec.ts`/`props.spec.ts`: door slit clear (collider arc), deck height
= `MILL.base + MILL.top` at 3 radii, landing single-valued. (3) Camera:
inside-mill sweep keeps camera inside the drum; normal zoom bounds.
(4) `health.spec.ts` untouched (boss mirrors old slime contract).

### Q16: Scope fidelity check — is anything from the user's message left unimplemented?

**A:** No. (1) Windmill enclosed with door open — bands + heights re-derived,
invariants added. (2) Interior zoom normal + inside-only perspective —
clamp/zoom/floor fixes + camera sweep test. (3) More slimes + big boss —
pack of 3 + boss with own HP. (4) HUD bar boss-only, regular slimes have
flat 2D bars on top that don't billboard — bar split implemented with
projection overlay.

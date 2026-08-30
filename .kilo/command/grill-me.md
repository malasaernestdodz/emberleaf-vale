---
description: "Grill an openspec change - relentless frontier interview (adapted from mattpocock/skills grilling, wired into openspec validation)"
---

Adapted from `mattpocock/skills` -> `skills/productivity/grilling` (MIT), with
this repo's twist: the agent settles every question it can itself from the
root context instead of bouncing facts back at the user, and the record is
machine-enforced by `npm run spec:validate` (changes dated >= 2026-08-31 need
`grilling.md` with at least 8 answered questions).

Run at the START of every change, every new entity or gameplay feature, and
again whenever scope changes. The argument `$ARGUMENTS` is an existing
`openspec/changes/<date>-<name>/` directory, or a feature description (create
the change dir with a proposal stub first, then grill it before fleshing out).

## Ground rules

- Interview relentlessly until the frontier is empty. Do NOT stop at the
  validation minimum of 8 - more answered questions means a better program.
- Facts are your job, never the user's: before asking anything, read
  `AGENTS.md`, `openspec/project.md`, every `openspec/specs/*/spec.md`, the
  change dir (proposal, design, spec deltas, tasks), and the relevant `src/`
  and `e2e/` files. Whatever they settle is answered, not asked.
- Decisions are the user's. Only true product decisions (not lookup-able
  facts) go to the user, in rounds.
- Grill toward MORE fidelity to the user's request. The failure mode this
  command exists for: the agent quietly shrinks or drops requested features,
  forcing the user to file follow-up openspec changes. When a question exposes
  a gap, widen the spec; never silently cut scope.

## Completeness sweep

Every dimension the change touches must be grilled - at minimum:

- Scope fidelity: what did the user's request imply that the proposal dropped,
  shrank, or merged? Name each gap and the answer that closes it.
- Model/geometry: dimensions live in `src/lib/world.ts`, materials, silhouette,
  enclosure (walls/roofs/interiors), no new textures (everything procedural).
- Animation/state machine: plain exported objects in `src/lib/`, updated from
  `useFrame`, framerate-independent smoothing, no per-frame allocations.
- Collision: `resolveCollisions(x, z, r, feetY)` with feet-Y, collider tops,
  walk-through and cheat paths (jumps, ledge clips).
- HUD/menus: readability, `.clickable-ui` marking, poll cadence, pause menu.
- Audio: procedural WebAudio, seeded rng scheduling, settings persistence.
- Interactions/quests: hooks into `items.ts`/`quests.ts`, gallery camera pose,
  `e2e/props.spec.ts` invariants for new props.
- Health/combat: hearts, damage sources, respawn, `skipSlimeRespawn` parity.
- Persistence: `src/lib/settings.ts` for anything remembered across sessions.
- Perf: culling (render distance), perf governor, observability via `trace.ts`.
- Determinism: `mulberry32` fixed seeds, no `Math.random()` anywhere.
- e2e contract: which `window.__Ghibli` hook and which Playwright spec proves
  each requirement; state-based polling, never wall-clock timing.

## Defect sweep (end to end)

- Read `openspec/defects.md` FIRST: every open user-reported defect touching
  the change's scope MUST become a grilled question and a spec requirement
  before the change is final. Close a ledger row only when the change's e2e
  proves the fix. New user reports land in the ledger first, never fixed
  spec-less.
- Run the visual sweep before finalizing: `npx.cmd playwright test
  e2e/gallery.spec.ts` (or `npm.cmd run test:props`) and review the
  screenshots at the change's vantage points — hunting see-through faces,
  missing surfaces under walkable positions, and openings whose frame is
  narrower than its collider. Every finding is a grilled question.
- Structure checklist for any built form (tower, house, mansion, new entity
  home): every walkable height has a visual surface under it; every opening
  (door, slit, arch) has frame + leaf matching its collider/walkable width;
  every closed volume has no FrontSide-only face viewed from inside (roofs,
  floors: double-sided or dedicated interior faces).

## Rounds

Work as a design tree in rounds. The frontier is every question whose
prerequisites are already settled. Per round, present the frontier in this
format (from the original skill):

```
❓ **Q1** - **<question title>**: <question body, may include choices>

➡️ <your recommended answer>
```

- Agent-answerable questions do NOT wait for a reply: record your
  recommendation as the answer immediately in the change's `grilling.md`
  (`### Q1: <question>` + `**A:** <answer, citing the files that settled
  it>`), and fold the decision into proposal/design/spec deltas/tasks at once.
- Only genuine user decisions wait. When the user answers, record their reply
  as the `**A:**` and recompute the frontier; their answers push it outward.
- A question that must reach the user but cannot (non-interactive run) is
  recorded as `**A:** ASK-USER: <question>` and asked at the next chance.
  Never check off its implementation tasks before it is answered.

## Finish

- `grilling.md` written in the change dir: at least 8 questions, every one
  with a non-empty `**A:**` (the validator parses exactly that shape).
- Every answer's decision is visible in the change docs - grilling.md is the
  reasoning record, not a parking lot. Close with one line per question: what
  changed in the change dir because of it, or that nothing did.
- Only then proceed: proposal -> design -> spec deltas -> tasks.

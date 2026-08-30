# observability Specification

## ADDED Requirements

### Requirement: Runtime metrics registry with counters and gauges

The game SHALL keep an allocation-free metrics registry (`lib/trace.ts`) exposing
monotonic counters with smoothed per-second rates plus numeric gauges, mirrored on
`window.__emberTrace.metrics()` for probes. Counter and gauge names SHALL be string
literals so HUD, devtools and tests can pin them.

#### Scenario: Gauges report live numbers after boot

- **WHEN** the world is ready and at least one tick has passed
- **THEN** `__emberTrace.metrics()` returns rows for `fps`, `draws`, `tris` and `tier`
  with finite numeric totals, `fps` greater than zero

### Requirement: Defect classes leave counter trails

Gameplay and engine anomalies SHALL be countable: collision pushes (`collide.push`),
step blocks, jumps, landings and falls (`player.*`), damage, healing, regen and faints
(`hp.*`), slime hits and pops (`slime.*`), and quality-governor moves
(`governor.up/down`) all increment named counters while they happen.

#### Scenario: Wall contact shows up as numbers

- **WHEN** the player walks into a solid wall for a couple of seconds
- **THEN** the `collide.push` counter totals at least 5 while the player stays blocked

#### Scenario: Damage shows up as numbers

- **WHEN** the slime contacts the player and knocks hearts off
- **THEN** the `hp.damage` counter totals more than 0

### Requirement: The perf panel surfaces the metrics

The [P] perf panel SHALL include a METRICS section listing the live counters and
gauges (rate/s where meaningful), each row addressable as `metric-<name>` for tests.

#### Scenario: Panel shows metric rows

- **WHEN** the player opens the perf trace with [P]
- **THEN** the panel lists at least one `metric-` row with a name and a number

import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = 'openspec'
const GRILL_CUTOFF = '2026-08-31'
const GRILL_MIN = 8
let specs = 0
let requirements = 0
let grilled = 0
let failures = []

function walkSpecs(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) walkSpecs(p, out)
    else if (e.name === 'spec.md') out.push(p)
  }
  return out
}

function check(file) {
  const src = readFileSync(file, 'utf8')
  const isChange = file.includes(`${ROOT}${join('/', 'changes')}`) || file.split(/[\\/]/).includes('changes')
  const hasDelta = /^## (ADDED|MODIFIED|REMOVED|RENAMED) Requirements$/m.test(src)
  if (isChange && !hasDelta) {
    failures.push(`${file}: change spec must declare a "## ADDED/MODIFIED/REMOVED/RENAMED Requirements" delta`)
  }
  const blocks = src.split(/^### /m).slice(1)
  const reqs = blocks.filter((b) => /^Requirement:/.test(b))
  if (reqs.length === 0) {
    failures.push(`${file}: no "### Requirement:" found`)
    return
  }
  requirements += reqs.length
  for (const r of reqs) {
    const scenarios = r.split(/^#### /m).slice(1).filter((s) => /^Scenario:/.test(s))
    if (scenarios.length === 0) {
      failures.push(`${file}: requirement "${r.split('\n')[0]}" has no "#### Scenario:"`)
    }
  }
}

for (const dir of [join(ROOT, 'specs'), join(ROOT, 'changes')]) {
  for (const f of walkSpecs(dir)) {
    specs++
    check(f)
  }
}

function checkGrilling(dir) {
  const file = join(dir, 'grilling.md')
  if (!existsSync(file)) {
    failures.push(`${file}: missing — run /grill-me (>= ${GRILL_MIN} answered questions, see openspec/project.md "Grilling")`)
    return
  }
  const qs = readFileSync(file, 'utf8').split(/^### Q\d+:/m).slice(1)
  if (qs.length < GRILL_MIN) {
    failures.push(`${file}: needs >= ${GRILL_MIN} "### Q<n>:" questions (found ${qs.length}) — the frontier is not empty yet`)
    return
  }
  grilled++
  for (const q of qs) {
    if (!/\*\*A:\*\*\s*\S/.test(q)) {
      failures.push(`${file}: question "${q.split('\n')[0].trim().slice(0, 60)}" has no "**A:** <answer>" line`)
    }
  }
}

if (specs === 0) failures.push(`${ROOT}: no spec.md files found`)

const changesDir = join(ROOT, 'changes')
if (existsSync(changesDir)) {
  for (const e of readdirSync(changesDir, { withFileTypes: true })) {
    if (e.isDirectory() && /^\d{4}-\d{2}-\d{2}-/.test(e.name) && e.name.slice(0, 10) >= GRILL_CUTOFF) {
      checkGrilling(join(changesDir, e.name))
    }
  }
}

if (failures.length > 0) {
  console.error(`openspec validation FAILED (${failures.length} problem(s)):`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}

console.log(`openspec validation OK: ${specs} spec file(s), ${requirements} requirement(s), ${grilled} grilled change(s) (cutoff ${GRILL_CUTOFF}, min ${GRILL_MIN} questions)`)

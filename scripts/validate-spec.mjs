import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = 'openspec'
let specs = 0
let requirements = 0
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

if (specs === 0) failures.push(`${ROOT}: no spec.md files found`)

if (failures.length > 0) {
  console.error(`openspec validation FAILED (${failures.length} problem(s)):`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}

console.log(`openspec validation OK: ${specs} spec file(s), ${requirements} requirement(s)`)

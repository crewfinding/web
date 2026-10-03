// This app started as a copy of another product's web app. Its name must not
// survive anywhere in the source — this fails the build if it does.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const FORBIDDEN = [/leadeasygen/i, /lead\s*easy\s*gen/i, /\bluna\b/i]
// docs/ may name where this code came from (provenance); shipped source may not.
const SKIP = new Set(['node_modules', 'dist', '.git', 'docs', 'playwright-report', 'test-results', 'package-lock.json', 'check-brand.mjs'])
const hits = []
let scanned = 0
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path)
    else if (/\.(ts|tsx|js|mjs|json|html|css|md|yml|yaml|svg)$/.test(name)) {
      scanned++
      readFileSync(path, 'utf8').split('\n').forEach((line, i) => {
        if (FORBIDDEN.some((re) => re.test(line))) hits.push(`${path}:${i + 1}: ${line.trim().slice(0, 120)}`)
      })
    }
  }
}
walk('.')
if (hits.length) {
  console.error(`check:brand — ${hits.length} line(s) name another product:\n${hits.join('\n')}`)
  process.exit(1)
}
console.log(`check:brand — ${scanned} files scanned, no other product's name`)

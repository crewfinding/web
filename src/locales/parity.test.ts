import { describe, expect, it } from 'vitest'
import en from './lang/en'
import es from './lang/es'
import fr from './lang/fr'

// The dictionaries are typed against English, so a missing key does not
// compile; this pins what types cannot: no placeholder left from the copy
// tool, the same {params} in every language, and the French house style
// (courriel, typographic apostrophes) in the workspace areas.
const leaves = (node: unknown, path = ''): [string, string][] =>
  typeof node === 'string'
    ? [[path, node]]
    : Array.isArray(node)
      ? []
      : Object.entries(node as Record<string, unknown>).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k))

const params = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
const WORKSPACE_AREAS = ['team', 'org', 'errors'] as const

describe('locale parity', () => {
  const enLeaves = new Map(leaves(en))
  for (const [name, dict] of [['fr', fr], ['es', es]] as const) {
    it(`${name}: same keys and placeholders as English`, () => {
      const other = new Map(leaves(dict))
      expect([...other.keys()].sort()).toEqual([...enLeaves.keys()].sort())
      for (const [key, text] of enLeaves) expect(params(other.get(key)!), key).toEqual(params(text))
    })
  }
  it('nothing left untranslated by the copy tool', () => {
    for (const dict of [en, fr, es])
      for (const [key, text] of leaves(dict)) expect(text, key).not.toMatch(/^MISSING|\{\{/)
  })
  it('French workspace areas: courriel and ’', () => {
    for (const area of WORKSPACE_AREAS)
      for (const [key, text] of leaves(fr[area])) {
        expect(text, key).not.toMatch(/'/)
        expect(text.replace(/\{\w+\}/g, ''), key).not.toMatch(/\be-?mail\b/i)
      }
  })
})

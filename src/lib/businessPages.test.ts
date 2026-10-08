import { FonderieApiError } from '@fonderie/client'
import { describe, expect, it } from 'vitest'
import { isArchivedRefusal, listControls, locationActions, locationOpens, pageAccess } from './businessPages'

// The Business pages' interaction rules (docs/ux/BUSINESS-SCREEN.md §2, §5).

describe('who edits, and the banner', () => {
  it('owner / manager edit; a member reads, under the read-only banner', () => {
    expect(pageAccess({ isManager: true, permsLoading: false, isArchived: false })).toEqual({ canEdit: true, banner: null })
    expect(pageAccess({ isManager: false, permsLoading: false, isArchived: false })).toEqual({ canEdit: false, banner: 'readonly' })
  })
  it('while the permissions load: read-only, no banner, no Save', () => {
    expect(pageAccess({ isManager: true, permsLoading: true, isArchived: false })).toEqual({ canEdit: false, banner: null })
  })
  it('archived: read-only for everyone, the archived banner', () => {
    expect(pageAccess({ isManager: true, permsLoading: false, isArchived: true })).toEqual({ canEdit: false, banner: 'archived' })
    expect(pageAccess({ isManager: false, permsLoading: true, isArchived: true })).toEqual({ canEdit: false, banner: 'archived' })
  })
  it('a 409 WORKSPACE_ARCHIVED is recognised (the page re-reads the workspace)', () => {
    expect(isArchivedRefusal(new FonderieApiError('WORKSPACE_ARCHIVED', 'archived', 409))).toBe(true)
    expect(isArchivedRefusal(new FonderieApiError('DUPLICATE', 'dup', 409))).toBe(false)
    expect(isArchivedRefusal(new Error('x'))).toBe(false)
  })
})

describe('lists: "+" opens the add form on demand', () => {
  it('closed: "+" shown, no form', () => {
    expect(listControls(true, false)).toEqual({ plus: true, form: false, itemMenu: true })
  })
  it('after "+": the form, and no second "+"', () => {
    expect(listControls(true, true)).toEqual({ plus: false, form: true, itemMenu: true })
  })
  it('read-only: no "+", no form, no ⋯ — even if a form was open', () => {
    expect(listControls(false, false)).toEqual({ plus: false, form: false, itemMenu: false })
    expect(listControls(false, true)).toEqual({ plus: false, form: false, itemMenu: false })
  })
})

describe('a location’s ⋯ and click', () => {
  const live = { isArchived: false, isHeadOffice: false }
  const head = { isArchived: false, isHeadOffice: true }
  const archived = { isArchived: true, isHeadOffice: false }
  it('editors: Edit · Open in Maps · Make head office (not on the head office) · Archive', () => {
    expect(locationActions(live, true)).toEqual(['edit', 'maps', 'makeHeadOffice', 'archive'])
    expect(locationActions(head, true)).toEqual(['edit', 'maps', 'archive'])
  })
  it('archived: Restore only (nothing when read-only)', () => {
    expect(locationActions(archived, true)).toEqual(['restore'])
    expect(locationActions(archived, false)).toEqual([])
  })
  it('read-only: Open in Maps only; items do not open the form', () => {
    expect(locationActions(live, false)).toEqual(['maps'])
    expect(locationOpens(live, false)).toBe(false)
    expect(locationOpens(live, true)).toBe(true)
    expect(locationOpens(archived, true)).toBe(false)
  })
})

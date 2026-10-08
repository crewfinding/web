import { describe, expect, it } from 'vitest'
import en from '../locales/lang/en'
import es from '../locales/lang/es'
import fr from '../locales/lang/fr'
import { translate, type Messages, type TranslationKey } from '../locales'
import type { MessageParams } from '../locales/types'
import {
  ACTIVITY_SENTENCES,
  UNKNOWN_SENTENCE,
  activityHref,
  activityTarget,
  dayLabel,
  describeActivity,
  groupByDay,
  relativeTime,
} from './activity'

// The activity log's sentences and days (the mobile app's utils/activity.ts
// and its activity-log test, where pure).

const tOf = (m: Messages) => (key: TranslationKey, params?: MessageParams) => translate(m, key, params)
const t = tOf(en)
const names: Record<string, string> = { u1: 'Ana Silva', u2: 'Luc Roy' }
const nameOf = (id: string) => names[id] ?? 'A former member'
const ev = (type: string, payload: Record<string, unknown> = {}) => ({ type, payload })

describe('what: one sentence per event type', () => {
  it('knows the app’s 80 event types, each with a sentence in en, fr and es', () => {
    const types = Object.keys(ACTIVITY_SENTENCES)
    expect(types).toHaveLength(80)
    for (const dict of [en, fr, es])
      for (const [type, key] of Object.entries(ACTIVITY_SENTENCES)) expect(translate(dict, key), type).not.toBe(key)
  })
  it('documents read with their number and new status, in the reader’s language', () => {
    expect(describeActivity(t, ev('crewfinding.estimate.created', { number: 'Q-0012', estimateId: 'e1' }), nameOf).text).toBe('Created quote Q-0012')
    expect(describeActivity(t, ev('crewfinding.invoice.status_changed', { number: 'INV-0003', to: 'paid' }), nameOf).text).toBe(
      'Marked invoice INV-0003 as Paid',
    )
    expect(describeActivity(tOf(fr), ev('crewfinding.job.status_changed', { to: 'in_progress' }), nameOf).text).toBe('A passé un travail à « En cours »')
    expect(describeActivity(tOf(es), ev('crewfinding.estimate.sent', { number: 'Q-1' }), nameOf).text).toBe('Envió el presupuesto Q-1 al cliente')
  })
  it('a status it has no word for reads as sent; a missing number leaves no double space', () => {
    expect(describeActivity(t, ev('crewfinding.job.status_changed', { to: 'on_hold' }), nameOf).text).toBe('Moved a job to on_hold')
    expect(describeActivity(t, ev('crewfinding.estimate.created'), nameOf).text).toBe('Created quote')
  })
  it('people are named from the team; someone gone reads as a former member', () => {
    expect(describeActivity(t, ev('fonderie.workspace.manager.set', { targetUserId: 'u1' }), nameOf).text).toBe('Made Ana Silva a manager')
    expect(describeActivity(t, ev('crewfinding.job.assigned', { targetUserIds: ['u1', 'u2'], jobId: 'j1' }), nameOf).text).toBe(
      'Put Ana Silva, Luc Roy on a job',
    )
    expect(describeActivity(t, ev('fonderie.workspace.member.removed', {}), nameOf).text).toBe('Removed A former member from the team')
  })
  it('an unknown type reads "Something changed" and is flagged so the row shows the raw type', () => {
    const line = describeActivity(t, ev('fonderie.something.new'), nameOf)
    expect(line).toEqual({ text: 'Something changed', unknown: true, target: null })
    expect(translate(fr, UNKNOWN_SENTENCE)).toBe('Une modification a eu lieu')
    expect(translate(es, UNKNOWN_SENTENCE)).toBe('Algo cambió')
  })
})

describe('where a row leads', () => {
  it('the job, quote, invoice, bill of lading or customer it was about — none once deleted', () => {
    expect(activityTarget(ev('crewfinding.invoice.sent', { invoiceId: 'i1' }))).toEqual({ kind: 'invoice', params: { invoiceId: 'i1' } })
    expect(activityTarget(ev('crewfinding.estimate.accepted', { estimateId: 'e1' }))).toEqual({ kind: 'estimate', params: { estimateId: 'e1' } })
    expect(activityTarget(ev('crewfinding.bol.signed', { bolId: 'b1' }))).toBeNull()
    expect(activityTarget(ev('crewfinding.bol.signed', { bolId: 'b1', jobId: 'j1' }))).toEqual({ kind: 'bol', params: { jobId: 'j1', bolId: 'b1' } })
    expect(activityTarget(ev('crewfinding.job.deleted', { jobId: 'j1' }))).toBeNull()
    expect(activityTarget(ev('fonderie.customer.updated', { customerId: 'c1' }))).toEqual({ kind: 'customer', params: { customerId: 'c1' } })
    expect(activityTarget(ev('fonderie.workspace.updated'))).toBeNull()
  })
  it('a link only where the web has the page: a customer opens its page; a job, quote, invoice or bill does not link yet', () => {
    const target = activityTarget(ev('fonderie.customer.updated', { customerId: 'c 1' }))
    expect(activityHref(target)).toBe('/customers/c%201')
    expect(activityHref(activityTarget(ev('crewfinding.job.updated', { jobId: 'j1' })))).toBeNull()
    expect(activityHref(activityTarget(ev('crewfinding.invoice.sent', { invoiceId: 'i1' })))).toBeNull()
    expect(activityHref(target, {})).toBeNull()
    expect(activityHref(null, { customer: () => '/x' })).toBeNull()
  })
})

describe('when: day groups and relative time', () => {
  const now = new Date(2026, 9, 8, 15, 0)
  const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).toISOString()
  const formatDate = (v: string | Date) => `D:${new Date(v).getDate()}`
  const formatTime = (v: string | Date) => `T:${new Date(v).getHours()}`

  it('one section per calendar day, in the feed’s order', () => {
    const events = [
      { id: 'a', createdAt: at(8, 14) },
      { id: 'b', createdAt: at(8, 9) },
      { id: 'c', createdAt: at(7, 23) },
      { id: 'd', createdAt: at(1, 10) },
    ]
    const sections = groupByDay(events)
    expect(sections.map((s) => s.data.map((e) => e.id))).toEqual([['a', 'b'], ['c'], ['d']])
    expect(sections.map((s) => dayLabel(t, s.day, now, formatDate))).toEqual(['Today', 'Yesterday', 'D:1'])
    expect(dayLabel(tOf(fr), at(8, 1), now, formatDate)).toBe('Aujourd’hui')
    expect(dayLabel(tOf(es), at(7, 1), now, formatDate)).toBe('Ayer')
  })
  it('today: just now, minutes, hours; before today: the time of day', () => {
    expect(relativeTime(t, new Date(now.getTime() - 20_000), now, formatTime)).toBe('Just now')
    expect(relativeTime(t, new Date(now.getTime() - 5 * 60_000), now, formatTime)).toBe('5 min ago')
    expect(relativeTime(t, new Date(now.getTime() - 3 * 3_600_000), now, formatTime)).toBe('3 h ago')
    expect(relativeTime(tOf(fr), new Date(now.getTime() - 5 * 60_000), now, formatTime)).toBe('Il y a 5 min')
    expect(relativeTime(tOf(es), new Date(now.getTime() - 2 * 3_600_000), now, formatTime)).toBe('Hace 2 h')
    expect(relativeTime(t, at(7, 22), now, formatTime)).toBe('T:22')
    // A clock slightly ahead never reads as the future.
    expect(relativeTime(t, new Date(now.getTime() + 60_000), now, formatTime)).toBe('T:15')
  })
})

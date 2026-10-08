import type { IWorkspaceLocationDTO } from '@fonderie/client'
import { Archive, ArrowCounterClockwise, Buildings, MapTrifold, PencilSimple, Plus } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ActionMenu, type IActionMenuItem } from '../../../components/ActionMenu'
import { AddressAutocomplete } from '../../../components/AddressAutocomplete'
import { Button } from '../../../components/Button'
import { IconButton } from '../../../components/IconButton'
import { Input } from '../../../components/Input'
import { Notice } from '../../../components/Notice'
import { PhoneInput } from '../../../components/PhoneInput'
import { Switch } from '../../../components/Switch'
import { BUSINESS_PATHS, businessOption, locationPath } from '../../../constants/businessMenu'
import { useTranslation } from '../../../hooks/useTranslation'
import {
  MAX,
  addressOneLine,
  countryCode,
  draftOf,
  legacyAddress,
  locationProblems,
  mapsUrl,
  missingAddressParts,
  sortLocations,
  taxRegionOf,
  toLocationInput,
  toLocationUpdate,
  type ILocationDraft,
} from '../../../lib/business'
import { locationActions, locationOpens, type LocationAction } from '../../../lib/businessPages'
import type { IAddressParts } from '../../../lib/places'
import type { TranslationKey } from '../../../locales'
import { CardError, FormFooter, Prompt, SectionCard } from './parts'
import { BusinessPage, type IBusinessContext } from './Shell'
import { useAction } from './useAction'

// Locations (the mobile app's LocationList and BusinessLocationScreen): the
// list, with "+" opening the location form on its own page; a live item opens
// its form too. The address comes ONLY from a picked place; unit / suite and
// buzzer are the only typed parts.

type T = (key: TranslationKey, params?: Record<string, string | number>) => string

/** "Unit 4" / "Buzzer 12" in the one-line address. */
const addressWords = (t: T) => ({
  unit: (u: string) => t('business.locations.unitInline', { unit: u }),
  buzzer: (c: string) => t('business.locations.buzzerInline', { code: c }),
})

const openMaps = (l: IWorkspaceLocationDTO) => {
  const url = mapsUrl(addressOneLine(l.address))
  if (url) window.open(url, '_blank', 'noopener,noreferrer')
}

// ── The list ─────────────────────────────────────────────────────────────────

function LocationList({ workspace, canEdit, locationsHook, write }: IBusinessContext) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { locations, createLocation, updateLocation, archiveLocation, restoreLocation } = locationsHook
  const action = useAction(write)
  const words = addressWords(t)
  const legacy = legacyAddress(workspace, locations ?? [])
  const sorted = sortLocations(locations ?? [])

  // The address the workspace row holds without a head office: added as the
  // head office in one click (its parts as stored — the server normalizes them).
  const addLegacy = () => {
    if (!legacy) return
    void action.run(() =>
      createLocation({
        name: t('business.locations.headOffice'),
        address: {
          line1: legacy.line1 ?? '',
          line2: legacy.line2 ?? '',
          city: legacy.city ?? '',
          state: (legacy.state ?? '').toUpperCase(),
          zip: legacy.zip ?? '',
          country: countryCode(legacy.country),
          accessCode: legacy.accessCode || null,
        },
        taxRegion: taxRegionOf(legacy.country ?? '', legacy.state ?? '') || null,
        isHeadOffice: true,
      }),
    )
  }

  const menuItem = (l: IWorkspaceLocationDTO, a: LocationAction): IActionMenuItem => {
    switch (a) {
      case 'edit':
        return { label: t('business.locations.edit'), icon: PencilSimple, onSelect: () => navigate(locationPath(l.id)) }
      case 'maps':
        return { label: t('business.locations.maps'), icon: MapTrifold, onSelect: () => openMaps(l) }
      case 'makeHeadOffice':
        return { label: t('business.locations.makeHeadOffice'), icon: Buildings, onSelect: () => void action.run(() => updateLocation(l.id, { isHeadOffice: true })) }
      case 'archive':
        return { label: t('business.locations.archive'), icon: Archive, danger: true, onSelect: () => void action.run(() => archiveLocation(l.id)) }
      case 'restore':
        return { label: t('business.locations.restore'), icon: ArrowCounterClockwise, onSelect: () => void action.run(() => restoreLocation(l.id)) }
    }
  }

  return (
    <SectionCard
      title={t('business.locations.title')}
      testId="list-locations"
      action={
        canEdit ? (
          <IconButton icon={Plus} size="sm" variant="ghost" aria-label={t('business.locations.add')} data-testid="add-location" onClick={() => navigate(locationPath())} />
        ) : undefined
      }
    >
      <CardError message={action.error} />
      {legacy ? (
        canEdit ? (
          <Prompt
            testId="legacy-address"
            text={t('business.legacy.address', { value: addressOneLine(legacy, words) })}
            action={t('business.legacy.add')}
            onClick={addLegacy}
          />
        ) : (
          <p className="text-sm text-ink" data-testid="legacy-address">
            {addressOneLine(legacy, words)}
          </p>
        )
      ) : null}
      {sorted.length === 0 && !legacy ? <p className="text-sm text-ink-subtle">{t('business.locations.empty')}</p> : null}
      {sorted.length ? (
        <ul className="divide-y divide-hairline">
          {sorted.map((l) => {
            const body = (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-ink">{l.name}</p>
                  {l.isHeadOffice ? (
                    <span className="rounded-sm bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-link">{t('business.locations.headOffice')}</span>
                  ) : null}
                  {l.isArchived ? (
                    <span className="rounded-sm border border-hairline px-1.5 py-0.5 text-xs text-ink-subtle">{t('business.locations.archived')}</span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-ink">{addressOneLine(l.address, words)}</p>
                {l.phone ? <p className="text-xs text-ink-subtle">{l.phone}</p> : null}
                {l.email ? <p className="text-xs text-ink-subtle">{l.email}</p> : null}
              </>
            )
            return (
              <li key={l.id} className={`flex items-start gap-2 py-3 ${l.isArchived ? 'opacity-60' : ''}`} data-testid={`location-${l.id}`}>
                {locationOpens(l, canEdit) ? (
                  <Link to={locationPath(l.id)} className="block min-w-0 flex-1 rounded-md hover:bg-surface-2/50" data-testid={`location-edit-${l.id}`}>
                    {body}
                  </Link>
                ) : (
                  <div className="min-w-0 flex-1">{body}</div>
                )}
                <ActionMenu
                  label={t('business.more')}
                  title={l.name}
                  disabled={action.busy}
                  items={locationActions(l, canEdit).map((a) => menuItem(l, a))}
                />
              </li>
            )
          })}
        </ul>
      ) : null}
    </SectionCard>
  )
}

export function BusinessLocationsPage() {
  const { t } = useTranslation()
  const o = businessOption('locations')
  return (
    <BusinessPage title={t(o.label)} paragraph={t(o.paragraph)} testId="business-locations">
      {(ctx) => <LocationList {...ctx} />}
    </BusinessPage>
  )
}

// ── The location form (its own page) ─────────────────────────────────────────

function LocationForm({ location, canEdit, country, locationsHook, write, back }: IBusinessContext & { location?: IWorkspaceLocationDTO }) {
  const { t } = useTranslation()
  const { createLocation, updateLocation } = locationsHook
  const action = useAction(write)
  const start = useMemo(() => draftOf(location), [location])
  const [d, setD] = useState<ILocationDraft>(start)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const hasPlace = !!(d.line1.trim() || d.city.trim())
  const [searching, setSearching] = useState(!hasPlace)
  const [query, setQuery] = useState('')
  const [imprecise, setImprecise] = useState(false)
  const set = (patch: Partial<ILocationDraft>) => setD((prev) => ({ ...prev, ...patch }))
  const opt = (key: TranslationKey) => `${t(key)} ${t('business.optional')}`
  // An archived location is changed only once restored (409 LOCATION_ARCHIVED).
  const editable = canEdit && !location?.isArchived

  // Everything but the unit and the buzzer comes from the picked place; a
  // place without a street, city, province / state, postal code or country
  // is refused with a message, never patched by hand.
  const pick = (p: IAddressParts) => {
    if (missingAddressParts(p).length) {
      setImprecise(true)
      return
    }
    setImprecise(false)
    set({
      line1: p.line1,
      city: p.city,
      state: p.state,
      zip: p.zip,
      country: p.country,
      latitude: p.lat,
      longitude: p.lng,
      taxRegion: taxRegionOf(p.country, p.state),
    })
    setErrors((e) => ({ ...e, address: '' }))
    setSearching(false)
    setQuery('')
  }

  const save = async () => {
    const problems = locationProblems(d, country)
    const e = Object.fromEntries(Object.entries(problems).map(([k, key]) => [k, t(key as TranslationKey)]))
    if (!e.name && d.name.trim().length > MAX.locationName) e.name = t('business.tooLong', { max: MAX.locationName })
    setErrors(e)
    if (Object.values(e).some(Boolean)) return
    const ok = await action.run(() => (location ? updateLocation(location.id, toLocationUpdate(d, start)) : createLocation(toLocationInput(d))))
    if (ok) back()
  }

  const summary = addressOneLine({ line1: d.line1, city: d.city, state: d.state, zip: d.zip, country: d.country })

  return (
    <div className="space-y-4" data-testid="location-editor">
      <CardError message={action.error} />
      {location?.isArchived ? <Notice>{t('business.reason.LOCATION_ARCHIVED')}</Notice> : null}
      <fieldset disabled={!editable} className="min-w-0 space-y-4">
        <Input label={t('business.locations.name')} value={d.name} error={errors.name} onChange={(e) => set({ name: e.target.value })} />
        {editable && searching ? (
          <div>
            <AddressAutocomplete
              value={query}
              onChangeText={(v) => {
                setQuery(v)
                setImprecise(false)
              }}
              onSelect={pick}
              label={t('business.locations.address')}
              error={imprecise ? t('business.locations.imprecise') : errors.address || undefined}
            />
            {hasPlace ? (
              <Button
                variant="link"
                className="mt-2"
                onClick={() => {
                  setSearching(false)
                  setImprecise(false)
                  setQuery('')
                }}
              >
                {t('business.locations.keep')}
              </Button>
            ) : null}
          </div>
        ) : (
          <div data-testid="address-summary">
            <p className="text-xs font-medium text-ink-subtle">{t('business.locations.address')}</p>
            <p className="text-sm text-ink">{summary || t('business.notSet')}</p>
            {editable ? (
              <Button variant="link" className="mt-1" onClick={() => setSearching(true)}>
                {t('business.locations.change')}
              </Button>
            ) : null}
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <Input label={opt('business.locations.unitSuite')} value={d.line2} onChange={(e) => set({ line2: e.target.value })} />
          <Input label={opt('business.locations.buzzer')} value={d.accessCode} onChange={(e) => set({ accessCode: e.target.value })} />
          <PhoneInput
            label={opt('business.locations.phone')}
            value={d.phone}
            defaultCountry={countryCode(d.country) || country}
            error={errors.phone}
            onChange={(v) => set({ phone: v })}
          />
          <Input type="email" label={opt('business.locations.email')} value={d.email} error={errors.email} onChange={(e) => set({ email: e.target.value })} />
        </div>
        {location?.isHeadOffice || !editable ? null : (
          <label className="flex items-center gap-3 text-sm text-ink">
            <Switch aria-label={t('business.locations.makeHeadOffice')} checked={d.isHeadOffice} onChange={(v) => set({ isHeadOffice: v })} />
            <span aria-hidden="true">{t('business.locations.makeHeadOffice')}</span>
          </label>
        )}
      </fieldset>
      {editable ? <FormFooter saving={action.busy} onSave={() => void save()} onDiscard={back} /> : null}
    </div>
  )
}

/** Add a location (/locations/new) or edit one (/locations/:locationId). */
export function BusinessLocationPage() {
  const { t } = useTranslation()
  const { locationId } = useParams<{ locationId?: string }>()
  const editing = !!locationId && locationId !== 'new'
  return (
    <BusinessPage
      title={t(editing ? 'business.locations.editTitle' : 'business.locations.add')}
      testId="business-location"
      backTo={BUSINESS_PATHS.locations}
      backLabel={t(businessOption('locations').label)}
    >
      {(ctx) => {
        const location = editing ? ctx.locations.find((l) => l.id === locationId) : undefined
        if (editing && !location) {
          // The list may still be loading; once read, an unknown id is said so.
          return ctx.locationsHook.isLoading ? (
            <p role="status" className="py-6 text-center text-sm text-ink-subtle">
              {t('business.loading')}
            </p>
          ) : (
            <p className="text-sm text-ink" data-testid="location-not-found">
              {t('business.locations.notFound')}
            </p>
          )
        }
        return <LocationForm key={location?.id ?? 'new'} {...ctx} location={location} />
      }}
    </BusinessPage>
  )
}

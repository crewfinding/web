import type { IWorkspaceDTO, IWorkspaceLocationDTO } from '@fonderie/client'
import type { IUseWorkspaceLocationsReturn } from '@fonderie/react-workspaces'
import { Archive, ArrowCounterClockwise, Buildings, Plus } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { ActionMenu } from '../../../components/ActionMenu'
import { AddressAutocomplete } from '../../../components/AddressAutocomplete'
import { Button } from '../../../components/Button'
import { IconButton } from '../../../components/IconButton'
import { Input } from '../../../components/Input'
import { PhoneInput } from '../../../components/PhoneInput'
import { Switch } from '../../../components/Switch'
import { useTranslation } from '../../../hooks/useTranslation'
import {
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
import type { IAddressParts } from '../../../lib/places'
import type { TranslationKey } from '../../../locales'
import { useAction } from './useAction'
import { CardError, Prompt, SectionCard } from './parts'

// The Locations card (the mobile app's LocationsCard): the address comes ONLY
// from a picked place; unit / suite and buzzer are the only typed parts.

type T = (key: TranslationKey, params?: Record<string, string | number>) => string

/** "Unit 4" / "Buzzer 12" in the one-line address. */
const addressWords = (t: T) => ({
  unit: (u: string) => t('business.locations.unitInline', { unit: u }),
  buzzer: (c: string) => t('business.locations.buzzerInline', { code: c }),
})

function LocationEditor({
  initial,
  onSave,
  onCancel,
  defaultCountry,
}: {
  initial?: IWorkspaceLocationDTO
  onSave: (draft: ILocationDraft, start: ILocationDraft) => Promise<boolean>
  onCancel: () => void
  defaultCountry: string
}) {
  const { t } = useTranslation()
  const start = useMemo(() => draftOf(initial), [initial])
  const [d, setD] = useState<ILocationDraft>(start)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const hasPlace = !!(d.line1.trim() || d.city.trim())
  const [searching, setSearching] = useState(!hasPlace)
  const [query, setQuery] = useState('')
  const [imprecise, setImprecise] = useState(false)
  const set = (patch: Partial<ILocationDraft>) => setD((prev) => ({ ...prev, ...patch }))
  const opt = (key: TranslationKey) => `${t(key)} ${t('business.optional')}`

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
    const problems = locationProblems(d, defaultCountry)
    const e = Object.fromEntries(Object.entries(problems).map(([k, key]) => [k, t(key as TranslationKey)]))
    setErrors(e)
    if (Object.values(e).some(Boolean)) return
    if (await onSave(d, start)) onCancel()
  }

  const summary = addressOneLine({ line1: d.line1, city: d.city, state: d.state, zip: d.zip, country: d.country })

  return (
    <div className="space-y-4 rounded-lg border border-hairline p-4" data-testid="location-editor">
      <Input label={t('business.locations.name')} value={d.name} error={errors.name} onChange={(e) => set({ name: e.target.value })} />
      {searching ? (
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
          <p className="text-sm text-ink">{summary}</p>
          <Button variant="link" className="mt-1" onClick={() => setSearching(true)}>
            {t('business.locations.change')}
          </Button>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Input label={opt('business.locations.unitSuite')} value={d.line2} onChange={(e) => set({ line2: e.target.value })} />
        <Input label={opt('business.locations.buzzer')} value={d.accessCode} onChange={(e) => set({ accessCode: e.target.value })} />
        <PhoneInput
          label={opt('business.locations.phone')}
          value={d.phone}
          defaultCountry={countryCode(d.country) || defaultCountry}
          error={errors.phone}
          onChange={(v) => set({ phone: v })}
        />
        <Input type="email" label={opt('business.locations.email')} value={d.email} error={errors.email} onChange={(e) => set({ email: e.target.value })} />
      </div>
      {initial?.isHeadOffice ? null : (
        <label className="flex items-center gap-3 text-sm text-ink">
          <Switch aria-label={t('business.locations.makeHeadOffice')} checked={d.isHeadOffice} onChange={(v) => set({ isHeadOffice: v })} />
          <span aria-hidden="true">{t('business.locations.makeHeadOffice')}</span>
        </label>
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={() => void save()}>
          {t('business.save')}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          {t('business.cancel')}
        </Button>
      </div>
    </div>
  )
}

export function LocationsCard({
  workspace,
  canEdit,
  country,
  hook,
}: {
  workspace: IWorkspaceDTO
  canEdit: boolean
  country: string
  hook: IUseWorkspaceLocationsReturn
}) {
  const { t } = useTranslation()
  const { locations, createLocation, updateLocation, archiveLocation, restoreLocation } = hook
  const action = useAction()
  const [editing, setEditing] = useState<string | 'new' | null>(null)
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

  return (
    <SectionCard
      title={t('business.locations.title')}
      testId="card-locations"
      action={
        canEdit && editing !== 'new' ? (
          <IconButton icon={Plus} size="sm" variant="ghost" aria-label={t('business.locations.add')} onClick={() => setEditing('new')} />
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
      {sorted.map((l) =>
        editing === l.id ? (
          <LocationEditor
            key={l.id}
            initial={l}
            defaultCountry={country}
            onCancel={() => setEditing(null)}
            onSave={(d, start) => action.run(() => updateLocation(l.id, toLocationUpdate(d, start)))}
          />
        ) : (
          <div
            key={l.id}
            className={`rounded-lg border border-hairline p-4 ${l.isArchived ? 'opacity-60' : ''}`}
            data-testid={`location-${l.id}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-ink">{l.name}</p>
              {l.isHeadOffice ? (
                <span className="rounded-sm bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-link">{t('business.locations.headOffice')}</span>
              ) : null}
              {l.isArchived ? (
                <span className="rounded-sm border border-hairline px-1.5 py-0.5 text-xs text-ink-subtle">{t('business.locations.archived')}</span>
              ) : null}
              <span className="flex-1" />
              {canEdit && !l.isArchived ? (
                <Button size="sm" variant="ghost" onClick={() => setEditing(l.id)}>
                  {t('business.locations.edit')}
                </Button>
              ) : null}
              {canEdit ? (
                <ActionMenu
                  label={t('business.more')}
                  title={l.name}
                  disabled={action.busy}
                  items={
                    l.isArchived
                      ? [{ label: t('business.locations.restore'), icon: ArrowCounterClockwise, onSelect: () => void action.run(() => restoreLocation(l.id)) }]
                      : [
                          ...(l.isHeadOffice
                            ? []
                            : [
                                {
                                  label: t('business.locations.makeHeadOffice'),
                                  icon: Buildings,
                                  onSelect: () => void action.run(() => updateLocation(l.id, { isHeadOffice: true })),
                                },
                              ]),
                          { label: t('business.locations.archive'), icon: Archive, danger: true, onSelect: () => void action.run(() => archiveLocation(l.id)) },
                        ]
                  }
                />
              ) : null}
            </div>
            <p className="mt-1 text-sm text-ink">{addressOneLine(l.address, words)}</p>
            {l.phone ? <p className="text-xs text-ink-subtle">{l.phone}</p> : null}
            {l.email ? <p className="text-xs text-ink-subtle">{l.email}</p> : null}
            {l.isHeadOffice && mapsUrl(addressOneLine(l.address)) ? (
              <a
                href={mapsUrl(addressOneLine(l.address)) ?? undefined}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-1 inline-block text-sm text-link hover:underline"
              >
                {t('business.locations.maps')}
              </a>
            ) : null}
          </div>
        ),
      )}
      {canEdit && editing === 'new' ? (
        <LocationEditor
          defaultCountry={country}
          onCancel={() => setEditing(null)}
          onSave={(d) => action.run(() => createLocation(toLocationInput(d)))}
        />
      ) : null}
    </SectionCard>
  )
}

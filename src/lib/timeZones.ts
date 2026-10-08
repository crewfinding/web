// A customer's time zone (IANA, e.g. 'America/Vancouver'): what the times on
// the quotes and invoices sent to them are printed in. null on the customer
// means 'none set': the business's zone applies (the API chooses, in order,
// customer → workspace settings.timezone → head-office region → UTC).

/**
 * The main zone of each Canadian province / territory and U.S. state (the most
 * populous zone where a region has two). The same table as the API's
 * domain/documents/timezone.ts, so the app suggests what the API would choose.
 */
const REGION_ZONE: Record<string, Record<string, string>> = {
    CA: {
        NL: 'America/St_Johns', NS: 'America/Halifax', PE: 'America/Halifax', NB: 'America/Moncton',
        QC: 'America/Toronto', ON: 'America/Toronto', MB: 'America/Winnipeg', SK: 'America/Regina',
        AB: 'America/Edmonton', BC: 'America/Vancouver', YT: 'America/Whitehorse', NT: 'America/Yellowknife', NU: 'America/Iqaluit',
    },
    US: {
        CT: 'America/New_York', DE: 'America/New_York', DC: 'America/New_York', FL: 'America/New_York', GA: 'America/New_York',
        IN: 'America/Indiana/Indianapolis', KY: 'America/New_York', ME: 'America/New_York', MD: 'America/New_York', MA: 'America/New_York',
        MI: 'America/Detroit', NH: 'America/New_York', NJ: 'America/New_York', NY: 'America/New_York', NC: 'America/New_York',
        OH: 'America/New_York', PA: 'America/New_York', RI: 'America/New_York', SC: 'America/New_York', VT: 'America/New_York',
        VA: 'America/New_York', WV: 'America/New_York',
        AL: 'America/Chicago', AR: 'America/Chicago', IL: 'America/Chicago', IA: 'America/Chicago', KS: 'America/Chicago',
        LA: 'America/Chicago', MN: 'America/Chicago', MS: 'America/Chicago', MO: 'America/Chicago', NE: 'America/Chicago',
        ND: 'America/Chicago', OK: 'America/Chicago', SD: 'America/Chicago', TN: 'America/Chicago', TX: 'America/Chicago', WI: 'America/Chicago',
        AZ: 'America/Phoenix', CO: 'America/Denver', ID: 'America/Boise', MT: 'America/Denver', NM: 'America/Denver', UT: 'America/Denver', WY: 'America/Denver',
        CA: 'America/Los_Angeles', NV: 'America/Los_Angeles', OR: 'America/Los_Angeles', WA: 'America/Los_Angeles',
        AK: 'America/Anchorage', HI: 'Pacific/Honolulu', PR: 'America/Puerto_Rico',
    },
}

/** The North American zones, for an engine without Intl.supportedValuesOf (older Hermes). */
export const FALLBACK_TIME_ZONES: readonly string[] = [
    'America/St_Johns', 'America/Halifax', 'America/Moncton', 'America/Toronto', 'America/Iqaluit',
    'America/Winnipeg', 'America/Regina', 'America/Edmonton', 'America/Yellowknife', 'America/Whitehorse', 'America/Vancouver',
    'America/New_York', 'America/Detroit', 'America/Indiana/Indianapolis', 'America/Chicago', 'America/Denver',
    'America/Boise', 'America/Phoenix', 'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu', 'America/Puerto_Rico',
    'America/Mexico_City', 'America/Tijuana', 'America/Cancun', 'UTC',
]

/** A zone this engine knows. */
export function isTimeZone(zone: string | null | undefined): boolean {
    if (!zone || typeof zone !== 'string') return false
    try {
        // Nothing is formatted: only whether the engine accepts the zone (no locale involved).
        new Intl.DateTimeFormat([], { timeZone: zone })
        return true
    } catch {
        return false
    }
}

/** Every zone the engine lists (Intl.supportedValuesOf), else the North American list. */
export function allTimeZones(): readonly string[] {
    try {
        const list = (Intl as unknown as { supportedValuesOf?: (k: 'timeZone') => string[] }).supportedValuesOf?.('timeZone')
        if (list && list.length) return list
    } catch {
        /* an engine without it */
    }
    return FALLBACK_TIME_ZONES
}

/** The zone of a region: 'CA' + 'BC' or 'CA' + 'CA-BC' → 'America/Vancouver'; null when not one we know. */
export function regionTimeZone(country: string | null | undefined, region: string | null | undefined): string | null {
    const c = String(country ?? '').trim().toUpperCase()
    const r = String(region ?? '').trim().toUpperCase().replace(/^[A-Z]{2}-/, '')
    return REGION_ZONE[c]?.[r] ?? null
}

export type TimeZoneSource = 'address' | 'workspace'

interface ISuggestInput {
    /** The customer's addresses (primary first wins). */
    addresses?: readonly { isPrimary?: boolean; address: { countryIso?: string | null; subdivision1Iso?: string | null } }[] | null
    /** The workspace's settings.timezone ('UTC' is what an unset setting reads as). */
    workspaceZone?: string | null
    /** The business's head-office address (workspace.address: country, state). */
    workspaceAddress?: { country?: string | null; state?: string | null } | null
}

/**
 * The zone to suggest for a customer: their (primary) address's province /
 * state, then the business's own zone (its setting, else its head office's
 * region). null when nothing points anywhere.
 */
export function suggestTimeZone({ addresses, workspaceZone, workspaceAddress }: ISuggestInput): { zone: string; source: TimeZoneSource } | null {
    const sorted = [...(addresses ?? [])].sort((a, b) => Number(!!b.isPrimary) - Number(!!a.isPrimary))
    for (const a of sorted) {
        const zone = regionTimeZone(a.address?.countryIso, a.address?.subdivision1Iso)
        if (zone) return { zone, source: 'address' }
    }
    const ws = workspaceZone?.trim()
    if (ws && ws !== 'UTC' && isTimeZone(ws)) return { zone: ws, source: 'workspace' }
    const head = regionTimeZone(workspaceAddress?.country, workspaceAddress?.state)
    return head ? { zone: head, source: 'workspace' } : null
}

/** 'America/Indiana/Indianapolis' → 'Indianapolis'; 'America/St_Johns' → 'St Johns'. */
export function timeZoneCity(zone: string): string {
    return (zone.split('/').pop() ?? zone).replace(/_/g, ' ')
}

/** The zone's short name right now ('PDT', 'GMT-7'), or '' when the engine cannot say. */
export function timeZoneAbbreviation(zone: string, locale?: string, at: Date = new Date()): string {
    try {
        const part = new Intl.DateTimeFormat(locale, { timeZone: zone, timeZoneName: 'short' })
            .formatToParts(at).find((p) => p.type === 'timeZoneName')
        return part?.value ?? ''
    } catch {
        return ''
    }
}

/** 'America/Vancouver' → 'Vancouver (PDT)' — what a person reads; the IANA id when nothing better. */
export function timeZoneLabel(zone: string, locale?: string, at?: Date): string {
    const abbr = timeZoneAbbreviation(zone, locale, at)
    const city = timeZoneCity(zone)
    return abbr ? `${city} (${abbr})` : city
}

/** The zones matching a search, by id or city, case- and accent-insensitive ('vanc', 'st john', 'new york'). */
export function searchTimeZones(query: string, zones: readonly string[] = allTimeZones()): string[] {
    const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[_/]+/g, ' ')
    const q = fold(query.trim())
    if (!q) return [...zones]
    return zones.filter((z) => fold(z).includes(q))
}

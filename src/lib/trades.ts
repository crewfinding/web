// The trades a CrewFinding business can work in — stored as the workspace's
// `industry`. The same list as the mobile app (constants/trades.ts) and the
// API (domain/business/trades.ts).
export const TRADES = ['moving', 'cleaning', 'plumbing', 'electrical', 'landscaping', 'general', 'other'] as const

export type Trade = (typeof TRADES)[number]

export const isTrade = (v: unknown): v is Trade => typeof v === 'string' && (TRADES as readonly string[]).includes(v)

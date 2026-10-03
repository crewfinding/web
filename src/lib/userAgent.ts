// Client-side user-agent parsing for the security screens. The server stores
// the raw UA (parsing is a display concern, and keeps the wire payload honest);
// this turns it into a friendly label and a coarse device kind. Deliberately
// small — enough to read "Chrome on macOS" at a glance, not a UA database.
// Browser/OS names are proper nouns; only the unknown fallbacks localize.

import { tNow } from '../hooks/useTranslation'

export type DeviceKind = 'phone' | 'laptop'

export interface ParsedUserAgent {
  browser: string
  os: string
  device: DeviceKind
  // "Chrome • macOS" — the human line under the device name.
  summary: string
}

function matchBrowser(ua: string): string {
  // Order matters: Edge/Opera embed "Chrome/"; Chrome embeds "Safari/". Match by
  // substring (no \b) so variants like "HeadlessChrome/" and "CriOS/" still read
  // as Chrome rather than falling through to Unknown.
  if (/Edg(A|iOS)?\//.test(ua)) return 'Edge'
  if (/OPR\/|Opera/.test(ua)) return 'Opera'
  if (/Firefox\/|FxiOS\//.test(ua)) return 'Firefox'
  if (/Chrome\/|CriOS\//.test(ua)) return 'Chrome'
  if (/Safari\//.test(ua) && /Version\//.test(ua)) return 'Safari'
  if (/curl\//.test(ua)) return 'curl'
  return tNow('settings.device.unknownBrowser')
}

function matchOs(ua: string): { os: string; device: DeviceKind } {
  if (/\biPhone\b/.test(ua)) return { os: 'iOS', device: 'phone' }
  if (/\biPad\b/.test(ua)) return { os: 'iPadOS', device: 'phone' }
  if (/\bAndroid\b/.test(ua)) return { os: 'Android', device: 'phone' }
  if (/\bMac OS X\b|\bMacintosh\b/.test(ua)) return { os: 'macOS', device: 'laptop' }
  if (/\bWindows\b/.test(ua)) return { os: 'Windows', device: 'laptop' }
  if (/\bLinux\b/.test(ua)) return { os: 'Linux', device: 'laptop' }
  return { os: tNow('settings.device.unknownOs'), device: 'laptop' }
}

export function parseUserAgent(ua: string | null | undefined): ParsedUserAgent {
  if (!ua) {
    const unknown = tNow('settings.device.unknown')
    return { browser: unknown, os: unknown, device: 'laptop', summary: tNow('settings.device.unknownDevice') }
  }
  const browser = matchBrowser(ua)
  const { os, device } = matchOs(ua)
  return { browser, os, device, summary: `${browser} • ${os}` }
}

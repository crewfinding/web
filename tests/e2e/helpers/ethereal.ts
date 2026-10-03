import tls from 'node:tls'

/**
 * Minimal IMAP reader for a test inbox (built for Ethereal, ethereal.email).
 *
 * Credentials come from the environment so nothing secret is committed:
 *   E2E_IMAP_HOST  (default: imap.ethereal.email)
 *   E2E_IMAP_PORT  (default: 993)
 *   E2E_IMAP_USER
 *   E2E_IMAP_PASS
 *
 * `hasInboxCreds()` lets specs skip themselves when the inbox isn't configured.
 */

export interface ImapCreds {
  host: string
  port: number
  user: string
  pass: string
}

export function inboxCreds(): ImapCreds | null {
  const user = process.env.E2E_IMAP_USER
  const pass = process.env.E2E_IMAP_PASS
  if (!user || !pass) return null
  return {
    host: process.env.E2E_IMAP_HOST ?? 'imap.ethereal.email',
    port: Number(process.env.E2E_IMAP_PORT ?? 993),
    user,
    pass,
  }
}

export function hasInboxCreds(): boolean {
  return inboxCreds() !== null
}

/** Fetch the full raw text of the newest message in INBOX (headers + body). */
function fetchNewestRaw(creds: ImapCreds): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const sock = tls.connect(creds.port, creds.host, { servername: creds.host })
    let buf = ''
    let raw: string | null = null
    const steps = [
      `a1 LOGIN ${creds.user} ${creds.pass}`,
      `a2 SELECT INBOX`,
      `a3 FETCH *:* (BODY.PEEK[])`,
      `a4 LOGOUT`,
    ]
    let i = -1
    const next = () => {
      i++
      if (i < steps.length) sock.write(steps[i] + '\r\n')
    }
    sock.on('data', (d) => {
      buf += d.toString()
      const tag = i >= 0 ? steps[i].split(' ')[0] : null
      if (i === -1 && /\* OK/i.test(buf)) {
        buf = ''
        next()
        return
      }
      if (tag && new RegExp(`^${tag} (OK|NO|BAD)`, 'm').test(buf)) {
        if (steps[i].includes('FETCH')) raw = buf
        buf = ''
        next()
      }
    })
    sock.on('end', () => resolve(raw))
    sock.on('error', reject)
    sock.setTimeout(15_000, () => {
      sock.destroy()
      reject(new Error('IMAP timeout'))
    })
  })
}

export interface PinResult {
  code: string
  raw: string
}

export interface WaitForPinOptions {
  retries?: number
  delayMs?: number
  /**
   * Only accept a message whose Subject header contains this string. Lets a
   * test target the reset email over an earlier verification email in the same
   * inbox (both go to the same address).
   */
  subjectIncludes?: string
}

/**
 * Poll the inbox until the newest message is addressed to `recipient` (and, if
 * given, matches `subjectIncludes`) and carries a 6-digit code, then return it.
 * Throws if none arrives.
 */
export async function waitForVerificationPin(
  recipient: string,
  { retries = 10, delayMs = 2000, subjectIncludes }: WaitForPinOptions = {},
): Promise<PinResult> {
  const creds = inboxCreds()
  if (!creds) throw new Error('E2E_IMAP_USER / E2E_IMAP_PASS not set')

  for (let n = 0; n < retries; n++) {
    const raw = await fetchNewestRaw(creds)
    if (raw) {
      const to = (raw.match(/^To:\s*(.+)$/im) ?? [])[1] ?? ''
      const subject = (raw.match(/^Subject:\s*(.+)$/im) ?? [])[1] ?? ''
      const codes = raw.match(/\b\d{6}\b/g) ?? []
      const subjectOk = !subjectIncludes || subject.includes(subjectIncludes)
      if (to.includes(recipient) && subjectOk && codes.length > 0) {
        return { code: codes[codes.length - 1], raw }
      }
    }
    await new Promise((res) => setTimeout(res, delayMs))
  }
  const want = subjectIncludes ? ` (subject ~ "${subjectIncludes}")` : ''
  throw new Error(`No matching email for ${recipient}${want} after ${retries} attempts`)
}

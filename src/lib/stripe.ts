import { loadStripe, type Stripe } from '@stripe/stripe-js'

// Publishable key for the embedded Payment Element (safe to ship to the browser).
// Set VITE_STRIPE_PUBLISHABLE_KEY (.env.local); without one, in-app card entry is
// disabled and the panel says so — the app still runs.
const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined

let promise: Promise<Stripe | null> | null = null

// Singleton Stripe.js loader; null when no publishable key is configured.
export function getStripe(): Promise<Stripe | null> | null {
  if (!pk) return null
  if (!promise) promise = loadStripe(pk)
  return promise
}

export const stripeConfigured = Boolean(pk)

// The billing page's copy — the same strings as the mobile app's billing
// screen (screen.organization-billing.*), so both clients say the same thing.
const billing = {
  btn: {
    "add-card": {
      text: "Add a card",
    },
    cancel: {
      text: "Cancel plan",
    },
    "fix-payment": {
      text: "Update payment",
    },
    manage: {
      text: "Manage billing",
    },
    reactivate: {
      text: "Keep my plan",
    },
    "remove-card": {
      text: "Remove card",
    },
    "start-trial": {
      text: "Start free trial",
    },
    "subscribe-no-trial": {
      text: "Subscribe without trial",
    },
    subscribe: {
      text: "Subscribe",
    },
    "update-card": {
      text: "Update card",
    },
    upgrade: {
      text: "Upgrade",
    },
    "verify-email": {
      text: "Verify email",
    },
  },
  "canceled-notice": {
    text: "Your plan ends on {date}.",
  },
  card: {
    // The card form (Stripe Payment Element, card only).
    cancel: 'Cancel',
    noPaymentMethod: 'Card confirmation did not return a payment method.',
    preparing: 'Preparing secure card form…',
    save: 'Save card',
    saveFailed: 'Could not save the card.',
    saveRetry: 'Could not save the card. Please try again.',
    saved: 'Card saved',
    saving: 'Saving…',
    setupFailed: 'Could not start card setup. Please try again.',
    unavailableAfter: 'to enable it.',
    unavailableBefore: 'In-app card entry is unavailable — set',
    current: {
      title: "Current Plan",
    },
    invoices: {
      title: "Invoices",
    },
    payment: {
      expires: "Expires {month}/{year}",
      none: "No card on file.",
      "none-hint": "Your card is saved when you first subscribe.",
      "portal-hint": "Card details go straight to Stripe — they never pass through CrewFinding.",
      removed: "Card removed.",
      title: "Payment method",
    },
    plans: {
      title: "Available Plans",
    },
  },
  "checkout-cancelled": {
    text: "Checkout closed. Nothing was charged.",
  },
  "checkout-success": {
    text: "Payment received — your plan updates in a moment.",
  },
  checkout: {
    past_due: "There's an unpaid balance on your plan. Update your payment first.",
    plan_change_requires_cancel: "To move to this plan, cancel your current plan first — you keep it until the period ends, then subscribe to the new one.",
    plan_unchanged: "You're already on this plan.",
    scheduled_to_cancel: "Your plan is set to end. Keep it before changing plans.",
  },
  "confirm-cancel": {
    confirm: {
      text: "Cancel plan",
    },
    keep: {
      text: "Keep plan",
    },
    text: "Your workspace keeps {plan} until {date}, then moves to the free plan. You can subscribe again at any time.",
    title: "Cancel {plan}?",
  },
  "confirm-remove": {
    text: "Renewals will fail until another card is added.",
    title: "Remove this card?",
  },
  "confirm-upgrade": {
    text: "The change applies now. You'll be charged the prorated difference for the rest of this billing period.",
    title: "Upgrade to {plan}?",
  },
  current: {
    badge: "Current",
  },
  downgrade: {
    note: "To switch to this plan, cancel your current plan; once it ends, subscribe to this one.",
  },
  "ends-on": {
    text: "Ends {date}",
  },
  feature: {
    analytics: {
      text: "Analytics",
    },
    sla: {
      text: "Uptime SLA",
    },
    sso: {
      text: "Single sign-on",
    },
    support: {
      text: "Priority support",
    },
  },
  header: {
    text: "Billing & Payment",
  },
  incomplete: {
    text: "Checkout was not completed — no plan is active.",
  },
  interval: {
    month: {
      text: "Billed monthly",
    },
    monthly: {
      option: "Monthly",
    },
    year: {
      text: "Billed yearly",
    },
    yearly: {
      option: "Yearly",
    },
  },
  invoices: {
    more: "Show older invoices",
    empty: "No invoices yet.",
    "no-link": "This invoice has no document yet.",
    status: {
      draft: "Draft",
      open: "Open",
      paid: "Paid",
      uncollectible: "Uncollectible",
      void: "Void",
    },
    view: "Invoice of {date}",
  },
  limit: {
    "api-calls": {
      text: "{count} API calls a day",
    },
    jobs: {
      text: "Up to {count} open jobs",
    },
  },
  loading: {
    text: "Loading…",
  },
  "manager-required": {
    text: "Only the workspace owner or an admin can change billing.",
  },
  "members-readonly": {
    text: "Only the workspace owner or an admin can change billing.",
  },
  "not-now": {
    text: "Not now",
  },
  offline: {
    text: "Couldn't refresh — showing the last billing details.",
  },
  paragraph: {
    text: "Manage your subscription plan and payment methods.",
  },
  "period-end": {
    text: "the end of the billing period",
  },
  "plan-limit": {
    jobs: {
      text: "Your plan allows up to {count} open jobs.",
    },
    manager: {
      text: "Upgrade the plan to add more, or complete or cancel open jobs.",
    },
    member: {
      text: "Ask your workspace owner or an admin to upgrade the plan.",
    },
    "not-now": {
      text: "Not now",
    },
    seats: {
      text: "Your plan allows up to {count} members.",
    },
    "see-plans": {
      text: "See plans",
    },
    title: "Plan limit reached",
  },
  plan: {
    free: {
      label: "Free",
    },
  },
  price: {
    indicative: "(indicative)",
    "per-month": "{price} / month",
    "per-year": "{price} / year",
  },
  "reactivate-failed": {
    text: "This plan has already ended. Choose a plan below to subscribe again.",
  },
  "reactivated-notice": {
    text: "Your plan will renew as usual.",
  },
  "renews-on": {
    text: "Renews {date}",
  },
  renews: {
    text: "Renews",
  },
  seats: {
    one: "Up to 1 member",
    text: "Up to {count} members",
  },
  status: {
    active: "Active",
    canceled: "Canceled",
    ending: "Ending",
    incomplete: "Incomplete",
    past_due: "Past Due",
    paused: "Paused",
    trialing: "Trial",
    unpaid: "Unpaid",
  },
  "trial-ends-on": {
    text: "Trial ends {date}",
  },
  "trial-ends": {
    text: "Trial ends",
  },
  "trial-gate-unavailable": {
    text: "We couldn't check trial eligibility just now. Try again in a moment.",
  },
  "trial-unavailable": {
    text: "A free trial isn't available for this account. You can still subscribe now — billing starts today.",
    title: "No free trial available",
  },
  "trial-verify": {
    text: "Verify your email address to start a free trial. We'll send you a code.",
    title: "Verify your email",
  },
  trial: {
    text: "{days}-day free trial on your workspace's first plan",
  },
  upgraded: {
    text: "Upgraded to {plan}.",
  },
  usage: {
    jobs: {
      text: "Open jobs",
    },
    of: {
      text: "{used} of {limit}",
    },
    seats: {
      text: "Members",
    },
    unlimited: {
      text: "{used} · unlimited",
    },
  },
  working: {
    text: "Working…",
  },
}
export default billing

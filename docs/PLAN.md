# CrewFinding Web — plan

`app.crewfinding.com` — the CrewFinding web app. `crewfinding.com` stays the landing page.

## Who it is for

CrewFinding's primary users are field workers: an electrician, a carpenter, a
landscaper — often a one-person business with no office. **The mobile app is the
full product** and stays that way: everything a business needs is on the phone.

The web app is the **central office** for businesses that have one: creating and
dispatching jobs across crews, scheduling, customers, invoicing, team and roles,
reports — work done at a desk, on a big screen, with a keyboard. Field workers
never need it; offices get a better tool than a phone.

Both clients read and write the same data through the same API and the same
`@fonderie/*` packages, so a job created at the office is on the crew's phone at
once, and the other way round.

## Billing per client

One subscription per **workspace**, whichever client sold it — the API is the
source of truth and every client shows the same plan, card and invoices.

| Client | May sell | How |
|---|---|---|
| Web | Yes | Stripe — hosted Checkout to subscribe, Stripe's card form (card only) to add or replace the card on file |
| iOS / Android | Yes, through the stores | Apple In-App Purchase / Google Play Billing — a separate `@fonderie/billing` track (store subscriptions), designed and approved before it is built |
| iOS / Android until then | No | Billing read-only: no button, link or pointer to another way to pay (App Review 3.1.1 / 3.1.3) — shipped in the mobile app |

## Development style — the same as LeadEasyGen

This repo starts as a clean copy of LeadEasyGen's web app, so it keeps its
conventions; changes to them are deliberate and written here.

- **Stack**: Vite, React 19, TypeScript, Tailwind 4, React Router, react-hook-form,
  sonner (toasts), Phosphor icons. Lint with `oxlint`, end-to-end tests with
  Playwright.
- **Fonderie first**: auth, sessions, MFA, billing, workspaces, members, roles,
  customers and media come from `@fonderie/react-*` hooks — never hand-rolled
  fetches for what a package already does. CrewFinding's own endpoints (jobs,
  estimates, invoices, job schemas) go through the same `FonderieClient`, in
  `src/api/*`, shared in shape with the mobile app's modules.
- **Reads through the shared store**: hooks open on their data and refresh
  behind it — no spinner over data, no flicker (`client.queries`).
- **i18n**: typed dictionaries, compile-checked key parity across languages;
  English is the source.
- **Desktop-first layouts**: sidebar + top bar, content with a max width,
  tables and two-pane list/detail where a list is long. Usable down to tablet.
- **Gates**: `npm run lint`, `npm run typecheck`, `npm run build` and the e2e suite
  pass before every push. Author: Matthew Dacar.

## Screens

Every mobile screen, where it lands on the web, and in which phase. *Field-only*
screens stay on the phone.

| Mobile screen | Web | Phase |
|---|---|---|
| WelcomeScreen | — (the landing page does this) | field-only |
| LogInScreen | `/login` (email, Google, Apple-ready) | 1 |
| RegisterScreen | `/register` | 1 |
| MfaVerifyScreen | `/login` second-factor step | 1 |
| ForgotPasswordScreen / ResetPasswordScreen | `/forgot-password`, `/reset-password` | 1 |
| (email verification) | `/verify` | 1 |
| WorkspaceSwitcherScreen / CreateWorkspaceScreen | workspace menu in the top bar, `/workspaces/new` | 1 |
| OrganizationScreen → PaymentScreen | `/billing` — plans, checkout, card, invoices, usage | 1 |
| AccountScreen → UserInfo, ChangeEmail, ChangePhone, ChangePassword | `/settings/account` | 1 |
| AccountScreen → ChangeLanguage, ChangeTheme, DateTimeFormat, NotificationPreferences | `/settings/preferences` | 1 |
| AccountScreen → Sessions, LoginActivity, SignInMethods, MfaSetup, DeleteAccount | `/settings/security` | 1 |
| OrganizationScreen → BusinessInfo, Address, Contact | `/organization` | 2 |
| OrganizationScreen → Members, InviteMember | `/organization/members` | 2 |
| OrganizationScreen → Roles, CreateRole, RoleDetail | `/organization/roles` | 2 |
| DashboardScreen | `/` — today's jobs, open estimates/invoices, plan usage | 3 |
| JobScreen | `/jobs` — table with filters, status, crew, dates | 3 |
| JobScreen → JobSummaryScreen | `/jobs/:id` — two-pane detail | 3 |
| CreateJobScreen | `/jobs/new` (form from the workspace's job schema) | 3 |
| CustomerScreen / CustomerDetailScreen | `/customers`, `/customers/:id` | 3 |
| CreateEstimateScreen / EstimateDetailScreen | `/estimates/new`, `/estimates/:id` | 3 |
| CreateInvoiceScreen / InvoiceDetailScreen | `/invoices/new`, `/invoices/:id` | 3 |
| NotificationScreen | notifications panel in the top bar | 3 |
| ReportScreen → CalendarScreen | `/calendar` — week / month | 4 |
| ReportScreen → LogScreen | `/activity` | 4 |
| FormBuilderScreen | `/settings/job-forms` — job schema editor | 4 |
| — (new, web-only) | `/dispatch` — assign crews to jobs across a week | 4 |
| ConfirmationScreen, navigation / ride options | — (on-site, turn-by-turn) | field-only |
| billing/return | `/billing/success`, `/billing/cancelled` | 1 |

## Phases

### Phase 0 — Foundation

- Clean copy of LeadEasyGen's app; LeadEasyGen's own features removed (lead
  scraping, scrape jobs and results, credit packs and wallet, its help-center
  articles and legal copy).
- Rebrand: name, wordmark, favicon, colours from the mobile palette (primary
  `#007BFF`), page titles and meta. No "LeadEasyGen" left anywhere (a check
  enforces it).
- Points at the CrewFinding API (`VITE_API_URL`); Stripe publishable key for the
  sandbox.
- CI: lint, typecheck, build, e2e. Vercel deployment, then `app.crewfinding.com`
  once the DNS record exists.

### Phase 1 — Accounts and billing (unblocks subscriptions)

Sign-in and sign-up, workspace switcher, `/billing`, `/settings`. On the API: the
Stripe return addresses move to `app.crewfinding.com/billing/…` (the phone apps
no longer start a checkout).

### Phase 2 — Organization

Business info, address, contact; members and invitations; roles and permissions.

### Phase 3 — Operations

Dashboard, jobs, customers, estimates, invoices, notifications — the office core.

### Phase 4 — Office views

Calendar, activity log, job-form builder, and the web-only dispatch board.

### Phase 5 — Hardening

End-to-end coverage of every flow, language parity with the mobile app (en, fr,
es, ja, ko, ru, zh), accessibility, performance budget.

## Status

| Phase | State |
|---|---|
| 0 | done — copy, LeadEasyGen features removed, rebrand, `check:brand` gate, CI on the CrewFinding API |
| 1 | in progress — sign-in/sign-up, workspace menu + new workspace, `/billing` (plans, checkout, card form, invoices, usage) and `/settings` done and verified against a local API; remaining: Stripe returns to the web app (API), deployment |
| 2–5 | planned |

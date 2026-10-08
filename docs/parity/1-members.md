# Parity phase 1 — Members & invitations

Reference: the mobile app (`app/src/app/(private)/OrganizationScreen/(section)/MembersScreen`,
`InviteMemberScreen`, `components/Members/*`, `components/StepUp`, `components/OwnershipOfferBanner`,
`components/ArchivedWorkspaceBanner`, `hooks/usePendingOwnershipOffers`, `utils/members.ts`,
`utils/error.ts`, `utils/billing.ts#promptPlanLimit`). English copy below is verbatim from
`app/src/locales/lang/en/US.json`; the web writes the mobile's ALL-CAPS button labels in
sentence case (a mobile style, not wording) — the precedent set by the join flow.

## Entry points

| Mobile | Web |
|---|---|
| Organization → Team → "Team Members" (hidden for a personal workspace) | Sidebar "Organization" → section nav "Team Members" → `/organization/members` (the nav item is hidden for a personal workspace; the URL still answers with the personal card) |
| Members → "INVITE A MEMBER" → InviteMemberScreen | Members → "Invite a member" → `/organization/members/invite` |
| Ownership offer banner on Dashboard / Jobs / workspace switcher → "Review" (switches workspace first) → Members | Banner on the dashboard (`/`) and at the top of the workspace menu → "Review" (switches workspace first) → `/organization/members` |
| Archived banner → owner "Restore" → Organization | Same banner → `/organization` (archive card, phase 4) |

## Members screen

Header "Team" / "The people who work in this workspace, and the invitations waiting for an answer."

States, in order:
1. Workspace not known: spinner "Loading the team"; on error the error + "Try again".
2. Personal workspace: card "Your personal workspace" / "A personal workspace is just for you — it has no team. To work with a crew, create a business workspace and invite them there." + "Create a business workspace" → `/workspaces/new`.
3. Otherwise, top to bottom: ownership offer card (below), archived banner, invite card, Members card, Pending invitations card, "Show more".

- **Invite card** (managers, not archived): "Seats used: {used} / {limit}" when the plan has a limit (`useWorkspaceSeats`, the server's count: team without the owner + pending invitations), then "Invite a member".
- **Members card** "Members": rows paged 25 at a time (`useMembers(undefined, { pageSize: 25 })`).
  - Row: avatar (photo or initials), name in the reader's name order (`formatPersonName`, else email), "{name} (you)" for self, email under it when it differs from the name; badges "Owner" (else "Manager"), "Deleting paused" when `paused`; chips for the other roles (system roles translated: GUEST "Member", ADMIN "Manager", OWNER "Owner"; OWNER/ADMIN chips are dropped when the badge already says it). "⋯" button (a11y "Actions for {name}") only when the viewer has at least one action and nothing is running.
  - Lost access (403/404 with no rows): warning "You are no longer a member of this workspace, or it was closed." + "Switch workspace" (opens the workspace menu).
  - Load error with no rows: the error + "Try again".
  - One person only: manager "Only you so far. Invite your crew by email — they fill in their own details."; member "Only you so far. The owner or a manager can invite more people."
- **Pending invitations** (managers, when any): row = email, then "{role} · Expires {date}" or "Expired — resend it" (date in the user's date-format preference); resend (a11y "Send the invitation to {email} again") and revoke (a11y "Revoke the invitation to {email}"), both disabled while busy or archived.
- **Paging**: members first, then (managers) invitations, a page per "Show more"; "Loading more" while it reads.

## Member actions (⋯ menu) — `memberActions()`

| Action | Who | On whom |
|---|---|---|
| "Roles…" | manager, workspace has active custom roles | anyone but the owner (self included) |
| "Make manager" | owner | not owner, not manager |
| "Remove manager rights" | owner | a manager who is not the owner |
| "Transfer ownership" | owner | anyone but the owner |
| "Let them delete again" | owner | a paused member, not the owner |
| "Remove from team" (danger) | manager | not owner, not self |
| "Leave team" (danger) | not the owner | self only |

Personal workspace or unknown viewer: nothing. **Archived**: only "Transfer ownership" and "Leave team" remain (what the server still allows).

Roles… opens "Roles for {name}": per custom role "Add {role}" or "✓ {role} — remove"; the last held role reads "✓ {role} — their only role" and is disabled (the server refuses "Cannot remove last role"; system roles are never offered). Done: "{name} now has the role {role}." / "{name} no longer has the role {role}."

Confirmations (cancel = "Cancel"):

| Action | Title | Text | Confirm | Done |
|---|---|---|---|---|
| Make manager | Make manager? | {name} will be able to invite and remove members and assign roles. | Make manager | {name} is now a manager. |
| Remove manager rights | Remove manager rights? | {name} stays on the team with their other roles, but can no longer manage it. | Remove manager rights | {name} is no longer a manager. |
| Transfer (destructive, step-up) | Transfer ownership? | {name} is offered ownership of {workspace}, with full control including billing. It moves when they accept, and you stay on the team as a manager. | Transfer ownership | Offered to {name}. Ownership moves when they accept. |
| Remove (destructive) | Remove from team? | {name} loses access to {workspace} — its jobs, customers and documents — right away. They need a new invitation to come back. | Remove from team | {name} was removed from the team. |
| Leave (destructive) | Leave the team? | You lose access to {workspace} — its jobs, customers and documents. You need a new invitation to come back. | Leave team | (switches to the personal workspace, goes home) |
| Revoke invitation (destructive) | Revoke the invitation? | The link sent to {email} stops working. | Revoke | The invitation to {email} was revoked. |
| Resend (no confirm) | — | — | — | Invitation sent again to {email}. The previous link no longer works. |
| Let them delete again (no confirm) | — | — | — | {name} can delete again. |

## Ownership offer (`useOwnershipOffer`)

- To the viewer: card "You are offered this team" / "{name} wants to make you the owner of {workspace}. The offer lapses on {date}." — "Accept" → "You now own {workspace}."; "Decline" → "Offer declined."
- Owner, offer pending: "Ownership offered" / "Waiting for {name} to accept. The offer lapses on {date}." — "Withdraw the offer" → "Offer withdrawn."
- Anyone else: nothing.
- Banner (every workspace the person is in but does not own, not personal; one `GET /workspaces/transfer-ownership` per workspace with its `X-Workspace-ID`): "You've been offered ownership of {workspace}." — "Review".

## Step-up (`useStepUp`, STEP_UP_REQUIRED — only `POST /workspaces/transfer-ownership` asks)

Run the move; on `isStepUpRequired(err)` ask, then run it once more. Title "Confirm it’s you".
Mode: authenticator when `mfa` is offered ("Enter a code from your authenticator app (or a backup code).");
else password ("Enter your password to continue.", with "Send me a code instead" when email/sms is offered);
else a code ("We’ll send you a code to confirm." → "Send code" → "Enter the code we sent to your {channel}." with channel "email" / "phone").
Buttons "Cancel", "Confirm". Wrong proof: "That didn’t confirm it’s you. Try again." Cancelled: the original refusal stands.

## Invite (`/organization/members/invite`)

"Invite a member" / "Enter their email. They get a link, create their account (or sign in), and fill in their own name, phone and photo."
- Not known yet: spinner. Personal: "A personal workspace has no team. Create a business workspace to invite people." Not a manager: "Only the owner or a manager can invite people to this team." (no form: the server answers 403 MANAGER_REQUIRED).
- Field "Email address": trimmed + lower-cased; empty → "Can't be blank"; > 254 chars or not `x@y.z` → "Please enter a valid email".
- Already on the team → "This person is already on your team."; an open invitation (not expired, PENDING) → "Already invited. To send a new link, use resend in the team list."
- Role (only when active custom roles exist): "Role" / "Optional. Without one they join as a member: they see customers and templates, and update the jobs assigned to them." options "Member (default)" + each custom role; else "They join as a member. Create custom roles in Roles & permissions to give them more."
- "Send invitation" → back to Members; "Cancel" → back.

## Refusals → message (`errorMessage`, the app's `getErrorMessage`)

| Reason | Message |
|---|---|
| WORKSPACE_ARCHIVED | This workspace is archived, so nothing can be added or changed. The owner can restore it. |
| WORKSPACE_NOT_ARCHIVED | This workspace is not archived. |
| OWNER_REQUIRED | Only the workspace owner can do this. |
| SEAT_LIMIT_REACHED / PLAN_LIMIT_REACHED | dialog "Plan limit reached": "Your plan allows up to {count} members." (jobs: "…{count} open jobs."); manager: "Upgrade the plan to add more, or complete or cancel open jobs." + "Not now" / "See plans" (→ `/billing` — the web may sell, like the app's web build); member: "Ask your workspace owner or an admin to upgrade the plan." + "OK" |
| other, with server explanation | the explanation |
| other, by status | 400 Invalid request. Please check your input. · 401 Your session has expired. Please sign in again. · 403 You don't have permission to do this. · 404 We couldn't find what you were looking for. · 409 This conflicts with existing data. · 422 Please check your input and try again. · 429 Too many attempts. Please wait a moment and try again. · 500 Something went wrong on our side. Please try again later. · 502 The service is temporarily unavailable. · 503 The service is down for maintenance. |
| network | No connection. Check your network and try again. |
| unknown | Something went wrong. Please try again. |

(The app also maps CUSTOMER_*, JOB_*, TEMPLATE_*, MEMBER_NOT_IN_WORKSPACE, INVALID_STATUS_TRANSITION — kept in the same table on the web for the later operations screens.)

## Web-only adaptations

- Mobile action sheets → a "⋯" dropdown menu; mobile alerts → confirm dialogs; inline notices → toasts.
- Pull-to-refresh/refresh-on-focus → the hooks' own refresh on mount and after each action.
- The view is keyed by workspace id (no menu, selection or message survives a switch), as on mobile.

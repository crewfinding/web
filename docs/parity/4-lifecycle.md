# Parity phase 4 — Workspace lifecycle & activity

Reference: the mobile app's `OrganizationScreen.view.tsx` (`WorkspaceArchiveCard`),
`WorkspaceSwitcherScreen` (archived badge), `ArchivedWorkspaceBanner`, `useWorkspaceArchived`,
`MembersScreen` (archived gating). English copy verbatim from `en/US.json`.

## Archived badge

Mobile: the switcher row shows "Archived" next to an archived workspace's name; it can still be
opened and read. Web: the workspace menu shows the same "Archived" badge on the row (and on the
trigger when the selected workspace is archived).

## Read-only banner

"This workspace is archived: read-only. You can still view and export everything." (owner, with
"Restore" → the Organization page) / "This workspace is archived: read-only. Only the owner can
restore it." (everyone else). Mobile shows it on Dashboard, Jobs and Members; web shows it on the
dashboard, Members, Roles (web adds it there: see below) and — as the Business page's own notice —
Business.

## Disabled writes while archived (409 WORKSPACE_ARCHIVED on the server)

- Members: no invite card; invitation resend / revoke disabled; member menu keeps only "Transfer
  ownership" and "Leave team" (phase 1).
- Business: every card read-only, notice "This workspace is archived, so these details can’t be
  changed until the owner restores it." (phase 3).
- Roles: the mobile Roles screen does not check the archive (the server refuses with the
  WORKSPACE_ARCHIVED message). The web follows the requested rule instead: banner, and no create /
  delete / restore / editing while archived — the same outcome without a refused click.
- Any refused write still reads "This workspace is archived, so nothing can be added or changed. The
  owner can restore it." (error table).

## Archive / restore (owner only — the server answers 403 OWNER_REQUIRED to anyone else)

Card "Workspace" at the end of the Organization landing page (web: the Business page), never for a
personal workspace; a manager or member of an active workspace sees no card.
- Active, owner: "Archiving makes this workspace read-only for everyone, and its paid plan ends at the
  end of the current billing period. You can restore it at any time." + "Archive workspace" (danger) →
  confirm "Archive {workspace}?" / "Everyone keeps read access, but no one can add or change jobs,
  quotes, invoices, customers or the team. Customers can no longer answer quotes. The paid plan is not
  renewed: it ends at the end of the current billing period. Restore the workspace before then to keep
  it." — "Archive" / "Cancel" → "{workspace} is archived."
- Archived: "Archived on {date}. It is read-only until the owner restores it." (no date: "Archived. It
  is read-only until the owner restores it."); owner: "Restore workspace" → confirm "Restore
  {workspace}?" / "Everyone can work in it again. If its paid plan was set to end because of the
  archive and the billing period is not over yet, the plan continues." — "Restore" / "Cancel" →
  "{workspace} is restored."
- After either: the workspace read and the workspace list are refreshed (the badge and banners follow).

## Activity log

The mobile app has no activity log (Reports → Log renders sample rows). The web adds one, as asked,
on the API's audit trail: `GET /audit` through `@fonderie/react-audit`'s `useAuditEvents`, for those
who may read it — `usePermissions().can('read', 'audit')` (the owner and managers hold every right; a
custom role gets it with the "Activity log" switch). Section nav "Activity log" (shown only then) →
`/organization/activity`. Rows newest first: when (date preference + time), who (member name, "System"
without an actor, "A former member" for someone no longer on the team), what (the event type), details
on demand; "Show more" pages on. Without the right: a notice, no request.

## Undo bins

Mobile bins: roles (Roles screen — on the web since phase 2) and customers (Customers screen). The
web has no Customers area yet, so the customer bin waits for it; there is no webhook bin in the app.

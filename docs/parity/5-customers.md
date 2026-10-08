# Parity phase 5 — Customers

Reference: the mobile app's `CustomerScreen` (`CustomerScreen.view.tsx`, the list and the undo bin),
`CustomerDetailScreen` (`.controller.ts`, `.view.tsx`), `components/CustomerEditor/*`
(`CustomerIdentityForm`, `CustomerSections`, `EntrySheet`, `RelationshipSheet`, `TimeZonePicker`,
`labels.ts`, `permissions.ts`), `CustomerRow`, `CustomerTagChip`, `AddAddressSheet`,
`LabelPickerSheet`, `CustomerPickerModal`, `PhoneInput`, `utils/customer.ts`, `utils/timeZones.ts`,
`utils/error.ts`. English copy is verbatim from `en/US.json` (keys named below); French and Spanish
reuse `fr/FR.json` and `es/ES.json` where the message exists. The pure rules live in
`src/lib/customers.ts` (tested in `src/lib/customers.test.ts`). Data comes from
`@fonderie/react-customers` hooks only, except the create-then-add step (see Create).

## Entry point

Mobile: Organization → "Customers" → "All Customers". Web: the sidebar's "Customers" →
`/customers`. Routes: `/customers` (list, filters, bin), `/customers/new` (create),
`/customers/:customerId` (detail). Every page is keyed by the selected workspace: a switch drops
the search, the filter, a draft and an open customer.

## Who may do what

The role's `customers` switches, read with `useCan(op, 'customers')` (false until known). The server
still refuses with 403; the page only hides what would be refused.

| Action | Rule |
|---|---|
| See the list, a customer, the bin | everyone in the workspace (`read`) |
| "New customer", `/customers/new` | `create` — else the page says "You can't add customers" / "Your role in this workspace can view customers but not add them. Ask the owner or a manager." |
| Edit details, add / remove / relabel / make primary, notes, tags, links, blacklist, archive / restore | `update` |
| Delete customer | `delete` |
| Restore from the bin | `create` |
| Delete forever (bin) | the workspace owner only (`usePermissions().isOwner`; 403 OWNER_REQUIRED otherwise) |
| **Archived workspace** | read-only: none of the above writes are offered, and the archived-workspace banner is shown. (Web addition — the mobile customer screens rely on the server's 409 WORKSPACE_ARCHIVED.) |

## 1. List (`/customers`)

Title "Customers" (mobile section header `screen.organization-main.section.customers.header.text`).
"New customer" button (`screen.customers.new`) only with `create`.
- Search box "Search customers…" (`placeholder.search-customers`) — the SERVER searches name,
  reference, email and phone; typing waits 300 ms, a cleared box applies at once. Hidden on the
  Deleted tab.
- Filter tabs "Active" / "Archived" / "Deleted" (`screen.customers.filter.*`). Active and Archived
  read `useCustomers({ search, archived })`; Deleted reads `useDeletedCustomers()`.
- Row: initials avatar (a red dot when blacklisted), name (`displayName` — the server's order for the
  customer's language — else first + last, company, reference, "Unknown"), "#reference", "Blacklisted"
  (`screen.customer-picker.blacklisted.badge`). Opens the detail.
- Paging: pages of 25; "Show more" reads the next page (mobile: on scroll end).
- Loading "Loading customers"; error "Customers could not be loaded" + the error + "Try again";
  a failed refresh over rows already shown keeps the rows with the error above them.
- Empty: search → "No results" / "Try a different name or reference."; Archived → "No archived
  customers" / "A customer on a job, quote or invoice is archived instead of deleted. It shows up
  here."; Active → "No customers yet" / with `create` "Tap + to add your first customer." (web:
  "Click New customer to add your first customer.") else "Customers your team adds will appear here."

## 2. Undo bin (Deleted tab)

Deleted customers stay 30 days with all their contact details. Row: name (company, else first +
last, else "#reference", else "—"), "Restorable until {date}" (the viewer's date preference).
- "Restore" (a11y "Restore {name}") — `create`; done → "“{name}” restored."
- "Delete forever" (a11y "Delete {name} forever") — owner only, after "Delete “{name}” forever?" /
  "It can no longer be restored. Only the owner can do this." / "Delete forever" / "Cancel".
- Refusals: RESTORE_CONFLICT (409) → "Another customer now has the reference #{code}. Change
  theirs, then restore." (mobile: any 409; the web keys on the reason so WORKSPACE_ARCHIVED keeps
  its own message); else the error table.
- Empty "Nothing deleted" / "Deleted customers stay here for 30 days, with all their contact
  details, and can be restored."

## 3. Create (`/customers/new`)

"New customer". The identity form (below) with a first phone and email. Submit "Create customer",
"Cancel" goes back. Steps: `createCustomer` (trimmed values; blank → not sent), then — on the new id,
which no hook can own yet — `addPhone(label 'mobile', primary)` and `addEmail(label 'work',
primary)` through the client. A part that fails: warning "{name} was created, but this could not be
saved: {items}. Add it again below." (items "Phone", "Email"). Then the detail page replaces the
create page. A refused create shows the error above the form.

### Identity form (create and "Edit details")

- "Customer type": "Individual" / "Business".
- Individual: "First name *" (required "Can't be blank"), "Last name". "Company name" (required "*"
  for a business). "Reference". Too long: "At most {max} characters" (names 100, company 200,
  reference 100, email 254).
- Create only: "Phone" (country picker + national format, E.164, libphonenumber; invalid "Please
  enter a valid phone"), "Email" (invalid "Please enter a valid email"). Both optional.
- "Customer's language": "Business default" + the languages the business serves (Business →
  Regional, named in their own language), else the app's seven (English, Français, Español, 中文,
  Русский, 한국어, 日本語). A stored 'fr' selects 'fr-CA' and the reverse. A new customer starts on
  the business's locale.
- "Customer's time zone": "Business time zone (default)" = none; a searchable list ("Search time
  zones", "No time zone matches") of "City (ABBR) · Area/City"; a suggestion chip "From their
  address: {zone}" (primary address's province / state) else "Business: {zone}" (settings zone, else
  head office region); "Clear time zone".
- Edit: "Edit details", "Save changes" / "Cancel"; blank → null clears.

## 4. Detail (`/customers/:id`)

`useCustomer(id, 1)` — one read; every section renders from it, the section hooks are used with
`{ read: false }` for their actions. States: loading; 404 → "Customer not found" / "This customer
was deleted, or is not in this workspace." + "Back"; error → "Customers could not be loaded" + the
error + "Try again".

Hero: initials (blacklist dot), name, "Individual"/"Business" · "#ref", "Time zone: {zone}" when set,
"Edit details" (`update`). "More actions" menu: "Edit details", "Blacklist" / "Remove from
blacklist", "Archive" / "Restore from archive" (all `update`), "Delete customer" (`delete`).
- Blacklisted banner: "Blacklisted" + the reason. Blacklist asks "Blacklist customer" / "Prevent
  {name} from booking?" / "Blacklist"; removing asks "Remove from blacklist" / "Allow {name} to book
  again?" / "Remove".
- Archived banner: "Archived" / "Hidden from lists and pickers; kept on jobs, quotes and invoices."
  + "Restore from archive" (`update`). Archive asks "Archive customer" / "Archive {name}? It
  disappears from lists and pickers and stays on jobs, quotes and invoices. You can restore it at any
  time." / "Archive".
- Delete asks "Delete customer" / "Delete {name} and all their contact details? You can restore them
  for 30 days from Customers › Deleted." / "Delete" → back to the list. Refused 409
  CUSTOMER_IN_USE → "This customer is in use" / "{name} is on a job, quote or invoice, so it can't be
  deleted. Archive it instead: it disappears from lists and pickers and stays on those documents." +
  "Archive" (with `update`), else "… Ask the owner or a manager to archive it."

### Sections (each with a "+" add button when `update`)

| Section | Add | Empty | Row |
|---|---|---|---|
| Phone | "Add phone": "Number" (phone input) + "Label" chips mobile / office / home / fax / other (+ "Custom label (leave blank for "other")") | "No phone on file" | label · value · "primary" badge · ⋯ |
| Email | "Add email": "Address" + chips work / personal / billing / other | "No email on file" | same |
| Address | "Add address" (§5) | "No address on file" | label · "street, Unit 4B, city prov zip, country · Buzzer 12" · badge · ⋯ |
| Notes | "Add note": "Note" ("Write a note…", ≤ 10000) | "No notes yet" | body, date, ⋯ |
| Tags | "Add tag": "Tag" ("vip, repeat, referral…", lower-cased, ≤ 100) | "No tags" | chip × "Remove tag {tag}" → "Remove tag" / "Remove "{tag}"?" |
| Relationships | "Link a contact": "Customer" picker + "Relationship" chips contact / employee / employer / spouse / partner / subsidiary / other (+ "e.g. accountant, contractor…") → "Add relationship" | "No linked contacts" | name (opens it), relationship · phone, badge, ⋯ |

The first phone / email / address / link added is primary. Row ⋯ ("Actions for {item}"): "Set as
primary" (not on the primary; not on notes), "Remove" → "Confirm" / "Remove “{item}” from this
customer?". The label of a phone / email / address is a link ("Change label, now {label}") opening
"Phone label" / "Email label" / "Address label": the defaults, the workspace's saved labels (each
with "Forget the label {label}"), "other" + custom; "Save". Known labels show translated
(`screen.customer-editor.label.*`), a custom one as typed. Validation: empty "Can't be blank",
email "Please enter a valid email", phone "Please enter a valid phone" (7–15 digits and a real number
for its country).

Customer picker (links): searches the server, pages, leaves out the customer itself and archived
ones; "No customers yet." / "No customer matches this search."; a blacklisted one is marked and asks
"Blacklisted customer" / "{name} is on your blacklist[: {reason}]. Use this customer anyway?" /
"Use anyway".

## Web-only shapes

- Mobile sheets and alerts are dialogs; the action sheet is the "⋯" menu; pull-to-refresh and
  scroll-end paging are "Try again" and "Show more".
- Phones are not tappable (no "Call {phone}") and addresses do not open Maps: the mobile app offers
  those only on the job screen, not on the customer screen.
- Create's partial failure is a warning toast on the customer's page (mobile: an alert).

## 5. Address entry

Same rule as the business locations (docs/parity/3-business.md): the address comes ONLY from the
places search (`POST /places/autocomplete` ≥ 3 chars, 300 ms; `GET /places/:placeId`), placeholder
"Find a specific address on the map…". A place without street, city, province / state, postal code
or country → "Pick a more precise result — a street address, not a city or a region."; nothing
picked → "Search for the address and pick it from the suggestions."; once picked a summary +
"Change address". Typed: "Unit / Apt # (optional)" ("e.g. 4B") and "Buzzer # (optional)" (≤ 20)
only. "Label": service / billing / other. Saved as `line1` street, `unit`, `city`, `subdivision1Iso`,
`zipPostalCode`, `countryIso`, `latitude` / `longitude` from the pick, `accessCode` the buzzer
(@fonderie/customers 6.10; the server normalizes them).

Same on mobile (AddAddressSheet): search-only, Unit / Suite and Buzzer typed, the city and point
saved. An address written before customers 6.10 may hold its city in `line2`; rows still print it.

## Refusals (reason → message)

From `src/lib/apiErrors.ts` (the mobile `getErrorMessage`): CUSTOMER_ARCHIVED "This customer is
archived. Unarchive them to add a new job, quote or invoice.", CUSTOMER_IN_USE (the in-use dialog
on delete), WORKSPACE_ARCHIVED "This workspace is archived, so nothing can be added or changed. The
owner can restore it.", OWNER_REQUIRED "Only the workspace owner can do this.", then the server's
explanation, then by status. Customers adds (web, new copy): RESTORE_CONFLICT (above),
DUPLICATE_EMAIL "This email is already on this customer.", DUPLICATE_PHONE "This phone number is
already on this customer.", DUPLICATE_ADDRESS "This address is already on this customer.",
DUPLICATE_REFERENCE_CODE "Another customer already has this reference.", LABEL_IN_USE "This label
can’t be forgotten: it is still in use, or it is a shared default."

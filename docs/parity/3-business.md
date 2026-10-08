# Parity phase 3 — Business info

Reference: the mobile app's `BusinessInfoScreen` (`.view.tsx`, `.controller.ts`, `BusinessCard.tsx`,
`BusinessContacts.tsx`, `BusinessTaxes.tsx`, `BusinessSettings.tsx`), `AddressAutocomplete`,
`PhoneInput.controller.ts`, `usePlaceSearch`, `utils/timeZones.ts`, `constants/trades.ts`.
English copy is verbatim from `en/US.json`; the pure rules are ported unchanged into
`src/lib/business.ts`, `src/lib/phone.ts`, `src/lib/timeZones.ts`.

## Entry point

Mobile: Organization → Business Details → "Business Info". Web: Organization section nav
"Business Info" → `/organization/business` (the Organization area opens on it). Everyone in the
workspace may open it; a personal workspace has it too.

## Page

"Business" / "Your business details appear on quotes, invoices and messages to customers."
- The workspace read (`useCurrentWorkspace` of react-workspaces), only when it is the selected one
  (right after a switch the read may still hold the previous workspace).
- Loading "Loading your business details…"; error "Your business details could not be loaded. {error}" + "Try again"; none "This workspace could not be found. You may no longer be a member of it." + "Try again".
- **Who edits**: owner or manager (`usePermissions().isManager`), not while permissions load, never when archived. Archived: "This workspace is archived, so these details can’t be changed until the owner restores it."; a member: "Only the owner or a manager can change these details." Read-only cards show "label / value" pairs with "Not set" for blanks.
- **Save model**: typed cards (Profile, Website, Taxes, Document numbers, Regional) keep a draft and show "Save" / "Cancel" once it differs; one write per card, validated as a whole; a 422 "<path>: <why>" lands under the field it names, else on the card. A card remounts when the stored values it edits change. Lists (emails, phones, locations) save each action at once.

## 1. Profile

Logo (initials placeholder; "Add a logo" / "Change logo" upload at once, purpose `logo`, owner the
workspace — old asset deleted best-effort; "Delete" a11y "Delete the logo"), "Business name"
(required "Can't be blank", ≤ 200), "Slogan (optional)" (≤ 300), "Sector" (trades: Moving, Cleaning,
Plumbing, Electrical, Landscaping, General contracting, Other; an unknown stored value stays as an
option; "Not set" first). Folded "Legal details": "Legal name (if different) (optional)" (≤ 200),
"Legal form" (Sole proprietorship … Co-operative), "Business number (BN) (optional)" / US "Employer ID
(EIN) (optional)" (≤ 40) — stored as a tax registration; only the BN/EIN is swapped, from the
server's list. Too long: "Too long — at most {max} characters". A legal-field error unfolds it.
Web: the logo file is checked like the avatar (PNG/JPEG/WebP/GIF, ≤ 1 MB) instead of the mobile re-encode.

## 2. Contact

"Emails" (+ "Add email"): rows with ★ primary ("Primary — shown on your documents") / ☆ "Make primary",
label under the value, ⋯ "More actions" → "Make primary" (not on the primary), "Edit label", "Remove".
Add form: "Another email" (invalid "Enter a valid email address"), "Label (optional)" placeholder
"e.g. Billing, Dispatch", "Add email" / "Cancel". Empty: "No email yet."
"Phone numbers": same, add form "Another phone number" with the phone input (country + national
format, stored E.164; invalid "Please enter a valid phone"), extension shown as "… ext. n". Empty
"No phone number yet."
Legacy prompts (manager): the workspace's old email/phone not in the list: "Add {value} to your
emails?" / "Add {value} to your phone numbers?" + "Add" — added at once when valid, otherwise put in
the add form with the error. Read-only: the bare value.
"Website" (draft; "https://" placeholder; scheme added when missing).
Refusals: PRIMARY_REQUIRED "Make another one primary first — the primary one is shown on your
documents.", DUPLICATE "This one is already on the list.", LIMIT_REACHED "You have reached the limit
for this list — remove one to add another."; else the error table.

## 3. Locations

"Locations" + "Add a location". Sorted head office first, archived last. Row: name, "Head office" /
"Archived" badges, "Edit" (not archived), ⋯ → archived: "Restore"; else "Make head office" (not on the
head office), "Archive" (danger). One-line address "line1, Unit n, city ST zip, CC · Buzzer n"; phone;
email; the head office gets "Open in Maps" (web: Google Maps search URL). Empty "No location yet. Add
your head office — your taxes and time zone follow it."
Editor: "Location name" (required), "Address" ONLY from search (`POST /places/autocomplete` ≥ 3
chars, 300 ms debounce; `GET /places/:placeId`), placeholder "Find a specific address on the map…";
a place missing street, city, province/state, postal code or country → "Pick a more precise result —
a street address, not a city or a region."; none picked → "Search for the address and pick it from
the suggestions."; once picked a summary + "Change address" (and "Keep the current address" while
searching). Typed fields only "Unit / Suite (optional)" and "Buzzer # (optional)"; plus "Phone
(optional)", "Email (optional)", switch "Make head office" (not when it already is). Edit sends the
address (+ tax region, coordinates) only when it changed. Legacy address with no head office:
"Add {value} to your locations as the head office?" + "Add".
Refusals: HEAD_OFFICE_REQUIRED "Your business needs a head office — make another location the head
office first.", HEAD_OFFICE_ARCHIVE "The head office cannot be archived — make another location the
head office first.", LOCATION_ARCHIVED (and WORKSPACE_LOCATION_ARCHIVED) "This location is archived —
restore it to change it."

## 4. Taxes

Title "Taxes — {province}, {country}" (else "Taxes"). No head office: "Add your head office first —
the taxes follow its province or state." + the stored registrations. Rates from `GET
/estimates/tax-presets` (error "The tax rates could not be loaded." + "Try again"). One row per tax
the head office's region charges: "{tax} Number (optional)" and "Rate: {rate}" (US: a "{tax} %"
field). Folded "Different rates / add a tax" (open when rates were customised or extra rows exist):
rate fields for derived taxes ("{tax} %", "A percentage from 0 to 100, at most 3 decimals") and extra
rows (Country, "Kind of number", "Province / State (e.g. BC, NY) (optional)", "Number (optional)",
rate, remove "Remove this tax number"), "Add a tax number". Usual rates are not stored; once one is
changed every row carries its rate. BN/EIN carried over untouched.

## 5. Document numbers

"Prefix (optional)" placeholder "e.g. ACME" (upper-cased, ≤ 10, A–Z 0–9 '-'; error "Up to 10 letters,
digits or dashes"), "Your numbers will read" live preview "ACME-INV-0001 · ACME-EST-0001 · ACME-0042"
(no prefix "INV-0001 · EST-0001 · JOB-0042"). Folded "Customize per document": "Invoice prefix",
"Quote prefix", "Job prefix (replaces JOB)" each with its preview. Settings unreadable: "These
settings could not be loaded — they are left as they are."

## 6. Regional settings

"Language of documents" (English, Français, Español, 中文, Русский, 한국어, 日本語; en/fr/es stored as
"<lang>-<country>"), "Time zone" (searchable; suggestion "From your head office: {zone}" from the
head office's province/state), "Currency" (CAD, USD, the stored one) with "Your head office is in
{country}: the usual currency is {currency}." + "Use {value}" when it differs, "Languages you serve
customers in" (toggle chips) + "A customer can be written to in any of these."

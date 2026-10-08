# Parity phase 2 — Roles & permissions

Reference: the mobile app's `RolesScreen` (+ `roles.shared.tsx`), `RoleDetailScreen`,
`CreateRoleScreen`. English copy verbatim from `en/US.json` (ALL-CAPS buttons in sentence case).

## Entry points

| Mobile | Web |
|---|---|
| Organization → Team → "Roles & Permissions" (hidden for a personal workspace) | Organization section nav "Roles & Permissions" → `/organization/roles` |
| Roles → a custom role → RoleDetailScreen | `/organization/roles/:roleId` (also for built-in roles, read-only) |
| Roles → "CREATE ROLE" → CreateRoleScreen → (created) → its detail | `/organization/roles/new` → replaces itself with `/organization/roles/:id` |

## Roles list

"Roles & Permissions" / "Create roles and define what each member of your team is allowed to do."
Not a manager (once known): info "You can see the roles here. Only the owner or a manager can create, change or delete them."
Loading "Loading…"; a read with nothing to show: the error + "Try again".

- **Built-in roles** ("Built-in roles" / "Built-in roles can't be edited or deleted."). Each: display name (ADMIN "Manager", GUEST "Member", else the name), "Built-in", explanation:
  - ADMIN: "Manages everything: the team, roles, the business, and every job, quote, invoice and customer." — no rights list.
  - GUEST: "Everyone you invite starts with this role. They can:" + one line per catalog entry it holds, from `usePermissionCatalog().systemGrants` (never hard-coded): "{resource}: can {operations}" (operations in catalog order create/read/update/delete as "create, view, edit, delete"); when GUEST may update jobs, add "Jobs: they edit only the jobs they are assigned to or created." No grants: "Nothing yet." Catalog failed: "We couldn't load the list of rights." (mobile adds "Pull down to try again." — the web has no pull: a "Try again" button instead).
  - other: "Built into the app."
  - "Members with this role: {count}" when the member list is known.
- **Custom roles**: name, description, "Members with this role: {count}"; opens its detail. Managers get a delete button (a11y "Delete role {name}"), enabled only once the members are known and nothing is deleting. Empty: manager "No custom roles yet. Create one when some of your team need more than the Member rights.", else "No custom roles yet."
- **Delete** (destructive) "Delete “{name}”?" — unknown count: "We couldn't check who has this role. Anyone for whom it is their only role moves to Member. You can restore it for 30 days."; 0: "No one has this role. You can restore it for 30 days."; n: "Members with this role: {count}. Anyone for whom it is their only role moves to Member. You can restore it for 30 days, and they get it back." Confirm "Delete", cancel "Cancel". Done: "“{name}” deleted." or "“{name}” deleted. Moved to Member: {count}."
- **Recently deleted** (managers, when any; `useDeletedRoles`): "Recently deleted" / "Deleted roles stay here for 30 days. Restoring one brings back its permissions and gives it back to everyone who held it and is still in the team." Row: name, "Restorable until {date}", "Restore" → "“{name}” restored." or "“{name}” restored. Given back to: {count}." (holders > 0); 409 → "A role named “{name}” exists now. Rename it, then restore." Owner only: "Delete forever" (a11y "Delete {name} forever") → "Delete “{name}” forever?" / "It can no longer be restored. Only the owner can do this."
- "Create role" (managers).

## Role detail

- Missing (404, or no id): warning "This role no longer exists in this workspace." + "Back to roles".
- Built-in: its name, "Built-in roles can't be edited or deleted.", explanation + grant lines, "Back to roles".
- Custom: header = name; non-manager info "Only the owner or a manager can change this role.". Card "Name and description": "Role name" (required "Can't be blank"; > 200 → "Use 200 characters or fewer."), "Description (optional)" (> 1000 → "Keep the description to 1000 characters or fewer."). Card "What this role can do" / "Turn on what people with this role may do.": per catalog entry (label from the app's resource names, else the catalog's label; its description), one switch per operation the entry lists ("Create", "View", "Edit", "Delete"; a11y "Can {operation} {resource}"). Nothing editable until role + stored rows + catalog are all read (defaults would wipe real rights). Empty catalog: "There are no rights to set yet." / undeclared "This workspace has no list of rights to choose from."
- Save ("Save changes", only when something changed): rename first, then the rights (one row per catalog entry, only listed operations sent); success → back to the list; rename ok + rights failed → "The name was saved, but the rights were not: {error}". "Discard changes" → back.

## Create role

Not a manager: "Only the workspace owner or a manager can create roles." + "Back to roles". Else "Create a Role" / "Name the role. You choose what it can do on the next screen." — same name/description rules — "Create role" → the new role's detail; "Discard changes" → back. The server's refusal clears once the name is edited.

## Refusals

Any 403 on a roles action: "Only the workspace owner or a manager can change roles. Your rights may have just changed — ask one of them."; else the phase-1 `errorMessage` table.

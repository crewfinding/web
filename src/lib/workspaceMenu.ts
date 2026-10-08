/** The navbar's workspace menu button (the workspace switcher). */
export const WORKSPACE_MENU_TRIGGER_ID = 'workspace-menu-trigger'

/** Open the workspace menu from a page ("Switch workspace" where access was lost). */
export function openWorkspaceMenu(): void {
  const trigger = document.getElementById(WORKSPACE_MENU_TRIGGER_ID)
  trigger?.focus()
  trigger?.click()
}

// "Join a team": /join, the workspace menu, the no-workspace state and the
// invitation link /invite/:token. One spec with the mobile app (same entry
// points, same copy): change the wording in both clients or in neither.
// Refusals are keyed by meaning, mapped from the server's reason codes.
const invite = {
  title: 'Join a team',
  body: 'Use the link in your invitation email, or enter the 6-digit code from it.',
  codeLabel: 'Invitation code',
  submit: 'Join',
  helper: 'The code works only for the email address the invitation was sent to.',
  cancel: 'Cancel',
  signedOut: {
    body: 'Sign in or create an account with the email your invitation was sent to.',
    signIn: 'Sign in',
    register: 'Create account',
  },
  joining: 'Joining {workspace}…',
  joiningGeneric: 'Joining…',
  joined: "You've joined {workspace}.",
  alreadyMember: "You're already in {workspace}.",
  switchAccount: 'Sign out and switch account',
  retry: 'Try again',
  goHome: 'Go to CrewFinding',
  openInApp: 'Open in the CrewFinding app',
  errors: {
    expired: 'This invitation has expired. Ask {inviter} to send a new one.',
    inviterFallback: 'the person who invited you',
    alreadyUsed: 'This invitation was already used. If that was you, the team is in your workspace list.',
    revoked: 'This invitation was cancelled. Ask the team for a new one.',
    wrongEmail: 'This invitation is for {email}. Sign in with that address to join.',
    emailFallback: 'another email address',
    roleGone: 'The role this invitation offered no longer exists. Ask the team to invite you again.',
    notFound: "That code doesn't match an invitation. Check the 6 digits in your email.",
    rateLimited: 'Too many tries. Wait a minute and try again.',
    network: "We couldn't join right now. Check your connection and try again.",
  },
}
export default invite

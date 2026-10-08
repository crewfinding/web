// Team: members, invitations, ownership offers, step-up (docs/parity/1-members.md).
// Copied from the mobile app's dictionaries — change the wording in both
// clients or in neither.
const team = {
  title: 'Team',
  intro: 'The people who work in this workspace, and the invitations waiting for an answer.',
  loading: 'Loading the team',
  retry: 'Try again',
  noAccess: {
    text: 'You are no longer a member of this workspace, or it was closed.',
    switch: 'Switch workspace',
  },
  personal: {
    title: 'Your personal workspace',
    text: 'A personal workspace is just for you — it has no team. To work with a crew, create a business workspace and invite them there.',
    create: 'Create a business workspace',
  },
  seats: 'Seats used: {used} / {limit}',
  inviteButton: 'Invite a member',
  members: {
    title: 'Members',
    empty: 'Only you so far. Invite your crew by email — they fill in their own details.',
    emptyMember: 'Only you so far. The owner or a manager can invite more people.',
  },
  pending: {
    title: 'Pending invitations',
  },
  row: {
    self: '{name} (you)',
    actions: 'Actions for {name}',
  },
  badge: {
    owner: 'Owner',
    manager: 'Manager',
    paused: 'Deleting paused',
  },
  role: {
    guest: 'Member',
    admin: 'Manager',
    owner: 'Owner',
  },
  action: {
    roles: 'Roles…',
    makeManager: 'Make manager',
    unsetManager: 'Remove manager rights',
    transfer: 'Transfer ownership',
    releaseBrake: 'Let them delete again',
    remove: 'Remove from team',
    leave: 'Leave team',
    revoke: 'Revoke',
  },
  confirm: {
    cancel: 'Cancel',
    makeManager: {
      title: 'Make manager?',
      text: '{name} will be able to invite and remove members and assign roles.',
    },
    unsetManager: {
      title: 'Remove manager rights?',
      text: '{name} stays on the team with their other roles, but can no longer manage it.',
    },
    transfer: {
      title: 'Transfer ownership?',
      text: '{name} is offered ownership of {workspace}, with full control including billing. It moves when they accept, and you stay on the team as a manager.',
    },
    remove: {
      title: 'Remove from team?',
      text: '{name} loses access to {workspace} — its jobs, customers and documents — right away. They need a new invitation to come back.',
    },
    leave: {
      title: 'Leave the team?',
      text: 'You lose access to {workspace} — its jobs, customers and documents. You need a new invitation to come back.',
    },
    revoke: {
      title: 'Revoke the invitation?',
      text: 'The link sent to {email} stops working.',
    },
  },
  done: {
    makeManager: '{name} is now a manager.',
    unsetManager: '{name} is no longer a manager.',
    transferOffered: 'Offered to {name}. Ownership moves when they accept.',
    releaseBrake: '{name} can delete again.',
    remove: '{name} was removed from the team.',
    resend: 'Invitation sent again to {email}. The previous link no longer works.',
    revoke: 'The invitation to {email} was revoked.',
  },
  invitation: {
    expires: 'Expires {date}',
    expired: 'Expired — resend it',
    resend: 'Send the invitation to {email} again',
    revoke: 'Revoke the invitation to {email}',
  },
  roles: {
    title: 'Roles for {name}',
    add: 'Add {role}',
    remove: '✓ {role} — remove',
    only: '✓ {role} — their only role',
    added: '{name} now has the role {role}.',
    removed: '{name} no longer has the role {role}.',
  },
  offer: {
    forYou: {
      title: 'You are offered this team',
      text: '{name} wants to make you the owner of {workspace}. The offer lapses on {date}.',
    },
    accept: 'Accept',
    decline: 'Decline',
    accepted: 'You now own {workspace}.',
    declined: 'Offer declined.',
    pending: {
      title: 'Ownership offered',
      text: 'Waiting for {name} to accept. The offer lapses on {date}.',
    },
    withdraw: 'Withdraw the offer',
    withdrawn: 'Offer withdrawn.',
    banner: {
      text: "You've been offered ownership of {workspace}.",
      action: 'Review',
    },
  },
  loadingMore: 'Loading more',
  showMore: 'Show more',
  invite: {
    title: 'Invite a member',
    intro: 'Enter their email. They get a link, create their account (or sign in), and fill in their own name, phone and photo.',
    email: 'Email address',
    role: {
      title: 'Role',
      text: 'Optional. Without one they join as a member: they see customers and templates, and update the jobs assigned to them.',
      default: 'Member (default)',
      none: 'They join as a member. Create custom roles in Roles & permissions to give them more.',
    },
    submit: 'Send invitation',
    cancel: 'Cancel',
    error: {
      member: 'This person is already on your team.',
      pending: 'Already invited. To send a new link, use resend in the team list.',
      empty: "Can't be blank",
      email: 'Please enter a valid email',
    },
    managerOnly: 'Only the owner or a manager can invite people to this team.',
    personal: 'A personal workspace has no team. Create a business workspace to invite people.',
  },
  stepUp: {
    title: 'Confirm it’s you',
    mfa: 'Enter a code from your authenticator app (or a backup code).',
    password: 'Enter your password to continue.',
    code: 'We’ll send you a code to confirm.',
    codeSent: 'Enter the code we sent to your {channel}.',
    channel: {
      email: 'email',
      sms: 'phone',
    },
    useCode: 'Send me a code instead',
    sendCode: 'Send code',
    confirm: 'Confirm',
    cancel: 'Cancel',
    failed: 'That didn’t confirm it’s you. Try again.',
  },
  planLimit: {
    title: 'Plan limit reached',
    jobs: 'Your plan allows up to {count} open jobs.',
    seats: 'Your plan allows up to {count} members.',
    manager: 'Upgrade the plan to add more, or complete or cancel open jobs.',
    member: 'Ask your workspace owner or an admin to upgrade the plan.',
    notNow: 'Not now',
    seePlans: 'See plans',
    ok: 'Ok',
  },
}
export default team

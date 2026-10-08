// What a refused request says — the mobile app's getErrorMessage, the same
// words: a known reason in the reader's language, else the server's own
// explanation, else a message by status.
const errors = {
  reason: {
    CUSTOMER_ARCHIVED: 'This customer is archived. Unarchive them to add a new job, quote or invoice.',
    CUSTOMER_IN_USE: "This customer is on a job, quote or invoice, so it can't be deleted. Archive it instead.",
    CUSTOMER_NOT_IN_WORKSPACE: 'This customer no longer exists in this workspace. Choose another one.',
    MEMBER_NOT_IN_WORKSPACE: 'Someone you picked is no longer on the team. Choose from the current members.',
    TEMPLATE_NOT_IN_WORKSPACE: 'This job form no longer exists in this workspace. Reopen the screen and try again.',
    JOB_NOT_ASSIGNED: 'Only the people on this job, the person who created it or a manager can change it.',
    JOB_STATUS_CHANGED: 'Someone changed this job at the same time. Check its status and try again.',
    INVALID_STATUS_TRANSITION: "This job can't move to that status from where it is now.",
    WORKSPACE_ARCHIVED: 'This workspace is archived, so nothing can be added or changed. The owner can restore it.',
    WORKSPACE_NOT_ARCHIVED: 'This workspace is not archived.',
    OWNER_REQUIRED: 'Only the workspace owner can do this.',
  },
  status: {
    s400: 'Invalid request. Please check your input.',
    s401: 'Your session has expired. Please sign in again.',
    s403: "You don't have permission to do this.",
    s404: "We couldn't find what you were looking for.",
    s409: 'This conflicts with existing data.',
    s422: 'Please check your input and try again.',
    s429: 'Too many attempts. Please wait a moment and try again.',
    s500: 'Something went wrong on our side. Please try again later.',
    s502: 'The service is temporarily unavailable.',
    s503: 'The service is down for maintenance.',
  },
  network: 'No connection. Check your network and try again.',
  unknown: 'Something went wrong. Please try again.',
}
export default errors

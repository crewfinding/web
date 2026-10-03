// Strings shared across areas: the brand and chrome that belongs to no single
// feature (dialogs, 404, generic states).
const common = {
  appName: 'CrewFinding',
  loading: 'Loading...',
  notFound: {
    title: 'Page not found',
    description: "The page you are looking for doesn't exist or has been moved.",
    backToDashboard: 'Back to Dashboard',
  },
  dialog: {
    close: 'Close dialog',
    goBack: 'Go back',
  },
  input: {
    showPassword: 'Show password',
    hidePassword: 'Hide password',
  },
  select: {
    noOptions: 'No options',
    loading: 'Loading...',
  },
  errors: {
    network: "Can't reach the server. Check your connection and try again.",
    unknown: 'Something went wrong on our end. Please try again.',
  },
}
export default common

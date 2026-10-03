import auth from './auth'
import billing from './billing'
import common from './common'
import home from './home'
import nav from './nav'
import settings from './settings'

// English is the canonical dictionary — its shape defines the key space that
// fr/es must match (each of their domain files is typed against ours).
const en = { common, nav, auth, home, billing, settings }
export default en

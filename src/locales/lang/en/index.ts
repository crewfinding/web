import auth from './auth'
import billing from './billing'
import common from './common'
import home from './home'
import invite from './invite'
import nav from './nav'
import settings from './settings'
import errors from './errors'
import org from './org'
import team from './team'
import roles from './roles'

// English is the canonical dictionary — its shape defines the key space that
// fr/es must match (each of their domain files is typed against ours).
const en = { common, nav, auth, home, billing, settings, invite, errors, org, team, roles }
export default en

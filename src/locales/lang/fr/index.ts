import auth from './auth'
import billing from './billing'
import common from './common'
import home from './home'
import invite from './invite'
import nav from './nav'
import settings from './settings'

// Each domain file is typed against its English counterpart, so this
// aggregate matches the canonical shape by construction.
const fr = { common, nav, auth, home, billing, settings, invite }
export default fr

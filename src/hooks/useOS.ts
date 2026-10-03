export type OS = 'mac' | 'windows' | 'linux' | 'unknown'

function detectOS(): OS {
  const platform = navigator.platform?.toLowerCase() ?? ''
  if (platform.includes('mac') || platform.includes('darwin')) return 'mac'
  if (platform.includes('win')) return 'windows'
  if (platform.includes('linux')) return 'linux'
  return 'unknown'
}

// The OS cannot change during a session, so unlike the other store hooks there
// is nothing to subscribe to; detect once at module load and return a constant.
const os = detectOS()

export function useOS(): OS {
  return os
}

import type enInvite from '../en/invite'

const invite: typeof enInvite = {
  title: 'Unirse a un equipo',
  body: 'Usa el enlace de tu correo de invitación o introduce el código de 6 dígitos que contiene.',
  codeLabel: 'Código de invitación',
  submit: 'Unirse',
  helper: 'El código solo funciona para la dirección de correo a la que se envió la invitación.',
  cancel: 'Cancelar',
  signedOut: {
    body: 'Inicia sesión o crea una cuenta con el correo al que se envió tu invitación.',
    signIn: 'Iniciar sesión',
    register: 'Crear cuenta',
  },
  joining: 'Uniéndote a {workspace}…',
  joiningGeneric: 'Uniéndote…',
  joined: 'Te uniste a {workspace}.',
  alreadyMember: 'Ya formas parte de {workspace}.',
  switchAccount: 'Cerrar sesión y cambiar de cuenta',
  retry: 'Reintentar',
  goHome: 'Ir a CrewFinding',
  openInApp: 'Abrir en la app de CrewFinding',
  errors: {
    expired: 'Esta invitación ha caducado. Pide a {inviter} que envíe una nueva.',
    inviterFallback: 'la persona que te invitó',
    alreadyUsed: 'Esta invitación ya se usó. Si fuiste tú, el equipo está en tu lista de espacios de trabajo.',
    revoked: 'Esta invitación fue cancelada. Pide una nueva al equipo.',
    wrongEmail: 'Esta invitación es para {email}. Inicia sesión con esa dirección para unirte.',
    emailFallback: 'otra dirección de correo',
    roleGone: 'El rol que ofrecía esta invitación ya no existe. Pide al equipo que te invite de nuevo.',
    notFound: 'Ese código no coincide con ninguna invitación. Revisa los 6 dígitos de tu correo.',
    rateLimited: 'Demasiados intentos. Espera un minuto y vuelve a intentarlo.',
    network: 'No pudimos unirte ahora. Revisa tu conexión e inténtalo de nuevo.',
  },
}
export default invite

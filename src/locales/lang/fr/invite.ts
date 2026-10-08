import type enInvite from '../en/invite'

const invite: typeof enInvite = {
  title: 'Rejoindre une équipe',
  body: 'Utilisez le lien de votre courriel d’invitation, ou saisissez le code à 6 chiffres qu’il contient.',
  codeLabel: 'Code d’invitation',
  submit: 'Rejoindre',
  helper: 'Le code ne fonctionne que pour l’adresse courriel à laquelle l’invitation a été envoyée.',
  cancel: 'Annuler',
  signedOut: {
    body: 'Connectez-vous ou créez un compte avec l’adresse courriel à laquelle votre invitation a été envoyée.',
    signIn: 'Se connecter',
    register: 'Créer un compte',
  },
  joining: 'Vous rejoignez {workspace}…',
  joiningGeneric: 'Vous rejoignez l’équipe…',
  joined: 'Vous avez rejoint {workspace}.',
  alreadyMember: 'Vous faites déjà partie de {workspace}.',
  switchAccount: 'Se déconnecter et changer de compte',
  retry: 'Réessayer',
  goHome: 'Aller à CrewFinding',
  openInApp: 'Ouvrir dans l’application CrewFinding',
  errors: {
    expired: 'Cette invitation a expiré. Demandez à {inviter} d’en envoyer une nouvelle.',
    inviterFallback: 'la personne qui vous a invité',
    alreadyUsed: 'Cette invitation a déjà été utilisée. Si c’était vous, l’équipe figure dans votre liste d’espaces de travail.',
    revoked: 'Cette invitation a été annulée. Demandez-en une nouvelle à l’équipe.',
    wrongEmail: 'Cette invitation est destinée à {email}. Connectez-vous avec cette adresse pour rejoindre l’équipe.',
    emailFallback: 'une autre adresse courriel',
    roleGone: 'Le rôle proposé par cette invitation n’existe plus. Demandez à l’équipe de vous inviter à nouveau.',
    notFound: 'Ce code ne correspond à aucune invitation. Vérifiez les 6 chiffres de votre courriel.',
    rateLimited: 'Trop de tentatives. Patientez une minute puis réessayez.',
    network: 'Impossible de rejoindre l’équipe pour le moment. Vérifiez votre connexion et réessayez.',
  },
}
export default invite

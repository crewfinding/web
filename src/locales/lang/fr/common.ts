import type enCommon from '../en/common'

const common: typeof enCommon = {
  appName: 'CrewFinding',
  loading: 'Chargement...',
  notFound: {
    title: 'Page introuvable',
    description: "La page que vous recherchez n’existe pas ou a été déplacée.",
    backToDashboard: 'Retour au tableau de bord',
  },
  dialog: {
    close: 'Fermer la boîte de dialogue',
    goBack: 'Retour',
  },
  input: {
    showPassword: 'Afficher le mot de passe',
    hidePassword: 'Masquer le mot de passe',
  },
  select: {
    noOptions: 'Aucune option',
    loading: 'Chargement...',
  },
  errors: {
    network: 'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.',
    unknown: 'Une erreur est survenue de notre côté. Veuillez réessayer.',
  },
}
export default common

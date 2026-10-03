import type enHome from '../en/home'

const home: typeof enHome = {
  title: 'Bon retour, {name}',
  workspace: 'Espace de travail',
  plan: 'Forfait',
  manageBilling: 'Facturation et forfait',
  settings: 'Paramètres du compte',
  newWorkspace: {
    title: 'Nouvel espace de travail',
    description: 'Un espace de travail a ses propres travaux, clients, équipe et forfait.',
    name: "Nom de l'espace de travail",
    nameRequired: "Donnez un nom à l'espace de travail.",
    create: "Créer l'espace de travail",
    cancel: 'Annuler',
    created: 'Espace de travail créé',
  },
}
export default home

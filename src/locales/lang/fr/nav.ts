import type enNav from '../en/nav'

const nav: typeof enNav = {
  toggleNavigation: 'Afficher ou masquer la navigation',
  workspace: {
    label: 'Espace de travail : {name}',
    personal: 'Espace personnel',
    create: 'Nouvel espace de travail',
    none: "Vous n’avez pas encore d’espace de travail.",
  },
  language: 'Langue : {name}',
  theme: {
    label: 'Thème : {name}',
    system: 'Système',
    dark: 'Sombre',
    light: 'Clair',
  },
  account: {
    label: 'Compte : {name}',
    plan: 'Forfait {plan}',
    settings: 'Paramètres',
    logout: 'Se déconnecter',
  },
  sidebar: {
    categories: {
      main: 'Principal',
    },
    links: {
      dashboard: 'Tableau de bord',
      billing: 'Facturation',
      organization: 'Organisation',
      settings: 'Paramètres',
    },
    language: 'Langue',
    theme: 'Thème',
  },
}
export default nav

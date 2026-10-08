import type enOrg from '../en/org'

const org: typeof enOrg = {
  title: 'Organisation',
  intro: 'Gérez les informations, l’équipe et la facturation de votre organisation.',
  nav: {
    label: 'Sections de l’organisation',
    info: 'Infos commerciales',
    members: 'Membres de l’équipe',
    roles: 'Rôles & permissions',
    billing: 'Facturation & paiement',
  },
  archived: {
    owner: 'Cet espace est archivé : il est en lecture seule. Vous pouvez toujours tout consulter et exporter.',
    member: 'Cet espace est archivé : il est en lecture seule. Seul le propriétaire peut le restaurer.',
    restore: 'Restaurer',
  },
}
export default org

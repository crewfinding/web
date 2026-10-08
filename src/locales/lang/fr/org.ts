import type enOrg from '../en/org'

const org: typeof enOrg = {
  title: 'Organisation',
  // The Organization hub's groups (the mobile app's cards): a title and a one-line description each.
  groups: {
    business: {
      title: 'Informations commerciales',
      description: 'Le profil, les coordonnées, les taxes et les documents de votre entreprise.',
    },
    team: {
      title: 'Équipe',
      description: 'Invitez des personnes et gérez les rôles et ce que chacun peut faire.',
    },
    billing: {
      title: 'Facturation',
      description: 'Votre forfait, votre mode de paiement et vos factures.',
    },
  },
  nav: {
    label: 'Sections de l’organisation',
    info: 'Infos commerciales',
    members: 'Membres de l’équipe',
    roles: 'Rôles & permissions',
    billing: 'Facturation & paiement',
    activity: 'Journal d’activité',
  },
  workspace: {
    title: 'Espace',
    archiveText: 'L’archivage met cet espace en lecture seule pour tout le monde, et son forfait payant prend fin à la fin de la période de facturation en cours. Vous pouvez le restaurer à tout moment.',
    archive: 'Archiver l’espace',
    archiveTitle: 'Archiver {workspace} ?',
    archiveConfirm: 'Tout le monde garde l’accès en lecture, mais personne ne peut ajouter ni modifier de travaux, devis, factures, clients ou membres de l’équipe. Les clients ne peuvent plus répondre aux devis. Le forfait payant n’est pas renouvelé : il prend fin à la fin de la période de facturation en cours. Restaurez l’espace d’ici là pour le conserver.',
    archiveOk: 'Archiver',
    cancel: 'Annuler',
    archiveDone: '{workspace} est archivé.',
    archivedOn: 'Archivé le {date}. Il reste en lecture seule jusqu’à ce que le propriétaire le restaure.',
    archivedUndated: 'Archivé. Il reste en lecture seule jusqu’à ce que le propriétaire le restaure.',
    restore: 'Restaurer l’espace',
    restoreTitle: 'Restaurer {workspace} ?',
    restoreConfirm: 'Tout le monde peut de nouveau y travailler. Si son forfait payant devait prendre fin à cause de l’archivage et que la période de facturation n’est pas terminée, le forfait continue.',
    restoreOk: 'Restaurer',
    restoreDone: '{workspace} est restauré.',
    badge: 'Archivé',
  },
  activity: {
    title: 'Journal d’activité',
    intro: 'Qui a fait quoi dans cet espace, du plus récent au plus ancien. Conservé un an.',
    noAccess: 'Seuls le propriétaire, un gestionnaire ou un rôle ayant la permission Journal d’activité peuvent le consulter.',
    empty: 'Rien n’a encore été enregistré.',
    loading: 'Chargement de l’activité…',
    loadingMore: 'Chargement de la suite',
    showMore: 'Afficher plus',
    retry: 'Réessayer',
    system: 'Système',
    someone: 'Un ancien membre',
    details: 'Détails',
    when: 'Quand',
    who: 'Qui',
    what: 'Quoi',
  },
  archived: {
    owner: 'Cet espace est archivé : il est en lecture seule. Vous pouvez toujours tout consulter et exporter.',
    member: 'Cet espace est archivé : il est en lecture seule. Seul le propriétaire peut le restaurer.',
    restore: 'Restaurer',
  },
}
export default org

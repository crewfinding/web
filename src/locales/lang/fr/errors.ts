import type enErrors from '../en/errors'

const errors: typeof enErrors = {
  reason: {
    CUSTOMER_ARCHIVED: 'Ce client est archivé. Désarchivez-le pour lui ajouter des travaux, une soumission ou une facture.',
    CUSTOMER_IN_USE: 'Ce client figure sur des travaux, une soumission ou une facture : il ne peut pas être supprimé. Archivez-le plutôt.',
    CUSTOMER_NOT_IN_WORKSPACE: 'Ce client n’existe plus dans cet espace de travail. Choisissez-en un autre.',
    MEMBER_NOT_IN_WORKSPACE: 'Une personne choisie ne fait plus partie de l’équipe. Choisissez parmi les membres actuels.',
    TEMPLATE_NOT_IN_WORKSPACE: 'Ce formulaire de travail n’existe plus dans cet espace de travail. Rouvrez l’écran et réessayez.',
    JOB_NOT_ASSIGNED: 'Seules les personnes affectées à ce travail, la personne qui l’a créé ou un responsable peuvent le modifier.',
    JOB_STATUS_CHANGED: 'Quelqu’un a modifié ce travail au même moment. Vérifiez son statut et réessayez.',
    INVALID_STATUS_TRANSITION: 'Ce travail ne peut pas passer à ce statut depuis son statut actuel.',
    WORKSPACE_ARCHIVED: 'Cet espace est archivé : rien ne peut y être ajouté ni modifié. Le propriétaire peut le restaurer.',
    WORKSPACE_NOT_ARCHIVED: 'Cet espace n’est pas archivé.',
    OWNER_REQUIRED: 'Seul le propriétaire de l’espace peut faire cela.',
  },
  status: {
    s400: 'Requête invalide. Vérifiez votre saisie.',
    s401: 'Votre session a expiré. Veuillez vous reconnecter.',
    s403: 'Vous n’avez pas l’autorisation de faire cela.',
    s404: 'Nous n’avons pas trouvé ce que vous cherchez.',
    s409: 'Cela entre en conflit avec des données existantes.',
    s422: 'Vérifiez votre saisie et réessayez.',
    s429: 'Trop de tentatives. Patientez un instant puis réessayez.',
    s500: 'Un problème est survenu de notre côté. Réessayez plus tard.',
    s502: 'Le service est temporairement indisponible.',
    s503: 'Le service est en maintenance.',
  },
  network: 'Pas de connexion. Vérifiez votre réseau et réessayez.',
  unknown: 'Une erreur est survenue. Veuillez réessayer.',
}
export default errors

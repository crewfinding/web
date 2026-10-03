import type enBilling from '../en/billing'

const billing: typeof enBilling = {
  btn: {
    "add-card": {
      text: "Ajouter une carte",
    },
    cancel: {
      text: "Annuler le forfait",
    },
    "fix-payment": {
      text: "Mettre à jour le paiement",
    },
    manage: {
      text: "Gérer la facturation",
    },
    reactivate: {
      text: "Conserver mon forfait",
    },
    "remove-card": {
      text: "Supprimer la carte",
    },
    "start-trial": {
      text: "Commencer l'essai gratuit",
    },
    "subscribe-no-trial": {
      text: "S'abonner sans essai",
    },
    subscribe: {
      text: "S'abonner",
    },
    "update-card": {
      text: "Mettre à jour la carte",
    },
    upgrade: {
      text: "Mettre à niveau",
    },
    "verify-email": {
      text: "Vérifier l'e-mail",
    },
  },
  "canceled-notice": {
    text: "Votre forfait se termine le {date}.",
  },
  card: {
    // The card form (Stripe Payment Element, card only).
    cancel: 'Annuler',
    noPaymentMethod: "La confirmation de la carte n'a pas renvoyé de moyen de paiement.",
    preparing: 'Préparation du formulaire de carte sécurisé…',
    save: 'Enregistrer la carte',
    saveFailed: "Impossible d'enregistrer la carte.",
    saveRetry: "Impossible d'enregistrer la carte. Veuillez réessayer.",
    saved: 'Carte enregistrée',
    saving: 'Enregistrement…',
    setupFailed: "Impossible de démarrer l'ajout de carte. Veuillez réessayer.",
    unavailableAfter: "pour l'activer.",
    unavailableBefore: 'La saisie de carte intégrée est indisponible — définissez',
    current: {
      title: "Forfait actuel",
    },
    invoices: {
      title: "Factures",
    },
    payment: {
      expires: "Expire le {month}/{year}",
      none: "Aucune carte enregistrée.",
      "none-hint": "Votre carte est enregistrée lors de votre premier abonnement.",
      "portal-hint": "Les données de carte vont directement à Stripe — elles ne passent jamais par CrewFinding.",
      removed: "Carte supprimée.",
      title: "Moyen de paiement",
    },
    plans: {
      title: "Forfaits disponibles",
    },
  },
  "checkout-cancelled": {
    text: "Paiement fermé. Rien n'a été facturé.",
  },
  "checkout-success": {
    text: "Paiement reçu — votre forfait sera mis à jour dans un instant.",
  },
  checkout: {
    past_due: "Votre forfait présente un solde impayé. Mettez d'abord à jour votre paiement.",
    plan_change_requires_cancel: "Pour passer à ce forfait, annulez d'abord votre forfait actuel — vous le gardez jusqu'à la fin de la période, puis abonnez-vous au nouveau.",
    plan_unchanged: "Vous avez déjà ce forfait.",
    scheduled_to_cancel: "Votre forfait doit se terminer. Conservez-le avant de changer de forfait.",
  },
  "confirm-cancel": {
    confirm: {
      text: "Annuler le forfait",
    },
    keep: {
      text: "Conserver le forfait",
    },
    text: "Votre espace conserve {plan} jusqu'au {date}, puis passe au forfait gratuit. Vous pouvez vous réabonner à tout moment.",
    title: "Annuler {plan} ?",
  },
  "confirm-remove": {
    text: "Les renouvellements échoueront tant qu'aucune autre carte n'est ajoutée.",
    title: "Supprimer cette carte ?",
  },
  "confirm-upgrade": {
    text: "Le changement s'applique immédiatement. La différence au prorata pour le reste de la période vous sera facturée.",
    title: "Passer au forfait {plan} ?",
  },
  current: {
    badge: "Actuel",
  },
  downgrade: {
    note: "Pour passer à ce forfait, annulez votre forfait actuel ; une fois terminé, abonnez-vous à celui-ci.",
  },
  "ends-on": {
    text: "Se termine le {date}",
  },
  feature: {
    analytics: {
      text: "Statistiques",
    },
    sla: {
      text: "SLA de disponibilité",
    },
    sso: {
      text: "Authentification unique",
    },
    support: {
      text: "Assistance prioritaire",
    },
  },
  header: {
    text: "Facturation & paiement",
  },
  incomplete: {
    text: "Le paiement n'a pas été finalisé — aucun forfait n'est actif.",
  },
  interval: {
    month: {
      text: "Facturé mensuellement",
    },
    monthly: {
      option: "Mensuel",
    },
    year: {
      text: "Facturé annuellement",
    },
    yearly: {
      option: "Annuel",
    },
  },
  invoices: {
    more: "Afficher les factures plus anciennes",
    empty: "Aucune facture pour le moment.",
    "no-link": "Cette facture n'a pas encore de document.",
    status: {
      draft: "Brouillon",
      open: "Ouverte",
      paid: "Payée",
      uncollectible: "Irrécouvrable",
      void: "Annulée",
    },
    view: "Facture du {date}",
  },
  limit: {
    "api-calls": {
      text: "{count} appels API par jour",
    },
    jobs: {
      text: "Jusqu'à {count} travaux ouverts",
    },
  },
  loading: {
    text: "Chargement…",
  },
  "manager-required": {
    text: "Seul le propriétaire de l'espace ou un administrateur peut modifier la facturation.",
  },
  "members-readonly": {
    text: "Seul le propriétaire de l'espace ou un administrateur peut modifier la facturation.",
  },
  "not-now": {
    text: "Plus tard",
  },
  offline: {
    text: "Actualisation impossible — affichage des dernières informations de facturation.",
  },
  paragraph: {
    text: "Gérez votre abonnement et vos méthodes de paiement.",
  },
  "period-end": {
    text: "la fin de la période de facturation",
  },
  "plan-limit": {
    jobs: {
      text: "Votre forfait permet jusqu'à {count} travaux ouverts.",
    },
    manager: {
      text: "Passez à un forfait supérieur pour en ajouter, ou terminez ou annulez des travaux ouverts.",
    },
    member: {
      text: "Demandez au propriétaire de l'espace ou à un administrateur de changer de forfait.",
    },
    "not-now": {
      text: "Plus tard",
    },
    seats: {
      text: "Votre forfait permet jusqu'à {count} membres.",
    },
    "see-plans": {
      text: "Voir les forfaits",
    },
    title: "Limite du forfait atteinte",
  },
  plan: {
    free: {
      label: "Gratuit",
    },
  },
  price: {
    indicative: "(indicatif)",
    "per-month": "{price} / mois",
    "per-year": "{price} / an",
  },
  "reactivate-failed": {
    text: "Ce forfait est déjà terminé. Choisissez un forfait ci-dessous pour vous réabonner.",
  },
  "reactivated-notice": {
    text: "Votre forfait sera renouvelé normalement.",
  },
  "renews-on": {
    text: "Renouvellement le {date}",
  },
  renews: {
    text: "Renouvellement",
  },
  seats: {
    one: "Jusqu'à 1 membre",
    text: "Jusqu'à {count} membres",
  },
  status: {
    active: "Actif",
    canceled: "Annulé",
    ending: "Se termine",
    incomplete: "Incomplet",
    past_due: "Paiement en retard",
    paused: "Suspendu",
    trialing: "Période d'essai",
    unpaid: "Impayé",
  },
  "trial-ends-on": {
    text: "Fin de l'essai le {date}",
  },
  "trial-ends": {
    text: "Essai se termine",
  },
  "trial-gate-unavailable": {
    text: "Impossible de vérifier l'admissibilité à l'essai pour le moment. Réessayez dans un instant.",
  },
  "trial-unavailable": {
    text: "Aucun essai gratuit n'est disponible pour ce compte. Vous pouvez tout de même vous abonner maintenant — la facturation commence aujourd'hui.",
    title: "Aucun essai gratuit disponible",
  },
  "trial-verify": {
    text: "Vérifiez votre adresse e-mail pour commencer un essai gratuit. Nous allons vous envoyer un code.",
    title: "Vérifiez votre e-mail",
  },
  trial: {
    text: "Essai gratuit de {days} jours sur le premier forfait de votre espace",
  },
  upgraded: {
    text: "Passé au forfait {plan}.",
  },
  usage: {
    jobs: {
      text: "Travaux ouverts",
    },
    of: {
      text: "{used} sur {limit}",
    },
    seats: {
      text: "Membres",
    },
    unlimited: {
      text: "{used} · illimité",
    },
  },
  working: {
    text: "En cours…",
  },
}
export default billing

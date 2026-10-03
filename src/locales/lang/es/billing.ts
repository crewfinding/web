import type enBilling from '../en/billing'

const billing: typeof enBilling = {
  btn: {
    "add-card": {
      text: "Añadir tarjeta",
    },
    cancel: {
      text: "Cancelar plan",
    },
    "fix-payment": {
      text: "Actualizar pago",
    },
    manage: {
      text: "Gestionar facturación",
    },
    reactivate: {
      text: "Mantener mi plan",
    },
    "remove-card": {
      text: "Eliminar tarjeta",
    },
    "start-trial": {
      text: "Empezar prueba gratuita",
    },
    "subscribe-no-trial": {
      text: "Suscribirse sin prueba",
    },
    subscribe: {
      text: "Suscribirse",
    },
    "update-card": {
      text: "Actualizar tarjeta",
    },
    upgrade: {
      text: "Actualizar",
    },
    "verify-email": {
      text: "Verificar correo",
    },
  },
  "canceled-notice": {
    text: "Tu plan finaliza el {date}.",
  },
  card: {
    // The card form (Stripe Payment Element, card only).
    cancel: 'Cancelar',
    noPaymentMethod: 'La confirmación de la tarjeta no devolvió un método de pago.',
    preparing: 'Preparando el formulario seguro de tarjeta…',
    save: 'Guardar tarjeta',
    saveFailed: 'No se pudo guardar la tarjeta.',
    saveRetry: 'No se pudo guardar la tarjeta. Inténtalo de nuevo.',
    saved: 'Tarjeta guardada',
    saving: 'Guardando…',
    setupFailed: 'No se pudo iniciar la configuración de la tarjeta. Inténtalo de nuevo.',
    unavailableAfter: 'para habilitarla.',
    unavailableBefore: 'La entrada de tarjeta integrada no está disponible — configura',
    current: {
      title: "Plan actual",
    },
    invoices: {
      title: "Facturas",
    },
    payment: {
      expires: "Vence el {month}/{year}",
      none: "No hay ninguna tarjeta guardada.",
      "none-hint": "Tu tarjeta se guarda cuando te suscribes por primera vez.",
      "portal-hint": "Los datos de la tarjeta van directamente a Stripe; nunca pasan por CrewFinding.",
      removed: "Tarjeta eliminada.",
      title: "Método de pago",
    },
    plans: {
      title: "Planes disponibles",
    },
  },
  "checkout-cancelled": {
    text: "Pago cerrado. No se ha cobrado nada.",
  },
  "checkout-success": {
    text: "Pago recibido — tu plan se actualizará en un momento.",
  },
  checkout: {
    past_due: "Tu plan tiene un saldo pendiente. Actualiza primero tu pago.",
    plan_change_requires_cancel: "Para cambiar a este plan, cancela primero tu plan actual — lo conservas hasta que termine el periodo y luego te suscribes al nuevo.",
    plan_unchanged: "Ya tienes este plan.",
    scheduled_to_cancel: "Tu plan está programado para finalizar. Mantenlo antes de cambiar de plan.",
  },
  "confirm-cancel": {
    confirm: {
      text: "Cancelar plan",
    },
    keep: {
      text: "Mantener plan",
    },
    text: "Tu espacio mantiene {plan} hasta el {date} y luego pasa al plan gratuito. Puedes volver a suscribirte cuando quieras.",
    title: "¿Cancelar {plan}?",
  },
  "confirm-remove": {
    text: "Las renovaciones fallarán hasta que se añada otra tarjeta.",
    title: "¿Eliminar esta tarjeta?",
  },
  "confirm-upgrade": {
    text: "El cambio se aplica ahora. Se te cobrará la diferencia prorrateada por el resto de este periodo.",
    title: "¿Cambiar a {plan}?",
  },
  current: {
    badge: "Actual",
  },
  downgrade: {
    note: "Para cambiar a este plan, cancela tu plan actual; cuando termine, suscríbete a este.",
  },
  "ends-on": {
    text: "Finaliza el {date}",
  },
  feature: {
    analytics: {
      text: "Analíticas",
    },
    sla: {
      text: "SLA de disponibilidad",
    },
    sso: {
      text: "Inicio de sesión único",
    },
    support: {
      text: "Soporte prioritario",
    },
  },
  header: {
    text: "Facturación y pago",
  },
  incomplete: {
    text: "El pago no se completó — no hay ningún plan activo.",
  },
  interval: {
    month: {
      text: "Facturación mensual",
    },
    monthly: {
      option: "Mensual",
    },
    year: {
      text: "Facturación anual",
    },
    yearly: {
      option: "Anual",
    },
  },
  invoices: {
    more: "Mostrar facturas anteriores",
    empty: "Todavía no hay facturas.",
    "no-link": "Esta factura aún no tiene documento.",
    status: {
      draft: "Borrador",
      open: "Abierta",
      paid: "Pagada",
      uncollectible: "Incobrable",
      void: "Anulada",
    },
    view: "Factura del {date}",
  },
  limit: {
    "api-calls": {
      text: "{count} llamadas a la API al día",
    },
    jobs: {
      text: "Hasta {count} trabajos abiertos",
    },
  },
  loading: {
    text: "Cargando…",
  },
  "manager-required": {
    text: "Solo el propietario del espacio o un administrador puede cambiar la facturación.",
  },
  "members-readonly": {
    text: "Solo el propietario del espacio o un administrador puede cambiar la facturación.",
  },
  "not-now": {
    text: "Ahora no",
  },
  offline: {
    text: "No se pudo actualizar — se muestran los últimos datos de facturación.",
  },
  paragraph: {
    text: "Gestiona tu plan de suscripción y métodos de pago.",
  },
  "period-end": {
    text: "el final del periodo de facturación",
  },
  "plan-limit": {
    jobs: {
      text: "Tu plan permite hasta {count} trabajos abiertos.",
    },
    manager: {
      text: "Mejora el plan para añadir más, o completa o cancela trabajos abiertos.",
    },
    member: {
      text: "Pide al propietario del espacio o a un administrador que mejore el plan.",
    },
    "not-now": {
      text: "Ahora no",
    },
    seats: {
      text: "Tu plan permite hasta {count} miembros.",
    },
    "see-plans": {
      text: "Ver planes",
    },
    title: "Límite del plan alcanzado",
  },
  plan: {
    free: {
      label: "Gratis",
    },
  },
  price: {
    indicative: "(orientativo)",
    "per-month": "{price} / mes",
    "per-year": "{price} / año",
  },
  "reactivate-failed": {
    text: "Este plan ya ha terminado. Elige un plan abajo para volver a suscribirte.",
  },
  "reactivated-notice": {
    text: "Tu plan se renovará como de costumbre.",
  },
  "renews-on": {
    text: "Se renueva el {date}",
  },
  renews: {
    text: "Renueva",
  },
  seats: {
    one: "Hasta 1 miembro",
    text: "Hasta {count} miembros",
  },
  status: {
    active: "Activo",
    canceled: "Cancelado",
    ending: "Finaliza",
    incomplete: "Incompleto",
    past_due: "Vencido",
    paused: "Pausado",
    trialing: "Prueba",
    unpaid: "Impago",
  },
  "trial-ends-on": {
    text: "La prueba termina el {date}",
  },
  "trial-ends": {
    text: "Fin de prueba",
  },
  "trial-gate-unavailable": {
    text: "No pudimos comprobar si puedes usar la prueba. Inténtalo de nuevo en un momento.",
  },
  "trial-unavailable": {
    text: "No hay una prueba gratuita disponible para esta cuenta. Aun así puedes suscribirte ahora — la facturación empieza hoy.",
    title: "No hay prueba gratuita disponible",
  },
  "trial-verify": {
    text: "Verifica tu dirección de correo para empezar una prueba gratuita. Te enviaremos un código.",
    title: "Verifica tu correo",
  },
  trial: {
    text: "Prueba gratuita de {days} días en el primer plan de tu espacio",
  },
  upgraded: {
    text: "Actualizado a {plan}.",
  },
  usage: {
    jobs: {
      text: "Trabajos abiertos",
    },
    of: {
      text: "{used} de {limit}",
    },
    seats: {
      text: "Miembros",
    },
    unlimited: {
      text: "{used} · ilimitado",
    },
  },
  working: {
    text: "Procesando…",
  },
}
export default billing

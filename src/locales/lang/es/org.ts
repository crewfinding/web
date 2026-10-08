import type enOrg from '../en/org'

const org: typeof enOrg = {
  title: 'Organización',
  // The Organization hub's groups (the mobile app's cards): a title and a one-line description each.
  groups: {
    business: {
      title: 'Datos empresariales',
      description: 'El perfil, los datos de contacto, los impuestos y los documentos de tu empresa.',
    },
    team: {
      title: 'Equipo',
      description: 'Invita personas y administra los roles y lo que cada quien puede hacer.',
    },
    billing: {
      title: 'Facturación',
      description: 'Tu plan, tu método de pago y tus facturas.',
    },
  },
  nav: {
    label: 'Secciones de la organización',
    info: 'Información empresarial',
    members: 'Miembros del equipo',
    roles: 'Roles y permisos',
    billing: 'Facturación y pago',
    activity: 'Registro de actividad',
  },
  workspace: {
    title: 'Espacio de trabajo',
    archiveText: 'Al archivarlo, este espacio de trabajo queda en solo lectura para todos y su plan de pago termina al final del período de facturación actual. Puedes restaurarlo cuando quieras.',
    archive: 'Archivar espacio de trabajo',
    archiveTitle: '¿Archivar {workspace}?',
    archiveConfirm: 'Todos conservan el acceso de lectura, pero nadie puede agregar ni cambiar trabajos, presupuestos, facturas, clientes ni el equipo. Los clientes ya no pueden responder a los presupuestos. El plan de pago no se renueva: termina al final del período de facturación actual. Restaura el espacio de trabajo antes de esa fecha para conservarlo.',
    archiveOk: 'Archivar',
    cancel: 'Cancelar',
    archiveDone: '{workspace} está archivado.',
    archivedOn: 'Archivado el {date}. Es de solo lectura hasta que el propietario lo restaure.',
    archivedUndated: 'Archivado. Es de solo lectura hasta que el propietario lo restaure.',
    restore: 'Restaurar espacio de trabajo',
    restoreTitle: '¿Restaurar {workspace}?',
    restoreConfirm: 'Todos pueden volver a trabajar en él. Si su plan de pago iba a terminar por el archivado y el período de facturación aún no termina, el plan continúa.',
    restoreOk: 'Restaurar',
    restoreDone: '{workspace} está restaurado.',
    badge: 'Archivado',
  },
  activity: {
    title: 'Registro de actividad',
    intro: 'Quién hizo qué en este espacio de trabajo, del más reciente al más antiguo. Se conserva un año.',
    noAccess: 'Solo el propietario, un gerente o un rol con el permiso Registro de actividad pueden verlo.',
    empty: 'Todavía no hay nada registrado.',
    loading: 'Cargando la actividad…',
    loadingMore: 'Cargando más',
    showMore: 'Mostrar más',
    retry: 'Reintentar',
    system: 'Sistema',
    someone: 'Un exmiembro',
    details: 'Detalles',
    when: 'Cuándo',
    who: 'Quién',
    what: 'Qué',
  },
  archived: {
    owner: 'Este espacio de trabajo está archivado: es de solo lectura. Aún puedes ver y exportar todo.',
    member: 'Este espacio de trabajo está archivado: es de solo lectura. Solo el propietario puede restaurarlo.',
    restore: 'Restaurar',
  },
}
export default org

import type enErrors from '../en/errors'

const errors: typeof enErrors = {
  reason: {
    CUSTOMER_ARCHIVED: 'Este cliente está archivado. Desarchívalo para agregarle un trabajo, presupuesto o factura.',
    CUSTOMER_IN_USE: 'Este cliente está en un trabajo, presupuesto o factura, así que no se puede eliminar. Archívalo en su lugar.',
    CUSTOMER_NOT_IN_WORKSPACE: 'Este cliente ya no existe en este espacio de trabajo. Elige otro.',
    MEMBER_NOT_IN_WORKSPACE: 'Alguien que elegiste ya no está en el equipo. Elige entre los miembros actuales.',
    TEMPLATE_NOT_IN_WORKSPACE: 'Este formulario de trabajo ya no existe en este espacio de trabajo. Vuelve a abrir la pantalla e inténtalo de nuevo.',
    JOB_NOT_ASSIGNED: 'Solo las personas asignadas a este trabajo, quien lo creó o un responsable pueden cambiarlo.',
    JOB_STATUS_CHANGED: 'Alguien cambió este trabajo al mismo tiempo. Revisa su estado e inténtalo de nuevo.',
    INVALID_STATUS_TRANSITION: 'Este trabajo no puede pasar a ese estado desde el actual.',
    WORKSPACE_ARCHIVED: 'Este espacio de trabajo está archivado, así que no se puede agregar ni cambiar nada. El propietario puede restaurarlo.',
    WORKSPACE_NOT_ARCHIVED: 'Este espacio de trabajo no está archivado.',
    OWNER_REQUIRED: 'Solo el propietario del espacio de trabajo puede hacer esto.',
  },
  status: {
    s400: 'Solicitud no válida. Revisa los datos.',
    s401: 'Tu sesión expiró. Vuelve a iniciar sesión.',
    s403: 'No tienes permiso para hacer esto.',
    s404: 'No encontramos lo que buscabas.',
    s409: 'Esto entra en conflicto con datos existentes.',
    s422: 'Revisa los datos e inténtalo de nuevo.',
    s429: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
    s500: 'Algo salió mal por nuestra parte. Inténtalo más tarde.',
    s502: 'El servicio no está disponible temporalmente.',
    s503: 'El servicio está en mantenimiento.',
  },
  network: 'Sin conexión. Revisa tu red e inténtalo de nuevo.',
  unknown: 'Algo salió mal. Inténtalo de nuevo.',
}
export default errors

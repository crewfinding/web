import type enCommon from '../en/common'

const common: typeof enCommon = {
  appName: 'CrewFinding',
  loading: 'Cargando...',
  notFound: {
    title: 'Página no encontrada',
    description: 'La página que buscas no existe o se ha movido.',
    backToDashboard: 'Volver al panel de control',
  },
  dialog: {
    close: 'Cerrar el diálogo',
    goBack: 'Volver',
  },
  input: {
    showPassword: 'Mostrar contraseña',
    hidePassword: 'Ocultar contraseña',
  },
  select: {
    noOptions: 'Sin opciones',
    loading: 'Cargando...',
  },
  errors: {
    network: 'No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.',
    unknown: 'Algo ha salido mal por nuestra parte. Inténtalo de nuevo.',
  },
}
export default common

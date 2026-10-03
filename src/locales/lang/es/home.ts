import type enHome from '../en/home'

const home: typeof enHome = {
  title: 'Hola de nuevo, {name}',
  workspace: 'Espacio de trabajo',
  plan: 'Plan',
  manageBilling: 'Facturación y plan',
  settings: 'Ajustes de la cuenta',
  newWorkspace: {
    title: 'Nuevo espacio de trabajo',
    description: 'Un espacio de trabajo tiene sus propios trabajos, clientes, equipo y plan.',
    name: 'Nombre del espacio de trabajo',
    nameRequired: 'Ponle un nombre al espacio de trabajo.',
    create: 'Crear espacio de trabajo',
    cancel: 'Cancelar',
    created: 'Espacio de trabajo creado',
  },
}
export default home

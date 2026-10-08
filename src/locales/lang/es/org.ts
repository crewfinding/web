import type enOrg from '../en/org'

const org: typeof enOrg = {
  title: 'Organización',
  intro: 'Gestiona los detalles de tu organización, equipo y facturación.',
  nav: {
    label: 'Secciones de la organización',
    info: 'Información empresarial',
    members: 'Miembros del equipo',
    roles: 'Roles y permisos',
    billing: 'Facturación y pago',
  },
  archived: {
    owner: 'Este espacio de trabajo está archivado: es de solo lectura. Aún puedes ver y exportar todo.',
    member: 'Este espacio de trabajo está archivado: es de solo lectura. Solo el propietario puede restaurarlo.',
    restore: 'Restaurar',
  },
}
export default org

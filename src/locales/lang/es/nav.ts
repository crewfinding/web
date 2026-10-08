import type enNav from '../en/nav'

const nav: typeof enNav = {
  toggleNavigation: 'Mostrar u ocultar la navegación',
  workspace: {
    label: 'Espacio de trabajo: {name}',
    personal: 'Espacio personal',
    create: 'Nuevo espacio de trabajo',
    none: 'Todavía no tienes un espacio de trabajo.',
  },
  language: 'Idioma: {name}',
  theme: {
    label: 'Tema: {name}',
    system: 'Sistema',
    dark: 'Oscuro',
    light: 'Claro',
  },
  account: {
    label: 'Cuenta: {name}',
    plan: 'Plan {plan}',
    settings: 'Configuración',
    logout: 'Cerrar sesión',
  },
  sidebar: {
    categories: {
      main: 'Principal',
    },
    links: {
      dashboard: 'Panel de control',
      billing: 'Facturación',
      organization: 'Organización',
      settings: 'Configuración',
    },
    language: 'Idioma',
    theme: 'Tema',
  },
}
export default nav

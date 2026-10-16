import type { I18nProvider } from '@refinedev/core';

const es: Record<string, string> = {
  'buttons.create': 'Agregar',
  'buttons.save': 'Guardar',
  'buttons.edit': 'Editar',
  'buttons.show': 'Ver',
  'buttons.list': 'Volver a la lista',
  'buttons.clone': 'Duplicar',
  'buttons.delete': 'Eliminar',
  'buttons.refresh': 'Actualizar',
  'buttons.cancel': 'Cancelar',
  'buttons.confirm': '¿Seguro?',
  'buttons.logout': 'Cerrar sesión',
  'buttons.export': 'Exportar',
  'buttons.import': 'Importar',
  'buttons.notAccessTitle': 'No tienes permiso para esta acción',

  'notifications.success': 'Listo',
  'notifications.error': 'Ocurrió un error (código {{statusCode}})',
  'notifications.createSuccess': 'Se agregó el registro.',
  'notifications.createError': 'No se pudo agregar el registro (código {{statusCode}}).',
  'notifications.editSuccess': 'Se guardaron los cambios.',
  'notifications.editError': 'No se pudieron guardar los cambios (código {{statusCode}}).',
  'notifications.deleteSuccess': 'Se eliminó el registro.',
  'notifications.deleteError': 'No se pudo eliminar el registro (código {{statusCode}}).',
  'notifications.undoable': 'Cambio aplicado. Si fue un error, puedes deshacerlo ahora.',

  warnWhenUnsavedChanges: 'Hay cambios sin guardar. ¿Quieres salir de todos modos?',
  'pages.error.info': 'Esta página no existe.',
  'pages.error.backHome': 'Volver al inicio',
  'documentTitle.default': 'Nimzo',
  'documentTitle.suffix': ' | Nimzo',
};

function interpolate(text: string, options?: Record<string, unknown>) {
  if (!options) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(options[name] ?? ''));
}

export const i18nProvider: I18nProvider = {
  translate: (key: string, options?: unknown, defaultMessage?: string) => {
    const text = es[key];
    if (text) return interpolate(text, options as Record<string, unknown>);
    if (typeof options === 'string') return options;
    return defaultMessage ?? key;
  },
  changeLocale: async () => {},
  getLocale: () => 'es',
};

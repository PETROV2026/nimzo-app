export type DatabaseErrorLike = {
  code?: string | null;
  message?: string | null;
};

const fallback = 'No se pudo completar la acción. Intenta de nuevo.';

const businessRules: Array<[string, string]> = [
  [
    'catalog rows must belong to an active technician',
    'El técnico elegido está inactivo. Elige un técnico activo.',
  ],
  [
    'a catalog row must belong to the same technician as its parent',
    'El registro debe pertenecer al mismo técnico que su cliente o sucursal.',
  ],
  [
    'the technician of a catalog row cannot change',
    'No se puede cambiar el técnico de un registro que ya existe.',
  ],
  [
    'the code of a service form cannot change',
    'La clave interna de un formato no se puede cambiar.',
  ],
  [
    'the system must belong to the branch of the package',
    'El sistema debe pertenecer a la misma sucursal que el paquete.',
  ],
  ['sent reports cannot be', 'Los reportes enviados no se pueden modificar ni eliminar.'],
  ['only administrators can', 'No tienes permiso para hacer esta acción.'],
];

export function describeDatabaseError(error: DatabaseErrorLike | null | undefined): string {
  const code = error?.code ?? '';
  const message = (error?.message ?? '').toLowerCase();

  if (message.includes('failed to fetch') || message.includes('network request failed')) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión a internet.';
  }
  if (code === '23505') return 'Ya existe un registro con esos datos. Revisa que no esté repetido.';
  if (code === '23503') {
    return 'No se puede completar porque este registro está relacionado con otros datos.';
  }
  if (code.startsWith('22') || code.startsWith('23')) {
    return 'Algún dato no es válido. Revisa el formulario.';
  }
  if (code === '42501') return 'No tienes permiso para hacer esta acción.';
  if (code === 'P0001') {
    const rule = businessRules.find(([raw]) => message.includes(raw));
    return rule ? rule[1] : 'Esta acción no está permitida por las reglas del sistema.';
  }
  return fallback;
}

const accessNote =
  'Para volver a acceder necesitarás tu correo, tu contraseña y conexión a internet.';

export function signOutNote({ pending, rejected }: { pending: string; rejected: string }) {
  return [
    pending
      ? `Tienes ${pending} sin sincronizar en este dispositivo. La sincronización continuará cuando vuelvas a iniciar sesión con esta cuenta.`
      : null,
    rejected
      ? `El servidor rechazó cambios en ${rejected}. Siguen guardados en este dispositivo, pero debes revisar sus datos para sincronizar.`
      : null,
    accessNote,
  ]
    .filter((part) => part !== null)
    .join(' ');
}

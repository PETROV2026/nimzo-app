import { EmptyState } from '@/components/empty-state';

export default function ServicesScreen() {
  return (
    <EmptyState
      icon="clipboard-outline"
      title="Aún no tienes servicios"
      description="Crea un servicio para una sucursal de tus clientes y llena sus formatos, incluso sin conexión."
    />
  );
}

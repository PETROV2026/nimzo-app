import { EmptyState } from '@/components/empty-state';

export default function ClientsScreen() {
  return (
    <EmptyState
      icon="people-outline"
      title="Aún no tienes clientes descargados"
      description="Cuando sincronices, aquí verás los clientes, sus sucursales y sus sistemas."
    />
  );
}

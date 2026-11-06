import { EmptyState } from '@/components/empty-state';

export default function ClientsScreen() {
  return (
    <EmptyState
      icon="people-outline"
      title="Aún no tienes clientes"
      description="Agrega tus clientes con sus sucursales y sistemas. Se guardan en esta tablet y se sincronizan cuando tengas internet."
    />
  );
}

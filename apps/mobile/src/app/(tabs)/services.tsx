import { EmptyState } from '@/components/empty-state';

export default function ServicesScreen() {
  return (
    <EmptyState
      icon="assignment"
      title="Aún no tienes servicios asignados"
      description="Cuando el administrador te asigne una visita, aparecerá aquí con sus formatos."
    />
  );
}

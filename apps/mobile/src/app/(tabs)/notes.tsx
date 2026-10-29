import { EmptyState } from '@/components/empty-state';

export default function NotesScreen() {
  return (
    <EmptyState
      icon="event-note"
      title="Aún no tienes notas"
      description="Aquí podrás apuntar pendientes, recordatorios y datos de tus visitas."
    />
  );
}

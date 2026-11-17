import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { EmptyState } from '@/components/empty-state';
import { type Segment, SegmentedControl } from '@/components/segmented-control';

type Section = 'new' | 'active' | 'pending' | 'history';

const sections: (Segment<Section> & { title: string; description: string })[] = [
  {
    value: 'new',
    label: 'Nuevo servicio',
    icon: 'add-circle',
    title: '¿En qué podemos ayudarte hoy?',
    description: 'Elige el servicio que necesitas.',
  },
  {
    value: 'active',
    label: 'Activos',
    icon: 'play-circle-outline',
    title: 'Servicios activos',
    description: 'Retoma los servicios que tienes en progreso.',
  },
  {
    value: 'pending',
    label: 'Pendientes',
    icon: 'hourglass-outline',
    title: 'Servicios pendientes',
    description: 'Ya los terminaste; solo falta enviarlos al cliente.',
  },
  {
    value: 'history',
    label: 'Historial',
    icon: 'time-outline',
    title: 'Historial de servicios',
    description: 'Consulta y descarga los reportes que ya enviaste.',
  },
];

export default function ServicesScreen() {
  const [current, setCurrent] = useState<Section>('new');
  const section = sections.find((item) => item.value === current) ?? sections[0];

  return (
    <ScrollView contentContainerClassName="flex-grow gap-5 p-6">
      <View className="gap-1">
        <Text className="font-sans-bold text-2xl text-foreground">{section.title}</Text>
        <Text className="font-sans text-base text-muted">{section.description}</Text>
      </View>
      <SegmentedControl segments={sections} value={current} onChange={setCurrent} />
      <EmptyState
        icon="clipboard-outline"
        title="Aún no tienes servicios"
        description="Crea un servicio para la sucursal de uno de tus clientes y llena sus formatos aquí, aun sin internet."
      />
    </ScrollView>
  );
}

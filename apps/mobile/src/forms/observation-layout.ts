import type { FormField } from '@nimzo/shared';
import type { IconName } from '@/components/icon';

type Block = { title: string; icon: IconName; rows: string[][] };

const blocks: Block[] = [
  { title: 'Dónde está', icon: 'location-outline', rows: [['system', 'component', 'location']] },
  {
    title: 'Hallazgo',
    icon: 'alert-circle-outline',
    rows: [['classification'], ['observation', 'impact']],
  },
  {
    title: 'Seguimiento',
    icon: 'construct-outline',
    rows: [['corrective_action'], ['status', 'closed_on', 'quote_required']],
  },
  { title: 'Evidencia', icon: 'camera-outline', rows: [['photos']] },
];

export type ObservationBlock = { title: string; icon: IconName; rows: FormField[][] };

export function arrangeObservation(fields: FormField[]): ObservationBlock[] {
  const byId = new Map(fields.map((field) => [field.id, field]));
  const placed = new Set(blocks.flatMap((block) => block.rows.flat()));
  const arranged = blocks.map((block) => ({
    title: block.title,
    icon: block.icon,
    rows: block.rows
      .map((row) => row.flatMap((id) => byId.get(id) ?? []))
      .filter((row) => row.length > 0),
  }));
  const others = fields.filter((field) => !placed.has(field.id));
  if (others.length > 0) {
    arranged.push({
      title: 'Otros datos',
      icon: 'ellipsis-horizontal-circle-outline',
      rows: others.map((field) => [field]),
    });
  }
  return arranged.filter((block) => block.rows.length > 0);
}

export function observationSummary(row: Record<string, unknown>) {
  return ['system', 'component', 'location']
    .map((id) => row[id])
    .filter((value): value is string => typeof value === 'string' && value.trim() !== '')
    .map((value) => value.trim())
    .join(', ');
}

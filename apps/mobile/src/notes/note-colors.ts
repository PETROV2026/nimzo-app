import type { NoteColor } from '@/notes/notes-db';

export const noteColors: { value: NoteColor; label: string; className: string }[] = [
  { value: 'none', label: 'Sin color', className: 'bg-border' },
  { value: 'teal', label: 'Verde azulado', className: 'bg-primary' },
  { value: 'yellow', label: 'Amarillo', className: 'bg-accent' },
  { value: 'orange', label: 'Naranja', className: 'bg-danger' },
  { value: 'gray', label: 'Gris', className: 'bg-muted' },
];

export function noteColorClass(color: NoteColor) {
  return noteColors.find((option) => option.value === color)?.className ?? 'bg-border';
}

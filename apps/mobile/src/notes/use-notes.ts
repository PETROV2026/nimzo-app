import { matchesSearch } from '@nimzo/shared';
import { useSyncExternalStore } from 'react';
import { notesStore, type Note } from '@/notes/notes-db';

function searchableText(note: Note) {
  return [
    note.title,
    note.body,
    note.clientName ?? '',
    ...note.checklist.map((item) => item.text),
  ].join('\n');
}

export function useNotes(technicianId: string, search: string) {
  const notes = useSyncExternalStore(notesStore.subscribe, () => notesStore.snapshot(technicianId));
  return search.trim()
    ? notes.filter((note) => matchesSearch(searchableText(note), search))
    : notes;
}

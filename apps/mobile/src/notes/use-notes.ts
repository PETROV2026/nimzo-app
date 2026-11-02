import { toSearchText } from '@nimzo/shared';
import { useSyncExternalStore } from 'react';
import { notesSnapshot, subscribeNotes, type Note } from '@/notes/notes-db';

function searchableText(note: Note) {
  return toSearchText(
    [note.title, note.body, note.clientName ?? '', ...note.checklist.map((item) => item.text)].join(
      ' ',
    ),
  );
}

export function useNotes(technicianId: string, search: string) {
  const notes = useSyncExternalStore(subscribeNotes, () => notesSnapshot(technicianId));
  const term = toSearchText(search.trim());
  return term ? notes.filter((note) => searchableText(note).includes(term)) : notes;
}

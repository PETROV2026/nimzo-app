import { toSearchText } from '@nimzo/shared';
import { useSyncExternalStore } from 'react';
import { listNotes, notesVersion, subscribeNotes, type Note } from '@/notes/notes-db';

function searchableText(note: Note) {
  return toSearchText(
    [note.title, note.body, note.clientName ?? '', ...note.checklist.map((item) => item.text)].join(
      ' ',
    ),
  );
}

export function useNotes(technicianId: string, search: string) {
  useSyncExternalStore(subscribeNotes, notesVersion);
  const notes = listNotes(technicianId);
  const term = toSearchText(search.trim());
  return term ? notes.filter((note) => searchableText(note).includes(term)) : notes;
}

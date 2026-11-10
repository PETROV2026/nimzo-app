import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Modal, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '@/auth/session-provider';
import { AddButton } from '@/components/add-button';
import { EmptyState } from '@/components/empty-state';
import { NoteCard } from '@/components/notes/note-card';
import { NoteEditor } from '@/components/notes/note-editor';
import { SearchField } from '@/components/search-field';
import { dateGroup, dateGroups } from '@/notes/format';
import { createNote, getNote, type Note } from '@/notes/notes-db';
import { useNotes } from '@/notes/use-notes';

type ListItem =
  { type: 'header'; key: string; label: string } | { type: 'note'; key: string; note: Note };

function buildList(notes: Note[]): ListItem[] {
  const now = new Date();
  const pinned: Note[] = [];
  const byGroup = new Map<string, Note[]>();
  for (const note of notes) {
    if (note.pinned) {
      pinned.push(note);
      continue;
    }
    const group = dateGroup(note.updatedAt, now);
    byGroup.set(group, [...(byGroup.get(group) ?? []), note]);
  }
  const sections: [string, string, Note[]][] = [
    ['pinned', 'Fijadas', pinned],
    ...dateGroups.map((group): [string, string, Note[]] => [
      group,
      group,
      byGroup.get(group) ?? [],
    ]),
  ];
  return sections.flatMap(([key, label, inSection]) =>
    inSection.length === 0
      ? []
      : [
          { type: 'header' as const, key, label },
          ...inSection.map((note) => ({ type: 'note' as const, key: note.id, note })),
        ],
  );
}

export default function NotesScreen() {
  const session = useSession();
  const technicianId = session.status === 'signed-in' ? session.session.user.id : '';
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { noteId, openedAt } = useLocalSearchParams<{ noteId?: string; openedAt?: string }>();
  const notes = useNotes(technicianId, search);

  const openRequest = noteId ? `${noteId}:${openedAt ?? ''}` : undefined;
  const [handledRequest, setHandledRequest] = useState<string | undefined>(undefined);
  if (noteId && openRequest !== handledRequest) {
    setHandledRequest(openRequest);
    if (technicianId && getNote(noteId, technicianId)) setSelectedId(noteId);
  }

  if (!technicianId) return null;

  function handleNew() {
    const note = createNote(technicianId);
    setSearch('');
    setSelectedId(note.id);
  }

  const searching = search.trim() !== '';
  const hasNotes = notes.length > 0 || searching;

  const list = (
    <View className="flex-1">
      {hasNotes ? (
        <View className="flex-row items-center gap-3 px-4 pb-3 pt-4">
          <View className="flex-1">
            <SearchField
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar en tus notas"
            />
          </View>
        </View>
      ) : null}
      {hasNotes ? (
        <FlatList
          data={buildList(notes)}
          keyExtractor={(item) => item.key}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-3 px-4 pb-28"
          ListEmptyComponent={
            <Text className="px-2 py-10 text-center font-sans text-base text-muted">
              Ninguna nota coincide con “{search.trim()}”.
            </Text>
          }
          renderItem={({ item }) =>
            item.type === 'header' ? (
              <Text
                accessibilityRole="header"
                className="px-1 pt-2 font-sans-semibold text-base text-muted"
              >
                {item.label}
              </Text>
            ) : (
              <NoteCard
                search={search}
                note={item.note}
                onPress={() => setSelectedId(item.note.id)}
              />
            )
          }
        />
      ) : (
        <EmptyState
          icon="document-text-outline"
          title="Aún no tienes notas"
          description="Apunta pendientes, material que falta llevar o datos de tus visitas. Toca + para crear la primera; se guarda en esta tablet, aun sin internet."
        />
      )}
      <AddButton label="Nueva nota" onPress={handleNew} />
    </View>
  );

  return (
    <View className="flex-1 bg-canvas">
      {list}
      {selectedId ? (
        <Modal
          animationType="slide"
          statusBarTranslucent
          navigationBarTranslucent
          onRequestClose={() => setSelectedId(null)}
        >
          <View
            className="flex-1 bg-background"
            style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
          >
            <NoteEditor
              key={selectedId}
              noteId={selectedId}
              technicianId={technicianId}
              onClose={() => setSelectedId(null)}
            />
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '@/auth/session-provider';
import { EmptyState } from '@/components/empty-state';
import { NoteCard } from '@/components/notes/note-card';
import { NoteEditor } from '@/components/notes/note-editor';
import { dateGroup, dateGroups } from '@/notes/format';
import { createNote, type Note } from '@/notes/notes-db';
import { useNotes } from '@/notes/use-notes';
import { colors } from '@/theme';

const splitMinWidth = 900;
const savedNoticeMs = 2500;

type ListItem =
  { type: 'header'; key: string; label: string } | { type: 'note'; key: string; note: Note };

function buildList(notes: Note[]): ListItem[] {
  const items: ListItem[] = [];
  const pinned = notes.filter((note) => note.pinned);
  if (pinned.length > 0) {
    items.push({ type: 'header', key: 'pinned', label: 'Fijadas' });
    items.push(...pinned.map((note) => ({ type: 'note' as const, key: note.id, note })));
  }
  const others = notes.filter((note) => !note.pinned);
  for (const group of dateGroups) {
    const inGroup = others.filter((note) => dateGroup(note.updatedAt) === group);
    if (inGroup.length === 0) continue;
    items.push({ type: 'header', key: group, label: group });
    items.push(...inGroup.map((note) => ({ type: 'note' as const, key: note.id, note })));
  }
  return items;
}

export default function NotesScreen() {
  const session = useSession();
  const technicianId = session.status === 'signed-in' ? session.session.user.id : '';
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const split = width > height && width >= splitMinWidth;
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const { noteId, openedAt } = useLocalSearchParams<{ noteId?: string; openedAt?: string }>();
  const notes = useNotes(technicianId, search);

  const openRequest = noteId ? `${noteId}:${openedAt ?? ''}` : undefined;
  const [handledRequest, setHandledRequest] = useState<string | undefined>(undefined);
  if (noteId && openRequest !== handledRequest) {
    setHandledRequest(openRequest);
    setSelectedId(noteId);
  }

  useEffect(() => {
    if (!savedNotice) return;
    const timer = setTimeout(() => setSavedNotice(false), savedNoticeMs);
    return () => clearTimeout(timer);
  }, [savedNotice]);

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
          <View className="min-h-14 flex-1 flex-row items-center gap-2 rounded-xl border-2 border-border bg-background px-3">
            <MaterialIcons name="search" size={24} color={colors.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar en tus notas"
              placeholderTextColor={colors.placeholder}
              accessibilityLabel="Buscar en tus notas"
              returnKeyType="search"
              className="min-h-14 flex-1 font-sans text-lg text-foreground"
            />
            {searching ? (
              <Pressable
                onPress={() => setSearch('')}
                accessibilityRole="button"
                accessibilityLabel="Borrar búsqueda"
                className="-mr-2 min-h-14 min-w-14 items-center justify-center"
              >
                <MaterialIcons name="close" size={22} color={colors.muted} />
              </Pressable>
            ) : null}
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
                selected={split && item.note.id === selectedId}
                onPress={() => setSelectedId(item.note.id)}
              />
            )
          }
        />
      ) : (
        <EmptyState
          icon="event-note"
          title="Aún no tienes notas"
          description="Apunta pendientes, material que falta llevar o datos de tus visitas. Toca + para crear la primera; se guarda en esta tablet, aun sin internet."
        />
      )}
      <Pressable
        onPress={handleNew}
        accessibilityRole="button"
        accessibilityLabel="Nueva nota"
        className={`absolute items-center justify-center rounded-full bg-primary-strong active:opacity-80 ${split ? 'bottom-5 right-5 h-14 w-14' : 'bottom-6 right-6 h-[72px] w-[72px]'}`}
        style={{ elevation: 6 }}
      >
        <MaterialIcons name="add" size={split ? 28 : 36} color={colors['on-primary']} />
      </Pressable>
    </View>
  );

  if (split) {
    return (
      <View className="flex-1 flex-row bg-canvas">
        <View className="w-[400px] border-r border-border">{list}</View>
        <View className="flex-1">
          {selectedId ? (
            <NoteEditor
              key={selectedId}
              noteId={selectedId}
              showBack={false}
              onClose={() => setSelectedId(null)}
            />
          ) : (
            <View className="flex-1 items-center justify-center gap-3 p-8">
              <MaterialIcons name="edit-note" size={56} color={colors['border-strong']} />
              <Text className="text-center font-sans text-lg text-muted">
                Elige una nota de la lista o crea una nueva.
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }

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
              showBack
              onClose={() => setSelectedId(null)}
              onSaved={() => setSavedNotice(true)}
            />
          </View>
        </Modal>
      ) : null}
      {savedNotice ? (
        <View
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          className="absolute bottom-8 left-4 right-28 flex-row items-center gap-3 self-start rounded-xl bg-foreground px-4 py-3"
        >
          <MaterialIcons name="check-circle" size={22} color={colors.primary} />
          <Text className="font-sans-medium text-base text-background">Nota guardada</Text>
        </View>
      ) : null}
    </View>
  );
}

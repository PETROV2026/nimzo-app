import { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { excerptAround, findMatches } from '@nimzo/shared';
import { HighlightedText } from '@/components/highlighted-text';
import { formatReminder, formatUpdated, isOverdue } from '@/notes/format';
import { noteColorClass } from '@/notes/note-colors';
import type { Note } from '@/notes/notes-db';
import { colors } from '@/theme';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

function noteHeadline(note: Note) {
  return note.title.trim() || note.body.trim().split('\n')[0] || 'Nota sin título';
}

function Chip({
  icon,
  label,
  tone = 'default',
  term = '',
}: {
  icon: IconName;
  label: string;
  tone?: 'default' | 'alert';
  term?: string;
}) {
  return (
    <View
      className={`flex-row items-center gap-1 rounded-full px-2.5 py-1 ${tone === 'alert' ? 'bg-danger/10' : 'bg-surface'}`}
    >
      <MaterialIcons
        name={icon}
        size={16}
        color={tone === 'alert' ? colors['danger-strong'] : colors.muted}
      />
      <HighlightedText
        text={label}
        term={term}
        numberOfLines={1}
        className={`max-w-[180px] font-sans-medium text-sm ${tone === 'alert' ? 'text-danger-strong' : 'text-muted'}`}
      />
    </View>
  );
}

function searchSnippet(note: Note, snippet: string, term: string) {
  if (!term.trim()) return snippet;
  if (findMatches(snippet, term).length > 0) return excerptAround(snippet, term);
  const item = note.checklist.find((entry) => findMatches(entry.text, term).length > 0);
  return item ? `Pendiente: ${item.text}` : snippet;
}

type NoteCardProps = {
  note: Note;
  selected: boolean;
  search: string;
  onPress: () => void;
};

export function NoteCard({ note, selected, search, onPress }: NoteCardProps) {
  const headline = noteHeadline(note);
  const snippet = searchSnippet(
    note,
    note.title.trim() ? note.body.trim() : note.body.trim().split('\n').slice(1).join(' ').trim(),
    search,
  );
  const items = note.checklist.filter((item) => item.text.trim() !== '');
  const done = items.filter((item) => item.done).length;
  const overdue = isOverdue(note.remindAt);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Nota: ${headline}`}
      accessibilityState={{ selected }}
      className={`min-h-[88px] flex-row overflow-hidden rounded-2xl border-2 bg-background active:bg-surface ${selected ? 'border-primary-strong' : 'border-transparent'}`}
    >
      <View className={`w-2 ${noteColorClass(note.color)}`} />
      <View className="flex-1 gap-1.5 px-4 py-3">
        <View className="flex-row items-center gap-2">
          {note.pinned ? (
            <MaterialIcons name="push-pin" size={18} color={colors['primary-strong']} />
          ) : null}
          <HighlightedText
            text={headline}
            term={search}
            numberOfLines={1}
            className="flex-1 font-sans-semibold text-lg text-foreground"
          />
          <Text className="font-sans text-sm text-muted">{formatUpdated(note.updatedAt)}</Text>
        </View>
        {snippet ? (
          <HighlightedText
            text={snippet}
            term={search}
            numberOfLines={2}
            className="font-sans text-base leading-6 text-muted"
          />
        ) : null}
        {note.clientName || items.length > 0 || note.remindAt ? (
          <View className="flex-row flex-wrap gap-2 pt-0.5">
            {note.clientName ? (
              <Chip icon="business" label={note.clientName} term={search} />
            ) : null}
            {items.length > 0 ? <Chip icon="check-box" label={`${done}/${items.length}`} /> : null}
            {note.remindAt ? (
              <Chip
                icon={overdue ? 'alarm-off' : 'alarm'}
                label={formatReminder(note.remindAt)}
                tone={overdue ? 'alert' : 'default'}
              />
            ) : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

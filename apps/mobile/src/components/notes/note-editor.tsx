import { MaterialIcons } from '@expo/vector-icons';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ClientPicker } from '@/components/notes/client-picker';
import { formatReminder, formatSaved, isOverdue } from '@/notes/format';
import { noteColors } from '@/notes/note-colors';
import {
  deleteNote,
  getNote,
  isEmptyNote,
  newChecklistItem,
  saveNote,
  type ChecklistItem,
  type Note,
} from '@/notes/notes-db';
import { cancelReminder, scheduleReminder } from '@/notes/reminders';
import { colors } from '@/theme';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

const autosaveMs = 400;
const savedFeedbackMs = 2000;

type NoteEditorProps = {
  noteId: string;
  onClose: () => void;
  onSaved?: () => void;
  showBack: boolean;
};

export function NoteEditor({ noteId, onClose, onSaved, showBack }: NoteEditorProps) {
  const [note, setNote] = useState<Note | null>(() => getNote(noteId));
  const [savedAt, setSavedAt] = useState<string | null>(() => note?.updatedAt ?? null);
  const [pending, setPending] = useState(false);
  const [focusItemId, setFocusItemId] = useState<string | null>(null);
  const [pickingClient, setPickingClient] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const latest = useRef(note);
  const dirty = useRef(false);

  useEffect(() => {
    latest.current = note;
    if (!note || !dirty.current) return;
    const timer = setTimeout(() => {
      saveNote(note);
      dirty.current = false;
      setPending(false);
      setSavedAt(nowIso());
    }, autosaveMs);
    return () => clearTimeout(timer);
  }, [note]);

  useEffect(
    () => () => {
      const current = latest.current;
      if (!current) return;
      if (isEmptyNote(current)) {
        void cancelReminder(current.notificationId);
        deleteNote(current.id);
      } else if (dirty.current) {
        saveNote(current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!justSaved) return;
    const timer = setTimeout(() => setJustSaved(false), savedFeedbackMs);
    return () => clearTimeout(timer);
  }, [justSaved]);

  if (!note) return null;

  function update(changes: Partial<Note>) {
    dirty.current = true;
    setPending(true);
    setJustSaved(false);
    setNote((previous) => (previous ? { ...previous, ...changes } : previous));
  }

  function updateItem(id: string, changes: Partial<ChecklistItem>) {
    if (!note) return;
    update({
      checklist: note.checklist.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    });
  }

  function addItem(afterId?: string) {
    if (!note) return;
    const item = newChecklistItem();
    const index = afterId ? note.checklist.findIndex((entry) => entry.id === afterId) : -1;
    const checklist = [...note.checklist];
    checklist.splice(index === -1 ? checklist.length : index + 1, 0, item);
    update({ checklist });
    setFocusItemId(item.id);
  }

  function removeItem(id: string) {
    if (!note) return;
    update({ checklist: note.checklist.filter((item) => item.id !== id) });
  }

  async function applyReminder(date: Date | null) {
    if (!note) return;
    setReminderError(null);
    await cancelReminder(note.notificationId);
    if (!date) {
      update({ remindAt: null, notificationId: null });
      return;
    }
    if (isPast(date)) {
      update({ remindAt: null, notificationId: null });
      setReminderError('Elige una fecha y hora que aún no hayan pasado.');
      return;
    }
    const notificationId = await scheduleReminder(note, date);
    if (!notificationId) {
      update({ remindAt: null, notificationId: null });
      setReminderError(
        'Para recibir el aviso, permite las notificaciones de Nimzo en los ajustes de la tablet.',
      );
      return;
    }
    update({ remindAt: date.toISOString(), notificationId });
  }

  function pickReminder() {
    const start = note?.remindAt ? new Date(note.remindAt) : nextHour();
    DateTimePickerAndroid.open({
      mode: 'date',
      value: start,
      minimumDate: new Date(),
      onChange: (dateEvent, pickedDate) => {
        if (dateEvent.type !== 'set' || !pickedDate) return;
        DateTimePickerAndroid.open({
          mode: 'time',
          value: start,
          is24Hour: false,
          onChange: (timeEvent, pickedTime) => {
            if (timeEvent.type !== 'set' || !pickedTime) return;
            const date = new Date(pickedDate);
            date.setHours(pickedTime.getHours(), pickedTime.getMinutes(), 0, 0);
            void applyReminder(date);
          },
        });
      },
    });
  }

  function handleSave() {
    if (!note || isEmptyNote(note)) return;
    saveNote(note);
    dirty.current = false;
    setPending(false);
    setSavedAt(nowIso());
    if (showBack) {
      onSaved?.();
      onClose();
      return;
    }
    setJustSaved(true);
  }

  async function handleDelete() {
    if (!note) return;
    await cancelReminder(note.notificationId);
    latest.current = null;
    deleteNote(note.id);
    setConfirmingDelete(false);
    onClose();
  }

  const items = note.checklist;
  const filled = items.filter((item) => item.text.trim() !== '');
  const done = filled.filter((item) => item.done).length;
  const overdue = isOverdue(note.remindAt);
  const empty = isEmptyNote(note);
  const status = empty
    ? 'Escribe algo para poder guardar la nota.'
    : pending
      ? 'Guardando…'
      : savedAt
        ? formatSaved(savedAt)
        : '';

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center gap-2 border-b border-border px-3 py-2">
        {showBack ? <ToolbarButton icon="arrow-back" label="Notas" onPress={onClose} /> : null}
        <ToolbarButton
          icon="delete-outline"
          label="Eliminar"
          tone="danger"
          onPress={() => setConfirmingDelete(true)}
        />
        <Text
          numberOfLines={2}
          accessibilityLiveRegion="polite"
          className="flex-1 px-2 text-center font-sans text-sm text-muted"
        >
          {status}
        </Text>
        <ToolbarButton
          icon="push-pin"
          label={note.pinned ? 'Fijada' : 'Fijar'}
          active={note.pinned}
          onPress={() => update({ pinned: !note.pinned })}
        />
        <View className="w-[168px]">
          <Button
            label={justSaved ? '✓ Guardada' : 'Guardar'}
            onPress={handleSave}
            disabled={empty}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="items-center px-6 py-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-[760px] gap-6">
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel="Color de la nota"
            className="flex-row items-center gap-2"
          >
            <Text className="mr-1 font-sans-medium text-base text-muted">Color</Text>
            {noteColors.map((option) => {
              const selected = note.color === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => update({ color: option.value })}
                  accessibilityRole="radio"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected }}
                  className="min-h-14 min-w-14 items-center justify-center"
                >
                  <View
                    className={`h-9 w-9 items-center justify-center rounded-full ${option.className} ${selected ? 'border-[3px] border-foreground' : ''}`}
                  >
                    {selected ? (
                      <MaterialIcons
                        name="check"
                        size={18}
                        color={
                          option.value === 'yellow' || option.value === 'none'
                            ? colors.foreground
                            : colors.background
                        }
                      />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            value={note.title}
            onChangeText={(title) => update({ title })}
            placeholder="Título"
            placeholderTextColor={colors.placeholder}
            accessibilityLabel="Título de la nota"
            className="font-sans-bold text-3xl text-foreground"
          />
          <TextInput
            value={note.body}
            onChangeText={(body) => update({ body })}
            placeholder="Escribe aquí lo que necesitas recordar…"
            placeholderTextColor={colors.placeholder}
            accessibilityLabel="Texto de la nota"
            multiline
            textAlignVertical="top"
            className="min-h-[120px] font-sans text-lg leading-7 text-foreground"
          />

          <View className="gap-2">
            <View className="flex-row items-baseline justify-between">
              <Text
                accessibilityRole="header"
                className="font-sans-semibold text-xl text-foreground"
              >
                Pendientes
              </Text>
              {filled.length > 0 ? (
                <Text className="font-sans-medium text-base text-muted">
                  {done} de {filled.length} hechos
                </Text>
              ) : null}
            </View>
            <View className="overflow-hidden rounded-2xl border border-border">
              {items.map((item, index) => (
                <View
                  key={item.id}
                  className={`flex-row items-center ${index > 0 ? 'border-t border-border' : ''}`}
                >
                  <Pressable
                    onPress={() => updateItem(item.id, { done: !item.done })}
                    accessibilityRole="checkbox"
                    accessibilityLabel={item.text || 'Pendiente sin texto'}
                    accessibilityState={{ checked: item.done }}
                    className="min-h-14 min-w-14 items-center justify-center"
                  >
                    <MaterialIcons
                      name={item.done ? 'check-box' : 'check-box-outline-blank'}
                      size={28}
                      color={item.done ? colors['primary-strong'] : colors['border-strong']}
                    />
                  </Pressable>
                  <TextInput
                    value={item.text}
                    onChangeText={(text) => updateItem(item.id, { text })}
                    onSubmitEditing={() => addItem(item.id)}
                    submitBehavior="submit"
                    returnKeyType="next"
                    autoFocus={item.id === focusItemId}
                    placeholder="Escribe un pendiente"
                    placeholderTextColor={colors.placeholder}
                    accessibilityLabel="Texto del pendiente"
                    className={`min-h-14 flex-1 font-sans text-lg ${item.done ? 'text-muted line-through' : 'text-foreground'}`}
                  />
                  <Pressable
                    onPress={() => removeItem(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel="Quitar pendiente"
                    className="min-h-14 min-w-14 items-center justify-center"
                  >
                    <MaterialIcons name="close" size={22} color={colors.muted} />
                  </Pressable>
                </View>
              ))}
              <Pressable
                onPress={() => addItem()}
                accessibilityRole="button"
                className={`min-h-14 flex-row items-center gap-3 px-4 active:bg-surface ${items.length > 0 ? 'border-t border-border' : ''}`}
              >
                <MaterialIcons name="add" size={24} color={colors['primary-strong']} />
                <Text className="font-sans-semibold text-lg text-primary-strong">
                  Agregar pendiente
                </Text>
              </Pressable>
            </View>
          </View>

          <View className="overflow-hidden rounded-2xl border border-border">
            <DetailRow
              icon="business"
              label="Cliente"
              value={note.clientName}
              placeholder="Ligar a un cliente"
              onPress={() => setPickingClient(true)}
              onClear={() => update({ clientId: null, clientName: null })}
            />
            <View className="h-px bg-border" />
            <DetailRow
              icon={overdue ? 'alarm-off' : 'alarm'}
              label="Recordatorio"
              value={note.remindAt ? formatReminder(note.remindAt) : null}
              placeholder="Avisarme en una fecha y hora"
              tone={overdue ? 'alert' : 'default'}
              onPress={pickReminder}
              onClear={() => void applyReminder(null)}
            />
          </View>
          {reminderError ? (
            <Text accessibilityRole="alert" className="font-sans text-base text-danger-strong">
              {reminderError}
            </Text>
          ) : null}

          <Text className="font-sans text-sm text-muted">
            Toca Guardar al terminar. Por si acaso, la nota también se guarda sola mientras
            escribes. Se queda solo en esta tablet.
          </Text>
        </View>
      </ScrollView>

      {pickingClient ? (
        <ClientPicker
          selectedId={note.clientId}
          onSelect={(client) => {
            update({ clientId: client.id, clientName: client.name });
            setPickingClient(false);
          }}
          onClose={() => setPickingClient(false)}
        />
      ) : null}

      {confirmingDelete ? (
        <ConfirmDialog
          title="¿Eliminar esta nota?"
          message="Se borra de la tablet y no se puede recuperar."
          confirmLabel="Eliminar"
          destructive
          onConfirm={() => void handleDelete()}
          onClose={() => setConfirmingDelete(false)}
        />
      ) : null}
    </View>
  );
}

function nowIso() {
  return new Date().toISOString();
}

function isPast(date: Date) {
  return date.getTime() <= Date.now();
}

function nextHour() {
  const date = new Date();
  date.setHours(date.getHours() + 1, 0, 0, 0);
  return date;
}

type ToolbarButtonProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
  active?: boolean;
  tone?: 'default' | 'danger';
};

function ToolbarButton({ icon, label, onPress, active, tone = 'default' }: ToolbarButtonProps) {
  const color =
    tone === 'danger' ? colors['danger-strong'] : active ? colors['primary-strong'] : colors.muted;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={active === undefined ? undefined : { selected: active }}
      className={`min-h-14 flex-row items-center gap-2 rounded-full px-4 active:bg-surface ${active ? 'bg-canvas' : ''}`}
    >
      <MaterialIcons name={icon} size={22} color={color} />
      <Text
        className={`font-sans-semibold text-base ${tone === 'danger' ? 'text-danger-strong' : active ? 'text-primary-strong' : 'text-muted'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type DetailRowProps = {
  icon: IconName;
  label: string;
  value: string | null;
  placeholder: string;
  onPress: () => void;
  onClear: () => void;
  tone?: 'default' | 'alert';
};

function DetailRow({
  icon,
  label,
  value,
  placeholder,
  onPress,
  onClear,
  tone = 'default',
}: DetailRowProps) {
  return (
    <View className="flex-row items-center">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ?? placeholder}`}
        className="min-h-16 flex-1 flex-row items-center gap-4 px-4 active:bg-surface"
      >
        <View className="h-10 w-10 items-center justify-center rounded-full bg-canvas">
          <MaterialIcons
            name={icon}
            size={22}
            color={tone === 'alert' ? colors['danger-strong'] : colors['primary-strong']}
          />
        </View>
        <View className="flex-1">
          <Text className="font-sans text-sm text-muted">{label}</Text>
          <Text
            numberOfLines={1}
            className={`font-sans-medium text-lg ${value ? (tone === 'alert' ? 'text-danger-strong' : 'text-foreground') : 'text-primary-strong'}`}
          >
            {value ?? placeholder}
          </Text>
        </View>
      </Pressable>
      {value ? (
        <Pressable
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel={`Quitar ${label.toLowerCase()}`}
          className="min-h-16 min-w-16 items-center justify-center"
        >
          <MaterialIcons name="close" size={22} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

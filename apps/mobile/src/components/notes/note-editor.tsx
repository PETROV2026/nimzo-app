import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Icon, type IconName } from '@/components/icon';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ClientPicker } from '@/components/notes/client-picker';
import { NoteMenu } from '@/components/notes/note-menu';
import { formatReminder, formatSaved, isOverdue } from '@/notes/format';
import { noteColorClass } from '@/notes/note-colors';
import {
  deleteNote,
  getNote,
  isEmptyNote,
  newChecklistItem,
  saveNote,
  type ChecklistItem,
  type Note,
} from '@/notes/notes-db';
import { cancelReminder, refreshReminder, reminderKey, scheduleReminder } from '@/notes/reminders';
import { colors } from '@/theme';

const autosaveMs = 400;

type NoteEditorProps = {
  noteId: string;
  technicianId: string;
  onClose: () => void;
  showBack: boolean;
};

export function NoteEditor({ noteId, technicianId, onClose, showBack }: NoteEditorProps) {
  const [note, setNote] = useState<Note | null>(() => getNote(noteId, technicianId));
  const [savedAt, setSavedAt] = useState<string | null>(() => note?.updatedAt ?? null);
  const [pending, setPending] = useState(false);
  const [focusItemId, setFocusItemId] = useState<string | null>(null);
  const [pickingClient, setPickingClient] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const latest = useRef(note);
  const dirty = useRef(false);
  const scheduledKey = useRef(note ? reminderKey(note) : '');

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
      } else {
        if (dirty.current) saveNote(current);
        if (reminderKey(current) !== scheduledKey.current) void refreshReminder(current);
      }
    },
    [],
  );

  if (!note) return null;

  function update(changes: Partial<Note> | ((previous: Note) => Partial<Note>)) {
    dirty.current = true;
    setPending(true);
    setNote((previous) =>
      previous
        ? { ...previous, ...(typeof changes === 'function' ? changes(previous) : changes) }
        : previous,
    );
  }

  function updateChecklist(change: (checklist: ChecklistItem[]) => ChecklistItem[]) {
    update((previous) => ({ checklist: change(previous.checklist) }));
  }

  function updateItem(id: string, changes: Partial<ChecklistItem>) {
    updateChecklist((checklist) =>
      checklist.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  }

  function addItem(afterId?: string) {
    const item = newChecklistItem();
    updateChecklist((checklist) => {
      const index = afterId ? checklist.findIndex((entry) => entry.id === afterId) : -1;
      const next = [...checklist];
      next.splice(index === -1 ? next.length : index + 1, 0, item);
      return next;
    });
    setFocusItemId(item.id);
  }

  function removeItem(id: string) {
    updateChecklist((checklist) => checklist.filter((item) => item.id !== id));
  }

  async function applyReminder(date: Date | null) {
    if (!note) return;
    const previousId = note.notificationId;
    setReminderError(null);
    if (!date) {
      await cancelReminder(previousId);
      update({ remindAt: null, notificationId: null });
      return;
    }
    if (isPast(date)) {
      setReminderError('Elige una fecha y hora que aún no hayan pasado.');
      return;
    }
    const result = await scheduleReminder(note, date);
    if (!result.ok) {
      setReminderError(
        result.reason === 'permission'
          ? 'Para recibir el aviso, permite las notificaciones de Nimzo en los ajustes de la tablet.'
          : 'No se pudo programar el recordatorio. Intenta de nuevo.',
      );
      return;
    }
    await cancelReminder(previousId);
    scheduledKey.current = reminderKey(note);
    update({ remindAt: date.toISOString(), notificationId: result.notificationId });
  }

  function pickReminder() {
    const start = note?.remindAt ? new Date(note.remindAt) : nextHour();
    DateTimePickerAndroid.open({
      mode: 'date',
      value: start,
      minimumDate: new Date(),
      onValueChange: (_dateEvent, pickedDate) => {
        DateTimePickerAndroid.open({
          mode: 'time',
          value: start,
          is24Hour: false,
          onValueChange: (_timeEvent, pickedTime) => {
            const date = new Date(pickedDate);
            date.setHours(pickedTime.getHours(), pickedTime.getMinutes(), 0, 0);
            void applyReminder(date);
          },
        });
      },
    });
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
    ? 'Se guarda sola en cuanto escribas.'
    : pending
      ? 'Guardando…'
      : savedAt
        ? formatSaved(savedAt)
        : '';

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center gap-2 border-b border-border px-3 py-2">
        {showBack ? (
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Volver a tus notas"
            className="min-h-14 flex-row items-center gap-2 rounded-full px-3 active:bg-border"
          >
            <Icon name="arrow-back" size={24} color={colors.foreground} />
            <Text className="font-sans-semibold text-lg text-foreground">Notas</Text>
          </Pressable>
        ) : null}
        <View className="flex-1" />
        <ToolbarButton
          icon={note.pinned ? 'pin' : 'pin-outline'}
          label={note.pinned ? 'Fijada' : 'Fijar'}
          active={note.pinned}
          onPress={() => update({ pinned: !note.pinned })}
        />
        <ToolbarButton icon="ellipsis-vertical" label="Más" onPress={() => setMenuOpen(true)} />
      </View>

      <View className="flex-1 flex-row">
        {note.color === 'none' ? null : <View className={`w-1.5 ${noteColorClass(note.color)}`} />}
        <ScrollView
          className="flex-1"
          contentContainerClassName="items-center px-6 py-6"
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full max-w-[760px] gap-6">
            {status ? (
              <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-muted">
                {status}
              </Text>
            ) : null}

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
                      <Icon
                        name={item.done ? 'checkbox' : 'square-outline'}
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
                      <Icon name="remove-circle-outline" size={24} color={colors.muted} />
                    </Pressable>
                  </View>
                ))}
                <Pressable
                  onPress={() => addItem()}
                  accessibilityRole="button"
                  className={`min-h-14 flex-row items-center gap-3 px-4 active:bg-border ${items.length > 0 ? 'border-t border-border' : ''}`}
                >
                  <Icon name="add" size={24} color={colors['primary-strong']} />
                  <Text className="font-sans-semibold text-lg text-primary-strong">
                    Agregar pendiente
                  </Text>
                </Pressable>
              </View>
            </View>

            <View className="overflow-hidden rounded-2xl border border-border">
              <DetailRow
                icon="briefcase-outline"
                label="Cliente"
                value={note.clientName}
                placeholder="Ligar a un cliente"
                onPress={() => setPickingClient(true)}
                onClear={() => update({ clientId: null, clientName: null })}
              />
              <View className="h-px bg-border" />
              <DetailRow
                icon={overdue ? 'warning-outline' : 'alarm-outline'}
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
              La nota se guarda sola mientras escribes y se queda solo en esta tablet.
            </Text>
          </View>
        </ScrollView>
      </View>

      {menuOpen ? (
        <NoteMenu
          color={note.color}
          onColor={(color) => update({ color })}
          onDelete={() => setConfirmingDelete(true)}
          onClose={() => setMenuOpen(false)}
        />
      ) : null}

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
          tone="destructive"
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
};

function ToolbarButton({ icon, label, onPress, active }: ToolbarButtonProps) {
  const color = active ? colors['primary-strong'] : colors.muted;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={active === undefined ? undefined : { selected: active }}
      className={`min-h-14 flex-row items-center gap-2 rounded-full px-4 active:bg-border ${active ? 'bg-canvas' : ''}`}
    >
      <Icon name={icon} size={22} color={color} />
      <Text
        className={`font-sans-semibold text-base ${active ? 'text-primary-strong' : 'text-muted'}`}
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
        className="min-h-16 flex-1 flex-row items-center gap-4 px-4 active:bg-border"
      >
        <View className="h-10 w-10 items-center justify-center rounded-full bg-canvas">
          <Icon
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
          <Icon name="close-circle-outline" size={24} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

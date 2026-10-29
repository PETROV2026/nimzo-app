import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { FormField } from '@nimzo/shared';
import { CheckField } from '@/forms/fields/check-field';
import { CheckboxField } from '@/forms/fields/checkbox-field';
import { ChoiceField } from '@/forms/fields/choice-field';
import { DateField } from '@/forms/fields/date-field';
import { SelectField } from '@/forms/fields/select-field';
import { TextFormField } from '@/forms/fields/text-field';
import { TimeField } from '@/forms/fields/time-field';
import { YesNoField } from '@/forms/fields/yes-no-field';
import type {
  CheckboxValue,
  CheckValue,
  DateValue,
  OptionValue,
  TextValue,
  TimeValue,
  YesNoValue,
} from '@/forms/types';

import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

const fields = {
  visual: {
    id: 'visual_inspection',
    type: 'check',
    label: 'Inspección visual',
    help: 'Revisa que no haya fugas ni corrosión',
    required: true,
  },
  pressure: {
    id: 'discharge_pressure',
    type: 'check',
    label: 'Presión de descarga',
    measurement: { label: 'Valor', unit: 'psi', inputMode: 'decimal' },
  },
  running: { id: 'pump_running', type: 'yes_no', label: 'Bomba en operación', highlight: true },
  notes: { id: 'notes', type: 'text', label: 'Observaciones', multiline: true },
  flow: { id: 'flow', type: 'text', label: 'Caudal', inputMode: 'decimal', unit: 'gpm' },
  date: { id: 'service_date', type: 'date', label: 'Fecha del servicio' },
  time: { id: 'start_time', type: 'time', label: 'Hora de inicio' },
  frequency: {
    id: 'frequency',
    type: 'select',
    label: 'Frecuencia',
    options: [
      { value: 'monthly', label: 'Mensual' },
      { value: 'quarterly', label: 'Trimestral' },
      { value: 'annual', label: 'Anual' },
    ],
  },
  condition: {
    id: 'condition',
    type: 'choice',
    label: 'Estado general',
    options: [
      { value: 'good', label: 'Bueno' },
      { value: 'fair', label: 'Regular' },
      { value: 'bad', label: 'Malo' },
    ],
  },
  present: { id: 'client_present', type: 'checkbox', label: 'El cliente estuvo presente' },
} satisfies Record<string, FormField>;

export default function FormPreviewScreen() {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [showErrors, setShowErrors] = useState(false);

  function bind<V>(field: FormField) {
    return {
      value: values[field.id] as V | undefined,
      onChange: (value: V | undefined) =>
        setValues((current) => ({ ...current, [field.id]: value })),
      error:
        showErrors && field.required && values[field.id] === undefined
          ? 'Este campo es obligatorio'
          : undefined,
    };
  }

  return (
    <View className="flex-1 bg-canvas">
      <KeyboardAwareScrollView bottomOffset={24} contentContainerStyle={{ gap: 32, padding: 32 }}>
        <CheckField field={fields.visual} {...bind<CheckValue>(fields.visual)} />
        <CheckField field={fields.pressure} {...bind<CheckValue>(fields.pressure)} />
        <YesNoField field={fields.running} {...bind<YesNoValue>(fields.running)} />
        <TextFormField field={fields.notes} {...bind<TextValue>(fields.notes)} />
        <TextFormField field={fields.flow} {...bind<TextValue>(fields.flow)} />
        <DateField field={fields.date} {...bind<DateValue>(fields.date)} />
        <TimeField field={fields.time} {...bind<TimeValue>(fields.time)} />
        <SelectField field={fields.frequency} {...bind<OptionValue>(fields.frequency)} />
        <ChoiceField field={fields.condition} {...bind<OptionValue>(fields.condition)} />
        <CheckboxField field={fields.present} {...bind<CheckboxValue>(fields.present)} />

        <Pressable
          accessibilityRole="button"
          onPress={() => setShowErrors(true)}
          className="min-h-14 items-center justify-center self-start rounded-lg bg-primary-strong px-6"
        >
          <Text className="font-sans-semibold text-lg text-on-primary">Revisar obligatorios</Text>
        </Pressable>

        <View className="gap-2 rounded-lg border-2 border-border bg-surface p-4">
          <Text className="font-sans-semibold text-lg text-foreground">Valores guardados</Text>
          <Text className="font-sans text-base text-foreground">
            {JSON.stringify(values, null, 2)}
          </Text>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

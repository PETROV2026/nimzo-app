import { formTitle } from '@nimzo/shared';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { SelectField } from '@/components/select-field';
import { definitionCodes, getDefinition } from '@/forms/definitions';
import { FormRenderer } from '@/forms/form-renderer';
import type { FormValues } from '@/forms/form-values';
import { useServiceForms } from '@/service-forms/service-forms-db';

export default function FormPreviewScreen() {
  const forms = useServiceForms();
  const [code, setCode] = useState('work_order');
  const [values, setValues] = useState<FormValues>({});
  const definition = getDefinition(code);

  const options = useMemo(() => {
    const titles = new Map(forms.map((form) => [form.code, formTitle(form)]));
    return definitionCodes
      .map((value) => ({ value, label: titles.get(value) ?? value }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));
  }, [forms]);

  if (!definition) return null;

  return (
    <FormRenderer
      key={code}
      definition={definition}
      onValuesChange={setValues}
      header={
        <View className="max-w-[480px]">
          <SelectField
            label="Formato"
            value={code}
            options={options}
            onChange={(next) => {
              setValues({});
              setCode(next);
            }}
          />
        </View>
      }
      footer={
        <View className="gap-2 rounded-lg border-2 border-border bg-surface p-4">
          <Text className="font-sans-semibold text-lg text-foreground">Valores</Text>
          <Text selectable className="font-sans text-base text-foreground">
            {JSON.stringify(values, null, 2)}
          </Text>
        </View>
      }
    />
  );
}

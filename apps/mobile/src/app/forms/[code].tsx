import { formTitle } from '@nimzo/shared';
import { Stack, useLocalSearchParams, useNavigation, usePreventRemove } from 'expo-router';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { Notice } from '@/components/notice';
import { getDefinition } from '@/forms/definitions';
import { FormRenderer } from '@/forms/form-renderer';
import { type FormValues, isEmptyValue } from '@/forms/form-values';
import { useServiceForms } from '@/service-forms/service-forms-db';

type LeaveAction = Parameters<
  NonNullable<Parameters<typeof usePreventRemove>[1]>
>[0]['data']['action'];

export default function FillFormScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const navigation = useNavigation();
  const form = useServiceForms().find((item) => item.code === code);
  const definition = getDefinition(code);
  const [touched, setTouched] = useState(false);
  const [leaving, setLeaving] = useState<LeaveAction | null>(null);

  usePreventRemove(touched, ({ data }) => setLeaving(data.action));

  function track(values: FormValues) {
    setTouched(Object.values(values).some((value) => !isEmptyValue(value)));
  }

  const title = form ? formTitle(form) : 'Formato';

  return (
    <>
      <Stack.Screen options={{ title }} />
      {definition ? (
        <FormRenderer
          definition={definition}
          onValuesChange={track}
          header={
            <Notice message="Por ahora lo que llenes aquí no se guarda. Pronto podrás elegir el cliente y la sucursal, y guardar el servicio en este dispositivo." />
          }
        />
      ) : (
        <EmptyState
          icon="document-text-outline"
          title="Este formato aún no está disponible"
          description="Actualiza la app para poder llenarlo."
        />
      )}
      {leaving ? (
        <ConfirmDialog
          title="¿Salir del formato?"
          message="Lo que llenaste se va a perder, porque todavía no se guarda."
          confirmLabel="Salir"
          tone="destructive"
          onClose={() => setLeaving(null)}
          onConfirm={() => {
            const action = leaving;
            setLeaving(null);
            navigation.dispatch(action);
          }}
        />
      ) : null}
    </>
  );
}

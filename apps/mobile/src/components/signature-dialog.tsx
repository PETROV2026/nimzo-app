import { useState } from 'react';
import { Modal, Text, useWindowDimensions, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Button } from '@/components/button';
import { DialogHeader } from '@/components/dialog-header';
import { SignatureCanvas } from '@/components/signature-canvas';
import { renderSignaturePng, signatureHint, useSignatureInk } from '@/lib/signature-ink';

type SignatureDialogProps = {
  title: string;
  name: string;
  onSave: (png: Uint8Array) => Promise<string | null>;
  onClose: () => void;
  onSaved: () => void;
};

export function SignatureDialog({ title, name, onSave, onClose, onSaved }: SignatureDialogProps) {
  const { height } = useWindowDimensions();
  const compact = height < 800;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const signature = useSignatureInk({
    enabled: !saving && !confirmingDiscard,
    onStrokeStart: () => setError(null),
  });
  const { ink, readable } = signature;
  const hasInk = ink !== null;

  function handleClose() {
    if (saving) return;
    if (hasInk && !confirmingDiscard) {
      setConfirmingDiscard(true);
      return;
    }
    onClose();
  }

  async function handleSave() {
    if (!ink) return;
    const png = renderSignaturePng(ink);
    if (!png) {
      setError('No se pudo leer la firma. Intenta de nuevo.');
      return;
    }
    setSaving(true);
    let result: string | null;
    try {
      result = await onSave(png);
    } catch {
      result = 'No se pudo guardar la firma. Intenta de nuevo.';
    } finally {
      setSaving(false);
    }
    if (result) {
      setError(result);
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={handleClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center bg-foreground/40 p-4">
          <View
            className={`w-full rounded-3xl bg-background ${compact ? 'max-w-[760px] gap-4 p-6' : 'max-w-[880px] gap-6 p-8'}`}
          >
            <DialogHeader
              title={title}
              description="Se incluirá en todos los reportes que envíes."
              onClose={handleClose}
              disabled={saving}
            />

            <View className="gap-2">
              <SignatureCanvas
                signature={signature}
                name={name}
                disabled={saving}
                className={compact ? 'h-56' : 'h-72'}
              />
              <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-muted">
                {signatureHint(hasInk, readable, 'save')}
              </Text>
            </View>

            {error ? (
              <Text accessibilityRole="alert" className="font-sans text-base text-destructive">
                {error}
              </Text>
            ) : null}

            {confirmingDiscard ? (
              <View className="gap-4">
                <Text className="font-sans-medium text-lg text-foreground">
                  ¿Descartar la firma que dibujaste?
                </Text>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Button
                      variant="secondary"
                      label="Seguir firmando"
                      onPress={() => setConfirmingDiscard(false)}
                    />
                  </View>
                  <View className="flex-1">
                    <Button variant="destructive" label="Descartar" onPress={onClose} />
                  </View>
                </View>
              </View>
            ) : (
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button
                    variant="secondary"
                    label="Cancelar"
                    onPress={handleClose}
                    disabled={saving}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    label="Guardar firma"
                    variant="success"
                    onPress={handleSave}
                    disabled={!readable}
                    loading={saving}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

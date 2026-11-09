import { Canvas, Path } from '@shopify/react-native-skia';
import { useState } from 'react';
import { Modal, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Icon } from '@/components/icon';
import { Button } from '@/components/button';
import { DialogHeader } from '@/components/dialog-header';
import { renderSignaturePng, strokeStyle, useSignatureInk } from '@/lib/signature-ink';
import { colors } from '@/theme';

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
  const { pan, inkPath, strokePath, ink, drawing, clear, readable } = useSignatureInk({
    enabled: !saving && !confirmingDiscard,
    onStrokeStart: () => setError(null),
  });
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
              description="Se incluirá en cada reporte que envíes."
              onClose={handleClose}
              disabled={saving}
            />

            <View className="gap-2">
              <View
                className={`overflow-hidden rounded-xl border-2 ${hasInk ? 'border-border' : 'border-dashed border-border-strong'} ${compact ? 'h-56' : 'h-72'}`}
              >
                <GestureDetector gesture={pan}>
                  <Canvas style={{ flex: 1 }}>
                    <Path path={inkPath} {...strokeStyle} />
                    <Path path={strokePath} {...strokeStyle} />
                  </Canvas>
                </GestureDetector>
                {hasInk || drawing ? null : (
                  <View
                    pointerEvents="none"
                    className="absolute inset-x-0 top-0 bottom-10 items-center justify-center gap-2"
                  >
                    <Icon name="create-outline" size={28} color={colors['border-strong']} />
                    <Text className="font-sans text-base text-muted">
                      Firma aquí con el dedo o con un lápiz
                    </Text>
                  </View>
                )}
                <View pointerEvents="none" className="absolute inset-x-8 bottom-4 gap-1">
                  <View className="h-px bg-border-strong" />
                  <Text numberOfLines={1} className="text-center font-sans text-sm text-muted">
                    {name}
                  </Text>
                </View>
                {hasInk ? (
                  <Pressable
                    onPress={clear}
                    disabled={saving}
                    accessibilityRole="button"
                    accessibilityLabel="Borrar firma y empezar de nuevo"
                    className="absolute right-2 top-2 min-h-14 flex-row items-center gap-2 rounded-lg bg-background px-4 active:bg-border"
                  >
                    <Icon name="trash-outline" size={20} color={colors['primary-strong']} />
                    <Text className="font-sans-semibold text-base text-primary-strong">Borrar</Text>
                  </Pressable>
                ) : null}
              </View>
              <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-muted">
                {!hasInk
                  ? 'Usa todo el espacio: una firma grande se lee mejor en el reporte.'
                  : readable
                    ? 'Revisa que se lea bien antes de guardarla.'
                    : 'Haz la firma un poco más grande para poder guardarla.'}
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

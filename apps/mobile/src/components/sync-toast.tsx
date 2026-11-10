import { useEffect, useRef } from 'react';
import { describeUploads, useClientsSyncStatus } from '@/clients/clients-sync';
import { useToast } from '@/components/toast';

export function SyncToast() {
  const { lastSyncedAt, uploaded } = useClientsSyncStatus();
  const { toast, showToast } = useToast();
  const announced = useRef(lastSyncedAt);

  useEffect(() => {
    if (!lastSyncedAt || lastSyncedAt === announced.current) return;
    announced.current = lastSyncedAt;
    const text = uploaded ? describeUploads(uploaded) : '';
    if (text) showToast('Todo sincronizado', `Se subieron a la nube ${text}.`);
  }, [lastSyncedAt, uploaded, showToast]);

  return toast;
}

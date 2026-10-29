import CloudOffOutlined from '@mui/icons-material/CloudOffOutlined';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Modal from '@mui/material/Modal';
import Paper from '@mui/material/Paper';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import {
  onlineManager,
  useIsFetching,
  useMutationState,
  useQueryClient,
  type Mutation,
  type Query,
} from '@tanstack/react-query';
import { useEffect, useState, useSyncExternalStore } from 'react';

import { tokens } from '@/theme';

const SHOW_AFTER_MS = 350;
const MIN_VISIBLE_MS = 500;

const resourceLabels: Record<string, string> = {
  clients: 'clientes',
  branches: 'sucursales',
  systems: 'sistemas',
  service_forms: 'formatos',
  service_packages: 'paquetes de servicio',
  service_package_forms: 'formatos del paquete',
  profiles: 'usuarios',
  reports: 'reportes',
};

function isBlockingQuery(query: Query) {
  if (query.state.data !== undefined) return false;
  if (query.observers.some((observer) => observer.getCurrentResult().isPlaceholderData)) {
    return false;
  }
  const [scope] = query.queryKey;
  return scope === 'data' || scope === 'auth';
}

const defaultTitle = 'Cargando información del panel…';
const savingTitle = 'Guardando cambios…';
const offlineTitle = 'Sin conexión a internet';
const offlineMessage = 'Revisa tu conexión. El panel continúa solo en cuanto vuelva la red.';

function loadingTitle(query: Query) {
  const [scope, , resource] = query.queryKey;
  if (scope === 'auth') return 'Verificando tu sesión…';
  const label = typeof resource === 'string' ? resourceLabels[resource] : undefined;
  return label ? `Cargando ${label}…` : defaultTitle;
}

function isBlockingMutation(mutation: Mutation) {
  const variables = mutation.state.variables as { mutationMode?: string } | undefined;
  return mutation.state.status === 'pending' && variables?.mutationMode !== 'undoable';
}

function useOnline() {
  return useSyncExternalStore(
    (onChange) => onlineManager.subscribe(onChange),
    () => onlineManager.isOnline(),
  );
}

function useSteadyFlag(active: boolean) {
  const [visible, setVisible] = useState(false);
  const [shownAt, setShownAt] = useState(0);

  useEffect(() => {
    if (active && !visible) {
      const timer = setTimeout(() => {
        setVisible(true);
        setShownAt(Date.now());
      }, SHOW_AFTER_MS);
      return () => clearTimeout(timer);
    }
    if (!active && visible) {
      const timer = setTimeout(
        () => setVisible(false),
        Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt)),
      );
      return () => clearTimeout(timer);
    }
  }, [active, visible, shownAt]);

  return visible;
}

export function GlobalLoading() {
  const online = useOnline();
  const client = useQueryClient();
  const fetching = useIsFetching({ predicate: isBlockingQuery });
  const loadingQuery =
    fetching > 0
      ? client
          .getQueryCache()
          .findAll({ predicate: isBlockingQuery, fetchStatus: 'fetching' })
          .at(0)
      : undefined;
  const saving = useMutationState({
    filters: { predicate: isBlockingMutation },
    select: (mutation) => mutation.state.status,
  }).length;

  const busy = fetching > 0 || saving > 0;
  const visible = useSteadyFlag(busy);
  const current = saving > 0 ? savingTitle : loadingQuery ? loadingTitle(loadingQuery) : null;
  const [shown, setShown] = useState(defaultTitle);
  if (current && current !== shown) setShown(current);
  const title = online ? (current ?? shown) : offlineTitle;

  const open = !online || visible;

  return (
    <Modal
      open={open}
      disableAutoFocus
      disableEnforceFocus
      disableRestoreFocus
      disableEscapeKeyDown
      slotProps={{ backdrop: { sx: { bgcolor: alpha(tokens.adminBar, 0.3) } } }}
      sx={{ zIndex: (theme) => theme.zIndex.modal + 10 }}
    >
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          p: 2,
          pointerEvents: 'none',
        }}
      >
        <Paper
          role={online ? 'status' : 'alert'}
          aria-live={online ? 'polite' : 'assertive'}
          elevation={3}
          sx={{
            pointerEvents: 'auto',
            width: '100%',
            maxWidth: 300,
            p: 3,
            textAlign: 'center',
            display: 'grid',
            justifyItems: 'center',
            gap: 1.5,
            outline: 'none',
          }}
        >
          {online ? (
            <CircularProgress size={36} aria-hidden />
          ) : (
            <CloudOffOutlined color="error" sx={{ fontSize: 36 }} aria-hidden />
          )}
          <Typography sx={{ fontWeight: 600 }}>{title}</Typography>
          {online ? null : (
            <Typography variant="body2" color="text.secondary">
              {offlineMessage}
            </Typography>
          )}
        </Paper>
      </Box>
    </Modal>
  );
}

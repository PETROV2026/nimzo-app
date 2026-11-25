import CloudOffOutlined from '@mui/icons-material/CloudOffOutlined';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Paper from '@mui/material/Paper';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

import { tokens } from '@/theme';

function useOnline() {
  return useSyncExternalStore(
    (onChange) => onlineManager.subscribe(onChange),
    () => onlineManager.isOnline(),
  );
}

export function OfflineNotice() {
  const online = useOnline();

  return (
    <Modal
      open={!online}
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
          role="alert"
          aria-live="assertive"
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
          <CloudOffOutlined color="error" sx={{ fontSize: 36 }} aria-hidden />
          <Typography sx={{ fontWeight: 600 }}>Sin conexión a internet</Typography>
          <Typography variant="body2" color="text.secondary">
            Revisa tu conexión. El panel continúa solo en cuanto vuelva la red.
          </Typography>
        </Paper>
      </Box>
    </Modal>
  );
}

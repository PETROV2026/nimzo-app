import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import type { NotificationProvider } from '@refinedev/core';
import { useSnackbar, type SnackbarKey } from 'notistack';

export function useNotificationProvider(): NotificationProvider {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  return {
    open: ({ key, message, description, type, undoableTimeout, cancelMutation }) => {
      const content = (
        <Box>
          {description && (
            <Typography variant="subtitle2" component="p">
              {description}
            </Typography>
          )}
          <Typography variant="caption" component="p">
            {message}
          </Typography>
        </Box>
      );

      if (type === 'progress') {
        enqueueSnackbar(content, {
          key,
          variant: 'info',
          preventDuplicate: true,
          autoHideDuration: (undoableTimeout ?? 5) * 1000,
          action: (snackbarKey: SnackbarKey) => (
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                cancelMutation?.();
                closeSnackbar(snackbarKey);
              }}
              sx={{ fontWeight: 700, textDecoration: 'underline' }}
            >
              Deshacer
            </Button>
          ),
        });
        return;
      }

      enqueueSnackbar(content, { key, variant: type, preventDuplicate: Boolean(key) });
    },
    close: (key) => closeSnackbar(key),
  };
}

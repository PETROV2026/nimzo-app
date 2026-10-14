import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { NotificationProvider } from '@refinedev/core';
import { useSnackbar } from 'notistack';

export function useNotificationProvider(): NotificationProvider {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  return {
    open: ({ key, message, description, type }) => {
      enqueueSnackbar(
        <Box>
          {description && (
            <Typography variant="subtitle2" component="p">
              {description}
            </Typography>
          )}
          <Typography variant="caption" component="p">
            {message}
          </Typography>
        </Box>,
        { key, variant: type === 'progress' ? 'info' : type, preventDuplicate: Boolean(key) },
      );
    },
    close: (key) => closeSnackbar(key),
  };
}

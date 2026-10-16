import ContentCopy from '@mui/icons-material/ContentCopy';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import { useNotification } from '@refinedev/core';
import { useId, type ReactNode } from 'react';

import { CodeBlock } from '@/components/code-block';

type CredentialsDialogProps = {
  open: boolean;
  title: string;
  intro: string;
  email: string;
  password: string;
  actions: ReactNode;
};

export function CredentialsDialog({
  open,
  title,
  intro,
  email,
  password,
  actions,
}: CredentialsDialogProps) {
  const titleId = useId();
  const { open: notify } = useNotification();
  const text = `Correo: ${email}\nContraseña: ${password}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      notify?.({ type: 'success', message: 'Datos de acceso copiados' });
    } catch {
      notify?.({
        type: 'error',
        message: 'No se pudo copiar',
        description: 'Selecciona los datos y cópialos a mano.',
      });
    }
  }

  return (
    <Dialog open={open} aria-labelledby={titleId} maxWidth="sm" fullWidth>
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {intro}
        </Typography>
        <CodeBlock>
          <code>{text}</code>
        </CodeBlock>
        <Box sx={{ mt: 1.5 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ContentCopy fontSize="small" />}
            onClick={copy}
          >
            Copiar datos de acceso
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          La contraseña no se vuelve a mostrar. Si se pierde, restablécela desde la página del
          usuario.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>{actions}</DialogActions>
    </Dialog>
  );
}

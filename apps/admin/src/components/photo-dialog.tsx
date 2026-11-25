import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useId, useState, type KeyboardEvent } from 'react';

import { ExternalLink } from '@/components/external-link';

type PhotoDialogProps = {
  urls: string[];
  initialIndex: number;
  onClose: () => void;
};

export function PhotoDialog({ urls, initialIndex, onClose }: PhotoDialogProps) {
  const titleId = useId();
  const [index, setIndex] = useState(initialIndex);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const url = urls[index];
  const title = `Imagen ${index + 1} de ${urls.length}`;

  function move(step: number) {
    setIndex((current) => (current + step + urls.length) % urls.length);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (urls.length < 2) return;
    if (event.key === 'ArrowLeft') move(-1);
    else if (event.key === 'ArrowRight') move(1);
  }

  return (
    <Dialog
      open
      onClose={onClose}
      onKeyDown={handleKeyDown}
      aria-labelledby={titleId}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle
        id={titleId}
        aria-live="polite"
        sx={{ display: 'flex', alignItems: 'center', pr: 7 }}
      >
        {title}
      </DialogTitle>
      <IconButton
        aria-label="Cerrar imagen"
        onClick={onClose}
        sx={{ position: 'absolute', top: 8, right: 8, width: 44, height: 44 }}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent
        dividers
        sx={{ display: 'grid', placeItems: 'center', p: 0, bgcolor: 'background.default' }}
      >
        {failedUrl === url ? (
          <Typography color="text.secondary" sx={{ p: 4 }}>
            No se pudo cargar la imagen. Recarga la página para intentar de nuevo.
          </Typography>
        ) : (
          <Box
            component="img"
            src={url}
            alt={title}
            onError={() => setFailedUrl(url)}
            sx={{ display: 'block', maxWidth: '100%', height: '68vh', objectFit: 'contain' }}
          />
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 1.5 }}>
        <ExternalLink href={url}>Abrir en otra pestaña</ExternalLink>
        {urls.length > 1 && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<ChevronLeft />} onClick={() => move(-1)}>
              Anterior
            </Button>
            <Button variant="outlined" endIcon={<ChevronRight />} onClick={() => move(1)}>
              Siguiente
            </Button>
          </Box>
        )}
      </DialogActions>
    </Dialog>
  );
}

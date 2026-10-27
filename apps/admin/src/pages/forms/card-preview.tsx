import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { Postbox } from '@/components/postbox';
import { tokens } from '@/theme';

import { FormIcon } from './form-icon';

type CardPreviewProps = {
  name: string;
  subtitle: string | null | undefined;
  iconPath: string | null;
};

export function CardPreview({ name, subtitle, iconPath }: CardPreviewProps) {
  return (
    <Postbox title="Vista previa en la app">
      <Box sx={{ bgcolor: tokens.canvas, p: 2, borderRadius: 1 }}>
        <Paper
          aria-label="Vista previa de la tarjeta del formato"
          sx={{
            display: 'grid',
            gridTemplateColumns: '96px 1fr',
            alignItems: 'center',
            gap: 2,
            maxWidth: 420,
            minHeight: 140,
            p: 2.5,
            borderRadius: 3,
            border: 0,
          }}
        >
          <FormIcon path={iconPath} size={88} />
          <Box sx={{ textAlign: 'center', minWidth: 0 }}>
            <Typography
              sx={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2, color: tokens.black }}
            >
              {name || 'Nombre del formato'}
            </Typography>
            {subtitle && (
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: tokens.tealText, mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Paper>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
        Así verán los técnicos este formato en la tablet al iniciar un servicio.
      </Typography>
    </Postbox>
  );
}

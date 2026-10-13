import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

import { tokens } from '@/theme';

const edgeColor = {
  success: tokens.teal,
  warning: tokens.yellow,
  error: tokens.orange,
  info: tokens.gray,
} as const;

type NoticeProps = {
  severity?: keyof typeof edgeColor;
  title?: string;
  children?: ReactNode;
  actions?: ReactNode;
  onDismiss?: () => void;
};

/** WordPress-style admin notice: white box with a colored left edge. */
export function Notice({ severity = 'info', title, children, actions, onDismiss }: NoticeProps) {
  return (
    <Paper
      variant="outlined"
      role={severity === 'error' ? 'alert' : 'status'}
      sx={{ display: 'flex', gap: 2, p: 2, borderLeft: `4px solid ${edgeColor[severity]}` }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {title && <Typography sx={{ fontWeight: 600, mb: children ? 0.5 : 0 }}>{title}</Typography>}
        {children && <Box sx={{ color: 'text.secondary' }}>{children}</Box>}
        {actions && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1.5 }}>{actions}</Box>
        )}
      </Box>
      {onDismiss && (
        <IconButton
          size="small"
          aria-label="Descartar aviso"
          onClick={onDismiss}
          sx={{ alignSelf: 'flex-start' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
    </Paper>
  );
}

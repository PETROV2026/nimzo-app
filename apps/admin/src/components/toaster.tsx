import CheckCircle from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import ErrorIcon from '@mui/icons-material/Error';
import { styled } from '@mui/material/styles';
import { Toaster as SonnerToaster } from 'sonner';

import { ADMIN_BAR_HEIGHT, tokens } from '@/theme';

const StyledToaster = styled(SonnerToaster)(({ theme }) => ({
  '&&&': {
    '--normal-bg': tokens.adminBar,
    '--normal-border': tokens.gray,
    '--normal-text': tokens.white,
    '--border-radius': `${theme.shape.borderRadius}px`,
    fontFamily: theme.typography.fontFamily,
    zIndex: theme.zIndex.snackbar,
  },
  '&&& [data-sonner-toast]': {
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5, 6, 1.5, 2),
    fontSize: theme.typography.body1.fontSize,
    boxShadow: 'none',
    '&:focus-visible': { outline: `2px solid ${tokens.yellow}`, outlineOffset: 2 },
  },
  '&&& [data-title]': { fontWeight: 600 },
  '&&& [data-description]': { color: tokens.white, fontSize: theme.typography.body2.fontSize },
  '&&& [data-icon]': { width: 20, height: 20, margin: 0 },
  '&&& [data-icon] svg': { margin: 0, fontSize: 20 },
  '&&& [data-type="success"] [data-icon]': { color: tokens.teal },
  '&&& [data-type="error"] [data-icon]': { color: tokens.orange },
  '&&& [data-button]': {
    height: 36,
    paddingInline: theme.spacing(1.5),
    fontSize: theme.typography.body2.fontSize,
    fontWeight: 600,
    fontFamily: 'inherit',
    '&:focus-visible': { outline: `2px solid ${tokens.yellow}`, outlineOffset: 2 },
    '@media (pointer: coarse)': { height: 44 },
  },
  '&&& [data-close-button]': {
    left: 'auto',
    right: theme.spacing(1),
    top: '50%',
    width: 32,
    height: 32,
    border: 0,
    borderRadius: theme.shape.borderRadius,
    transform: 'translateY(-50%)',
    '&:focus-visible': { outline: `2px solid ${tokens.yellow}`, outlineOffset: -2 },
    '@media (pointer: coarse)': { width: 44, height: 44, right: 2 },
  },
  '&&& [data-sonner-toast]:hover [data-close-button]:hover': { background: tokens.gray },
}));

const offset = { top: ADMIN_BAR_HEIGHT + 8, right: 16, left: 16 };

const icons = {
  success: <CheckCircle />,
  error: <ErrorIcon />,
  close: <CloseIcon fontSize="small" />,
};

export function Toaster() {
  return (
    <StyledToaster
      position="top-right"
      closeButton
      duration={5000}
      offset={offset}
      mobileOffset={offset}
      icons={icons}
      containerAriaLabel="Avisos"
      toastOptions={{ closeButtonAriaLabel: 'Cerrar aviso' }}
    />
  );
}

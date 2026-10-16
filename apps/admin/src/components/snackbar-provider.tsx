import { styled } from '@mui/material/styles';
import { SnackbarProvider as NotistackProvider } from 'notistack';
import type { ComponentProps } from 'react';

const StyledProvider = styled(NotistackProvider)(({ theme }) => ({
  '&.SnackbarItem-variantSuccess': {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.contrastText,
  },
  '&.SnackbarItem-variantError': {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
  },
  '&.SnackbarItem-variantInfo': {
    backgroundColor: theme.palette.info.main,
    color: theme.palette.info.contrastText,
  },
  '&.SnackbarItem-variantWarning': {
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.warning.contrastText,
  },
}));

export function SnackbarProvider(props: ComponentProps<typeof NotistackProvider>) {
  return (
    <StyledProvider
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      classes={{ containerAnchorOriginTopRight: 'snackbar-below-bar' }}
      disableWindowBlurListener
      {...props}
    />
  );
}

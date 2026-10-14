import { esES as materialEsES } from '@mui/material/locale';
import { createTheme } from '@mui/material/styles';
import { esES as dataGridEsES } from '@mui/x-data-grid/locales';
import type {} from '@mui/x-data-grid/themeAugmentation';

export const tokens = {
  adminBar: '#343035',
  sidebar: '#484349',
  sidebarSub: '#3D393E',
  sidebarHover: '#FFBA49',
  canvas: '#F2F2F2',
  panel: '#FFFFFF',
  border: '#DEDDDE',
  inputBorder: '#888589',
  rowAlt: '#F8F7F8',
  black: '#000000',
  gray: '#484349',
  muted: '#6D696D',
  teal: '#20A39E',
  tealStrong: '#19827E',
  tealDark: '#146B67',
  orange: '#E4572E',
  orangeStrong: '#B64524',
  yellow: '#FFBA49',
  white: '#FFFFFF',
} as const;

export const ADMIN_BAR_HEIGHT = 40;

const bodyFont = '"Inter Variable", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif';
export const displayFont = '"Barlow Semi Condensed", "Inter Variable", system-ui, sans-serif';

export const theme = createTheme(
  {
    palette: {
      mode: 'light',
      primary: {
        light: tokens.teal,
        main: tokens.tealStrong,
        dark: tokens.tealDark,
        contrastText: tokens.white,
      },
      secondary: { main: tokens.gray, contrastText: tokens.white },
      error: { light: tokens.orange, main: tokens.orangeStrong, contrastText: tokens.white },
      warning: { main: tokens.yellow, contrastText: tokens.black },
      success: { main: tokens.tealStrong, contrastText: tokens.white },
      info: { main: tokens.gray, contrastText: tokens.white },
      text: { primary: tokens.black, secondary: tokens.gray, disabled: tokens.muted },
      background: { default: tokens.canvas, paper: tokens.panel },
      divider: tokens.border,
    },
    shape: { borderRadius: 4 },
    typography: {
      fontFamily: bodyFont,
      fontSize: 14,
      body1: { fontSize: 14, lineHeight: 1.55 },
      body2: { fontSize: 13, lineHeight: 1.5 },
      h1: { fontSize: 23, fontWeight: 400, lineHeight: 1.3, letterSpacing: '-0.01em' },
      h2: { fontSize: 14, fontWeight: 600, lineHeight: 1.4 },
      h3: { fontSize: 18, fontWeight: 500, lineHeight: 1.35 },
      h4: {
        fontFamily: displayFont,
        fontSize: 40,
        fontWeight: 600,
        lineHeight: 1.05,
        letterSpacing: '-0.01em',
      },
      h5: { fontSize: 16, fontWeight: 600 },
      h6: { fontSize: 15, fontWeight: 600 },
      button: { fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' },
          '@media (prefers-reduced-motion: reduce)': {
            '*, *::before, *::after': {
              transitionDuration: '0.01ms !important',
              animationDuration: '0.01ms !important',
            },
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { minHeight: 36, paddingInline: 14 },
          sizeLarge: { minHeight: 44, fontSize: 15 },
          outlinedPrimary: { backgroundColor: tokens.white, borderColor: tokens.tealStrong },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: { backgroundImage: 'none' },
          outlined: { borderColor: tokens.border },
        },
      },
      MuiTextField: { defaultProps: { fullWidth: true, size: 'small' } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { backgroundColor: tokens.white },
          notchedOutline: { borderColor: tokens.inputBorder },
        },
      },
      MuiChip: { styleOverrides: { root: { fontWeight: 500 }, sizeSmall: { height: 24 } } },
      MuiTooltip: {
        styleOverrides: { tooltip: { backgroundColor: tokens.adminBar, fontSize: 12 } },
      },
      MuiLink: {
        defaultProps: { underline: 'hover' },
        styleOverrides: { root: { fontWeight: 500 } },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: { border: 'none', '--DataGrid-rowBorderColor': tokens.border, fontSize: 14 },
          columnHeaderTitle: { fontWeight: 600 },
          cell: { display: 'flex', alignItems: 'center', lineHeight: 1.45 },
        },
      },
    },
  },
  materialEsES,
  dataGridEsES,
);

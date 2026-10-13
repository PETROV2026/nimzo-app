import { esES as materialEsES } from '@mui/material/locale';
import { createTheme } from '@mui/material/styles';
import { esES as dataGridEsES } from '@mui/x-data-grid/locales';
import type {} from '@mui/x-data-grid/themeAugmentation';

/**
 * Admin panel theme. Layout and conventions follow the WordPress admin (dark admin bar and
 * sidebar, light gray workspace, white boxes with thin borders, notices with a colored left edge),
 * so administrators recognize the patterns (Jakob's law). Colors are the Nimzo brand palette
 * (same values as apps/mobile/src/theme/colors.js).
 *
 * Contrast (WCAG AA): teal, orange and yellow are too light for small text on white, so `main`
 * uses the darker shade wherever MUI draws text on top of the color. Every chrome color below was
 * measured against its text: see the ratios in the comments.
 */
export const tokens = {
  // Chrome (dark): derived from the brand gray #484349.
  adminBar: '#343035', // top bar; white text 13:1
  sidebar: '#484349', // left menu; white text 9.7:1, 72% white 5.9:1
  sidebarSub: '#3D393E', // submenu and hover background; 80% white 7.9:1
  sidebarHover: '#FFBA49', // brand yellow for hovered menu text; 5.7:1 on the sidebar
  // Workspace (light).
  canvas: '#F2F2F2', // page background; brand gray text 8.6:1
  panel: '#FFFFFF', // boxes, tables, forms
  border: '#DEDDDE', // box and table borders (decorative)
  inputBorder: '#888589', // input outlines (3.6:1, required 3:1 for UI components)
  rowAlt: '#F8F7F8', // alternate table rows
  // Text.
  black: '#000000', // headings and body text
  gray: '#484349', // secondary text
  muted: '#6D696D', // helper text (5.4:1)
  // Brand colors.
  teal: '#20A39E',
  tealStrong: '#19827E', // active menu item, primary buttons, links (white text 4.6:1)
  tealDark: '#146B67',
  orange: '#E4572E',
  orangeStrong: '#B64524',
  yellow: '#FFBA49',
  white: '#FFFFFF',
} as const;

export const ADMIN_BAR_HEIGHT = 40;

const bodyFont = '"Inter Variable", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif';
/** Only for the brand moments: the dashboard welcome panel and the login. */
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
      // Page titles follow WordPress: 23px, regular weight.
      h1: { fontSize: 23, fontWeight: 400, lineHeight: 1.3, letterSpacing: '-0.01em' },
      h2: { fontSize: 14, fontWeight: 600, lineHeight: 1.4 }, // box titles
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
          // Secondary buttons: white with a teal border, like WordPress' secondary button.
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
          // The grid sets line-height to the row height; reset it so multi-line cells lay out normally.
          cell: { display: 'flex', alignItems: 'center', lineHeight: 1.45 },
        },
      },
    },
  },
  materialEsES,
  dataGridEsES,
);

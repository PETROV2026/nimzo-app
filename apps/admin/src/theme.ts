import { esES as materialEsES } from '@mui/material/locale';
import { createTheme } from '@mui/material/styles';
import { esES as dataGridEsES } from '@mui/x-data-grid/locales';
import type {} from '@mui/x-data-grid/themeAugmentation';

/**
 * Admin panel theme. Style direction: apps/admin/DESIGN_admin.md (quiet chrome, hairline borders
 * instead of shadows, pill buttons, Inter body, condensed display headings), adapted to the Nimzo
 * brand palette (same values as apps/mobile/src/theme/colors.js).
 *
 * Contrast: teal, orange and yellow are too light for small text on white (WCAG AA), so `main`
 * uses the darker shade wherever MUI draws text on top of the color.
 */
export const tokens = {
  // Neutrals, derived from the brand gray #484349.
  canvas: '#FAF9FA', // page background
  stone: '#F4F4F4', // secondary surfaces, selected nav item, sand buttons
  hairline: '#E4E3E4', // 1px borders that define cards and panels
  white: '#FFFFFF',
  black: '#000000', // headings and body text
  gray: '#484349', // subtitles, secondary text, the one dark surface (login brand panel)
  muted: '#6D696D', // helper text, inactive navigation
  // Brand colors.
  teal: '#20A39E',
  tealStrong: '#19827E',
  tealDark: '#146B67',
  orange: '#E4572E',
  orangeStrong: '#B64524',
  yellow: '#FFBA49',
} as const;

const displayFont = '"Barlow Semi Condensed", "Inter Variable", system-ui, sans-serif';
const bodyFont = '"Inter Variable", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif';

/** The design's signature border: an inner hairline instead of a drop shadow. */
export const hairline = `inset 0 0 0 1px ${tokens.hairline}`;

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
      text: { primary: tokens.black, secondary: tokens.gray, disabled: tokens.muted },
      background: { default: tokens.canvas, paper: tokens.white },
      divider: tokens.hairline,
      action: { hover: tokens.stone, selected: tokens.stone },
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: bodyFont,
      fontSize: 15,
      body1: { fontSize: 16, lineHeight: 1.5, letterSpacing: '-0.011em' },
      body2: { fontSize: 14, lineHeight: 1.5, letterSpacing: '-0.006em' },
      h1: {
        fontFamily: displayFont,
        fontWeight: 500,
        fontSize: 44,
        lineHeight: 1.1,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontFamily: displayFont,
        fontWeight: 500,
        fontSize: 36,
        lineHeight: 1.1,
        letterSpacing: '-0.02em',
      },
      h3: {
        fontFamily: displayFont,
        fontWeight: 500,
        fontSize: 30,
        lineHeight: 1.15,
        letterSpacing: '-0.015em',
      },
      h4: {
        fontFamily: displayFont,
        fontWeight: 500,
        fontSize: 26,
        lineHeight: 1.2,
        letterSpacing: '-0.01em',
      },
      h5: { fontWeight: 500, fontSize: 20, lineHeight: 1.3, letterSpacing: '-0.015em' },
      h6: { fontWeight: 600, fontSize: 17, lineHeight: 1.35, letterSpacing: '-0.01em' },
      subtitle1: { fontWeight: 500 },
      button: { fontWeight: 600, textTransform: 'none', letterSpacing: '-0.009em' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 9999, paddingInline: 18 },
          sizeLarge: { paddingBlock: 10, fontSize: 16 },
          // "Sand pill": the quiet secondary action.
          outlined: {
            borderColor: tokens.hairline,
            color: tokens.black,
            '&:hover': { backgroundColor: tokens.stone, borderColor: tokens.hairline },
          },
        },
      },
      MuiIconButton: { styleOverrides: { root: { borderRadius: 10 } } },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: { backgroundImage: 'none' },
          outlined: { border: 'none', boxShadow: hairline },
        },
      },
      MuiCard: {
        defaultProps: { variant: 'outlined' },
        styleOverrides: { root: { borderRadius: 10 } },
      },
      MuiCardHeader: { styleOverrides: { root: { padding: 24 }, title: { fontWeight: 600 } } },
      MuiCardContent: {
        styleOverrides: { root: { padding: 24, '&:last-child': { paddingBottom: 24 } } },
      },
      MuiTextField: { defaultProps: { fullWidth: true } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: 10, backgroundColor: tokens.white },
          notchedOutline: { borderColor: tokens.hairline },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 9999, fontWeight: 500 },
          sizeSmall: { height: 26 },
        },
      },
      MuiAlert: { styleOverrides: { root: { borderRadius: 10 } } },
      MuiTooltip: { styleOverrides: { tooltip: { backgroundColor: tokens.black, fontSize: 13 } } },
      MuiDataGrid: {
        styleOverrides: {
          root: { border: 'none', '--DataGrid-rowBorderColor': tokens.hairline },
          columnHeaderTitle: { fontWeight: 600 },
          cell: { display: 'flex', alignItems: 'center' },
        },
      },
    },
  },
  materialEsES,
  dataGridEsES,
);

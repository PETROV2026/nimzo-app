// Nimzo brand palette for the mobile app. Single source of truth for colors:
// tailwind.config.js builds the NativeWind classes from it (bg-primary, text-foreground…),
// and code that needs a raw value (StatusBar, ActivityIndicator, navigation theme) imports it.
//
// Brand colors: #20A39E (teal), #FFBA49 (yellow), #E4572E (orange), #484349 (dark gray), #FFFFFF.
// The main background is white. Text is black; subtitles use the brand gray.
//
// Contrast against white (WCAG AA needs 4.5:1 for normal text, 3:1 for large text and UI shapes):
//   teal 3.1, orange 3.7, yellow 1.7  -> not enough for small text on white.
//   The `strong` variants are darker shades of the brand color for text, links and
//   small labels on white. Use the base brand color for fills, icons and large elements.

const colors = {
  // Surfaces
  background: '#FFFFFF', // main background
  surface: '#F8F7F8', // grouped sections, slightly off-white (4% dark gray)

  // Text
  foreground: '#000000', // body text and titles: black (21:1 on white)
  muted: '#484349', // subtitles and secondary text: brand gray (9.7:1 on white)

  // Lines
  border: '#E4E3E4', // decorative dividers
  'border-strong': '#888589', // input outlines and other essential boundaries (3.6:1 on white)

  // Primary: teal. Main actions, selection, links.
  primary: '#20A39E', // fills and large elements; white text on it only when large/bold (3.1:1)
  'primary-strong': '#19827E', // text/links on white, pressed state, buttons with small text (4.6:1)
  'on-primary': '#FFFFFF',

  // Accent: yellow. Highlights and "needs attention" states (e.g. pending). Never as text on white.
  accent: '#FFBA49',
  'on-accent': '#000000', // black on yellow (12.4:1)

  // Danger: orange. Errors and destructive actions.
  danger: '#E4572E', // fills and icons
  'danger-strong': '#B64524', // error text on white, destructive buttons with small text (5.4:1)
  'on-danger': '#FFFFFF',
};

module.exports = { colors };

import { styled } from '@mui/material/styles';

import { tokens } from '@/theme';

export const CodeBlock = styled('pre')(({ theme }) => ({
  margin: 0,
  padding: theme.spacing(1.5, 2),
  overflowX: 'auto',
  backgroundColor: tokens.rowAlt,
  border: `1px solid ${tokens.border}`,
  borderRadius: theme.shape.borderRadius,
  fontFamily: '"SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace',
  fontSize: 13,
  lineHeight: 1.55,
  color: tokens.black,
  tabSize: 2,
}));

import Table from '@mui/material/Table';
import { styled } from '@mui/material/styles';

import { tokens } from '@/theme';

import { rowActionsHoverSx } from './row-actions-sx';

export const CatalogTable = styled(Table)(({ theme }) => ({
  '& th': { fontWeight: 600, whiteSpace: 'nowrap' },
  '& td, & th': { borderColor: theme.palette.divider },
  '& td': { verticalAlign: 'top' },
  '& tbody tr:nth-of-type(even)': { backgroundColor: tokens.rowAlt },
  '& tbody tr.row-inactive td': { color: theme.palette.text.secondary },
  '& tbody tr:last-of-type td': { borderBottom: 0 },
  ...rowActionsHoverSx,
}));

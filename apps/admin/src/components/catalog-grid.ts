import useMediaQuery from '@mui/material/useMediaQuery';
import type { DataGridProps } from '@mui/x-data-grid';

import { tokens } from '@/theme';

import { rowActionsHoverSx } from './row-actions-sx';

const baseGridProps = {
  autoHeight: true,
  disableRowSelectionOnClick: true,
  pageSizeOptions: [20, 50, 100],
  getRowClassName: ({ row, indexRelativeToCurrentPage }) =>
    [indexRelativeToCurrentPage % 2 ? 'row-alt' : '', row.is_active ? '' : 'row-inactive'].join(
      ' ',
    ),
  sx: {
    '& .row-alt': { bgcolor: tokens.rowAlt },
    '& .row-inactive .MuiDataGrid-cell': { color: 'text.secondary' },
    ...rowActionsHoverSx,
    '@media (pointer: coarse)': {
      '& .MuiDataGrid-cell:has(.row-actions)': { overflow: 'visible' },
    },
    '& .MuiDataGrid-overlayWrapper': { minHeight: 200 },
  },
} satisfies Partial<DataGridProps>;

export function useCatalogGridProps() {
  const touch = useMediaQuery('(pointer: coarse)');
  return { ...baseGridProps, rowHeight: touch ? 84 : 68 };
}

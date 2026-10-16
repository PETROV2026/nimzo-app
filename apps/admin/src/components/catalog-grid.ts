import type { DataGridProps } from '@mui/x-data-grid';

import { tokens } from '@/theme';

import { rowActionsHoverSx } from './row-actions-sx';

export const catalogGridProps = {
  autoHeight: true,
  rowHeight: 68,
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
    '& .MuiDataGrid-overlayWrapper': { minHeight: 200 },
  },
} satisfies Partial<DataGridProps>;

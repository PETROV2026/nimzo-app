export const rowActionsHoverSx = {
  '& .row-actions': { visibility: 'hidden' },
  '& tr:hover .row-actions, & tr:focus-within .row-actions, & .MuiDataGrid-row:hover .row-actions, & .MuiDataGrid-row:focus-within .row-actions':
    { visibility: 'visible' },
  '@media (hover: none)': { '& .row-actions': { visibility: 'visible' } },
} as const;

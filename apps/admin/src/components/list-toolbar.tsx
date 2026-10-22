import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

export function ListToolbar({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        mb: 1.5,
      }}
    >
      {children}
    </Box>
  );
}

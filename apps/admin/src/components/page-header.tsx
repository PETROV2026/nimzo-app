import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  action?: ReactNode;
  description?: string;
};

export function PageHeader({ title, action, description }: PageHeaderProps) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
        <Typography variant="h1">{title}</Typography>
        {action}
      </Box>
      {description && (
        <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 720 }}>
          {description}
        </Typography>
      )}
    </Box>
  );
}

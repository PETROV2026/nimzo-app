import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  /** Secondary action shown right next to the title, like WordPress' "Añadir nuevo". */
  action?: ReactNode;
  description?: string;
};

/** Page title row: title top-left with its action next to it (F-pattern hot zone). */
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

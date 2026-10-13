import ArrowBack from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

type PageHeaderProps = {
  title: string;
  description?: string;
  /** Primary action(s), right-aligned on wide screens. Keep it to one primary action. */
  actions?: ReactNode;
  back?: { to: string; label: string };
};

/** Title block shared by every admin page: big heading, one line of context and the page action. */
export function PageHeader({ title, description, actions, back }: PageHeaderProps) {
  return (
    <Box sx={{ mb: 4 }}>
      {back && (
        <Button
          component={Link}
          to={back.to}
          startIcon={<ArrowBack />}
          color="inherit"
          sx={{ mb: 2, ml: -1.5, color: 'text.secondary' }}
        >
          {back.label}
        </Button>
      )}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h2" component="h1">
            {title}
          </Typography>
          {description && (
            <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 640 }}>
              {description}
            </Typography>
          )}
        </Box>
        {actions && <Box sx={{ display: 'flex', gap: 1.5 }}>{actions}</Box>}
      </Box>
    </Box>
  );
}

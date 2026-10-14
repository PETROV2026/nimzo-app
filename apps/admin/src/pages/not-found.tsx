import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTranslate } from '@refinedev/core';
import { Link } from 'react-router';

export function NotFoundPage() {
  const translate = useTranslate();

  return (
    <Box sx={{ display: 'grid', justifyItems: 'center', gap: 1.5, mt: 12, textAlign: 'center' }}>
      <Typography variant="h1" sx={{ fontSize: 48 }}>
        404
      </Typography>
      <Typography color="text.secondary">{translate('pages.error.info')}</Typography>
      <Button component={Link} to="/" variant="contained">
        {translate('pages.error.backHome')}
      </Button>
    </Box>
  );
}

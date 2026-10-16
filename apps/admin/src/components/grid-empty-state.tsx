import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export function GridEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', p: 4, textAlign: 'center' }}>
      <Box>
        <Typography sx={{ fontWeight: 600 }} gutterBottom>
          {title}
        </Typography>
        <Typography color="text.secondary">{description}</Typography>
      </Box>
    </Box>
  );
}

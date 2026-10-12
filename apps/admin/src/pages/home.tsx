import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { reportStatusLabels, reportStatusSchema } from '@nimzo/shared';

// Placeholder page. Confirms the panel builds, MUI renders and @nimzo/shared resolves.
export function HomePage() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Nimzo · Panel de administración
      </Typography>
      <Typography color="text.secondary" gutterBottom>
        Estados del reporte:
      </Typography>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mt: 2 }}>
        {reportStatusSchema.options.map((status) => (
          <Chip key={status} label={reportStatusLabels[status]} variant="outlined" />
        ))}
      </Stack>
    </Container>
  );
}

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import logo from '@nimzo/brand/logos/logo-horizontal-color.png';
import { reportStatusLabels, reportStatusSchema } from '@nimzo/shared';

// Placeholder page. Confirms the panel builds, MUI renders and the shared packages resolve.
export function HomePage() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Box component="img" src={logo} alt="Nimzo" sx={{ height: 56, mb: 3 }} />
      <Typography variant="h4" component="h1" gutterBottom>
        Panel de administración
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

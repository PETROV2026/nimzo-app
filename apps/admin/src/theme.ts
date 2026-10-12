import { esES as materialEsES } from '@mui/material/locale';
import { createTheme } from '@mui/material/styles';
import { esES as dataGridEsES } from '@mui/x-data-grid/locales';
import { RefineThemes } from '@refinedev/mui';

// Refine's base theme with Spanish texts for MUI components and the DataGrid.
export const theme = createTheme(RefineThemes.Blue, materialEsES, dataGridEsES);

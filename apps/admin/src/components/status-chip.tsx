import Chip from '@mui/material/Chip';

export function StatusChip({ active }: { active: boolean }) {
  return active ? (
    <Chip size="small" label="Activo" color="primary" />
  ) : (
    <Chip size="small" label="Inactivo" variant="outlined" />
  );
}

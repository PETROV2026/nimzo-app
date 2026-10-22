import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router';

type RowActionsProps = {
  active: boolean;
  onToggleActive?: () => void;
  pending?: boolean;
  editTo?: string;
  onEdit?: () => void;
  label: string;
};

export function RowActions({
  active,
  onToggleActive,
  pending,
  editTo,
  onEdit,
  label,
}: RowActionsProps) {
  return (
    <Box
      className="row-actions"
      sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontSize: 13, mt: 0.25 }}
    >
      {editTo ? (
        <Link
          component={RouterLink}
          to={editTo}
          className="touch-target"
          aria-label={`Editar ${label}`}
          sx={{ fontSize: 13 }}
        >
          Editar
        </Link>
      ) : (
        <Link
          component="button"
          type="button"
          onClick={onEdit}
          className="touch-target"
          aria-label={`Editar ${label}`}
          sx={{ fontSize: 13 }}
        >
          Editar
        </Link>
      )}
      {onToggleActive && (
        <>
          <Box component="span" aria-hidden sx={{ color: 'text.disabled' }}>
            |
          </Box>
          <Link
            component="button"
            type="button"
            onClick={onToggleActive}
            disabled={pending}
            className="touch-target"
            aria-label={`${active ? 'Desactivar' : 'Activar'} ${label}`}
            sx={{ fontSize: 13, color: active ? 'error.main' : 'primary.main' }}
          >
            {active ? 'Desactivar' : 'Activar'}
          </Link>
        </>
      )}
    </Box>
  );
}

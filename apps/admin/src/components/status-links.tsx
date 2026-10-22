import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import { useList } from '@refinedev/core';

import { statusCrudFilter, type StatusFilter } from '@/lib/status-filter';

const order: StatusFilter[] = ['all', 'active', 'inactive'];

function useStatusCount(resource: string, status: StatusFilter) {
  const { result } = useList({
    resource,
    filters: statusCrudFilter(status),
    pagination: { pageSize: 1 },
  });
  return result.total;
}

type StatusLinksProps = {
  resource: string;
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
  labels: Record<StatusFilter, string>;
};

export function StatusLinks({ resource, value, onChange, labels }: StatusLinksProps) {
  const counts = {
    all: useStatusCount(resource, 'all'),
    active: useStatusCount(resource, 'active'),
    inactive: useStatusCount(resource, 'inactive'),
  };

  return (
    <Box
      component="ul"
      aria-label="Filtrar por estado"
      sx={{ display: 'flex', flexWrap: 'wrap', listStyle: 'none', m: 0, p: 0 }}
    >
      {order.map((filter, index) => {
        const current = filter === value;
        return (
          <Box component="li" key={filter} sx={{ display: 'flex', alignItems: 'center' }}>
            {index > 0 && (
              <Box component="span" aria-hidden sx={{ px: 1, color: 'text.disabled' }}>
                |
              </Box>
            )}
            <Link
              component="button"
              type="button"
              onClick={() => onChange(filter)}
              className="touch-target"
              aria-current={current ? 'true' : undefined}
              underline={current ? 'none' : 'hover'}
              sx={{
                fontSize: 13,
                fontWeight: current ? 700 : 500,
                color: current ? 'text.primary' : 'primary.main',
              }}
            >
              {labels[filter]}
              {counts[filter] !== undefined && (
                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                  {' '}
                  ({counts[filter]})
                </Box>
              )}
            </Link>
          </Box>
        );
      })}
    </Box>
  );
}

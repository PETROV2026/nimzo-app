import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import { useList } from '@refinedev/core';

import { type KindFilter, kindCrudFilter, kindFilters } from './kind-filter';

const labels: Record<KindFilter, string> = {
  all: 'Todos',
  bug: 'Fallas',
  idea: 'Ideas',
};

function useKindCount(kind: KindFilter) {
  const { result } = useList({
    resource: 'feedback_messages',
    filters: kindCrudFilter(kind),
    pagination: { pageSize: 1 },
  });
  return result.total;
}

export function KindLinks({
  value,
  onChange,
}: {
  value: KindFilter;
  onChange: (value: KindFilter) => void;
}) {
  const counts: Record<KindFilter, number | undefined> = {
    all: useKindCount('all'),
    bug: useKindCount('bug'),
    idea: useKindCount('idea'),
  };

  return (
    <Box
      component="ul"
      aria-label="Filtrar por tipo"
      sx={{ display: 'flex', flexWrap: 'wrap', listStyle: 'none', m: 0, p: 0 }}
    >
      {kindFilters.map((filter, index) => {
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

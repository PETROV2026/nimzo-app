import MuiBreadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router';

export type Crumb = { label?: string; to?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <MuiBreadcrumbs aria-label="Ubicación" sx={{ mb: 1, fontSize: 13 }}>
      {items.map((item, index) => {
        if (item.label === undefined) {
          return <Skeleton key={index} width={120} />;
        }
        return item.to ? (
          <Link
            key={index}
            component={RouterLink}
            to={item.to}
            className="touch-target"
            sx={{ fontSize: 13 }}
          >
            {item.label}
          </Link>
        ) : (
          <Typography key={index} sx={{ fontSize: 13 }} color="text.primary" aria-current="page">
            {item.label}
          </Typography>
        );
      })}
    </MuiBreadcrumbs>
  );
}

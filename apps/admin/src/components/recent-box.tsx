import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';

import { Postbox } from '@/components/postbox';

type RecentItem = { id: string; label: string; to: string; detail?: string; date: string };

type RecentBoxProps = {
  title: string;
  allTo: string;
  items: RecentItem[];
  loading: boolean;
  failed: boolean;
  failedText: string;
  emptyText: string;
};

const dateFormat = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function RecentBox({
  title,
  allTo,
  items,
  loading,
  failed,
  failedText,
  emptyText,
}: RecentBoxProps) {
  let content: ReactNode;
  if (loading) {
    content = (
      <>
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </>
    );
  } else if (failed) {
    content = <Typography color="error">{failedText}</Typography>;
  } else if (items.length === 0) {
    content = <Typography color="text.secondary">{emptyText}</Typography>;
  } else {
    content = (
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {items.map((item) => (
          <Box
            component="li"
            key={item.id}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 2,
              py: 1,
              borderBottom: 1,
              borderColor: 'divider',
              '&:last-of-type': { borderBottom: 0 },
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Link component={RouterLink} to={item.to} noWrap sx={{ display: 'block' }}>
                {item.label}
              </Link>
              {item.detail && (
                <Typography variant="body2" color="text.secondary" noWrap>
                  {item.detail}
                </Typography>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
              {dateFormat.format(new Date(item.date))}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Postbox
      title={title}
      collapsible
      action={
        <Link
          component={RouterLink}
          to={allTo}
          variant="body2"
          className="touch-target"
          aria-label={`Ver todos: ${title}`}
        >
          Ver todos
        </Link>
      }
    >
      {content}
    </Postbox>
  );
}

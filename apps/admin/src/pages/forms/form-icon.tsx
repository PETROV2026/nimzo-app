import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import Box from '@mui/material/Box';

import { formIconUrl } from '@/lib/form-icons';
import { tokens } from '@/theme';

export function FormIcon({ path, size = 40 }: { path: string | null | undefined; size?: number }) {
  const url = formIconUrl(path);
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
        color: tokens.teal,
      }}
    >
      {url ? (
        <Box
          component="img"
          src={url}
          alt=""
          loading="lazy"
          sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      ) : (
        <DescriptionOutlined sx={{ fontSize: size * 0.8 }} />
      )}
    </Box>
  );
}

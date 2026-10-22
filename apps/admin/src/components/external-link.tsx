import OpenInNew from '@mui/icons-material/OpenInNew';
import Link from '@mui/material/Link';
import type { ReactNode } from 'react';

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="touch-target"
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
    >
      {children}
      <OpenInNew sx={{ fontSize: 14 }} aria-hidden />
      <span className="visually-hidden">(se abre en otra pestaña)</span>
    </Link>
  );
}

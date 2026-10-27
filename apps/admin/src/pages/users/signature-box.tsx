import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { signatureBucket } from '@nimzo/shared';
import { useEffect, useState } from 'react';

import { Postbox } from '@/components/postbox';
import { supabase } from '@/lib/supabase';

type SignatureState = { path: string; url: string | null } | null;

export function SignatureBox({ path, name }: { path: string | null; name: string }) {
  const [signature, setSignature] = useState<SignatureState>(null);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    void supabase.storage
      .from(signatureBucket)
      .createSignedUrl(path, 300)
      .then(({ data }) => {
        if (!cancelled) setSignature({ path, url: data?.signedUrl ?? null });
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  const loading = !!path && signature?.path !== path;

  return (
    <Postbox title="Firma">
      {!path ? (
        <Typography color="text.secondary">
          Aún no ha capturado su firma. La dibuja el técnico desde Perfil en la app.
        </Typography>
      ) : loading ? (
        <Skeleton variant="rectangular" height={120} />
      ) : signature?.url ? (
        <Box
          component="img"
          src={signature.url}
          alt={`Firma de ${name}`}
          sx={{
            display: 'block',
            maxWidth: 360,
            width: '100%',
            height: 'auto',
            bgcolor: 'common.white',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
          }}
        />
      ) : (
        <Typography color="text.secondary">
          No se pudo cargar la firma. Recarga la página para intentar de nuevo.
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
        Solo el técnico puede cambiarla, desde Perfil en la app.
      </Typography>
    </Postbox>
  );
}

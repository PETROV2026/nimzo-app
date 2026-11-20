import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid2';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import {
  type FeedbackMessage,
  feedbackFilesBucket,
  feedbackKindLabels,
  feedbackScreenLabel,
} from '@nimzo/shared';
import { useOne } from '@refinedev/core';
import { type ReactNode, useEffect, useState } from 'react';
import { useParams } from 'react-router';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { Notice } from '@/components/notice';
import { PageHeader } from '@/components/page-header';
import { Postbox } from '@/components/postbox';
import { supabase } from '@/lib/supabase';

import { formatMessageDate } from './format';

type MessageDetail = FeedbackMessage & {
  technician: { full_name: string; email: string | null } | null;
};

type SignedPhotos = { key: string; urls: (string | null)[] } | null;

function usePhotoUrls(paths: string[]) {
  const key = paths.join('|');
  const [photos, setPhotos] = useState<SignedPhotos>(null);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const list = key.split('|');
    void supabase.storage
      .from(feedbackFilesBucket)
      .createSignedUrls(list, 300)
      .then(({ data }) => {
        if (cancelled) return;
        setPhotos({
          key,
          urls: list.map((path) => data?.find((item) => item.path === path)?.signedUrl ?? null),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return { loading: Boolean(key) && photos?.key !== key, urls: photos?.urls ?? [] };
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box sx={{ py: 1, '&:not(:last-of-type)': { borderBottom: 1, borderColor: 'divider' } }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography component="div">{children}</Typography>
    </Box>
  );
}

function Photos({ paths }: { paths: string[] }) {
  const { loading, urls } = usePhotoUrls(paths);

  if (paths.length === 0) {
    return <Typography color="text.secondary">El técnico no adjuntó imágenes.</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      {paths.map((path, index) =>
        loading ? (
          <Skeleton key={path} variant="rectangular" width={200} height={200} />
        ) : urls[index] ? (
          <Link
            key={path}
            href={urls[index] ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Abrir la imagen ${index + 1} en otra pestaña`}
          >
            <Box
              component="img"
              src={urls[index] ?? undefined}
              alt={`Imagen ${index + 1} del mensaje`}
              sx={{
                display: 'block',
                width: 200,
                height: 200,
                objectFit: 'cover',
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            />
          </Link>
        ) : (
          <Typography key={path} color="text.secondary">
            No se pudo cargar la imagen {index + 1}. Recarga la página para intentar de nuevo.
          </Typography>
        ),
      )}
    </Box>
  );
}

export function MessageShow() {
  const { id = '' } = useParams();
  const { result, query } = useOne<MessageDetail>({
    resource: 'feedback_messages',
    id,
    meta: { select: '*, technician:profiles(full_name, email)' },
  });

  const title = result
    ? `${feedbackKindLabels[result.kind]} del ${formatMessageDate(result.created_at)}`
    : undefined;

  return (
    <>
      <Breadcrumbs items={[{ label: 'Mensajes', to: '/messages' }, { label: title }]} />
      <PageHeader title="Mensaje" />

      {query.isError ? (
        <Notice severity="error" title="No se pudo cargar el mensaje">
          Puede que ya no exista o que tu sesión haya vencido. Regresa a Mensajes e intenta de
          nuevo.
        </Notice>
      ) : !result ? (
        <Skeleton variant="rectangular" height={240} />
      ) : (
        <Grid container spacing={2.5} sx={{ alignItems: 'flex-start' }}>
          <Grid size={{ xs: 12, lg: 8, xl: 9 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Postbox title="Mensaje">
                <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                  {result.message}
                </Typography>
              </Postbox>
              <Postbox title="Imágenes">
                <Photos paths={result.photo_paths} />
              </Postbox>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, lg: 4, xl: 3 }}>
            <Postbox title="Detalles">
              <Detail label="Tipo">
                <Chip
                  size="small"
                  label={feedbackKindLabels[result.kind]}
                  color={result.kind === 'bug' ? 'warning' : 'primary'}
                  variant={result.kind === 'bug' ? 'filled' : 'outlined'}
                />
              </Detail>
              <Detail label="Técnico">
                {result.technician?.full_name ?? '—'}
                {result.technician?.email && (
                  <Typography variant="body2" color="text.secondary">
                    {result.technician.email}
                  </Typography>
                )}
              </Detail>
              <Detail label="Pantalla">{feedbackScreenLabel(result.screen)}</Detail>
              <Detail label="Escrito">{formatMessageDate(result.written_at)}</Detail>
              <Detail label="Recibido">{formatMessageDate(result.created_at)}</Detail>
              <Detail label="Versión de la app">{result.app_version}</Detail>
              <Detail label="Versión de Android">{result.os_version}</Detail>
            </Postbox>
          </Grid>
        </Grid>
      )}
    </>
  );
}
